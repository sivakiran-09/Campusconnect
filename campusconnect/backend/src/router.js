// A ~120-line stand-in for Express: path-param routing, JSON body parsing, a tiny multipart
// parser for single-file image uploads, and consistent JSON error responses. Every handler
// has the shape (req, res, ctx) => void | Promise<void>, same mental model as Express
// middleware, so porting a route to real Express later is a copy-paste job.
import { verifyToken } from "./services/auth.js";

const routes = []; // { method, regex, keys, handler }

function toRegex(path) {
  const keys = [];
  const pattern = path.replace(/:[^/]+/g, (m) => {
    keys.push(m.slice(1));
    return "([^/]+)";
  });
  return { regex: new RegExp(`^${pattern}$`), keys };
}

export function route(method, path, handler) {
  const { regex, keys } = toRegex(path);
  routes.push({ method, regex, keys, handler });
}
export const get = (p, h) => route("GET", p, h);
export const post = (p, h) => route("POST", p, h);
export const patch = (p, h) => route("PATCH", p, h);
export const del = (p, h) => route("DELETE", p, h);

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > 20 * 1024 * 1024) return reject(new ApiError(413, "Payload too large"));
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/** Parses a single-file `multipart/form-data` body (enough for the image-upload endpoint). */
function parseMultipart(buf, contentType) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
  const boundary = m && (m[1] || m[2]);
  if (!boundary) return { fields: {}, file: null };
  const marker = Buffer.from(`--${boundary}`);
  const parts = [];
  let start = buf.indexOf(marker);
  while (start !== -1) {
    const next = buf.indexOf(marker, start + marker.length);
    if (next === -1) break;
    parts.push(buf.slice(start + marker.length, next));
    start = next;
  }
  const fields = {};
  let file = null;
  for (const part of parts) {
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) continue;
    const header = part.slice(0, headerEnd).toString("utf8");
    let body = part.slice(headerEnd + 4);
    if (body.slice(-2).toString() === "\r\n") body = body.slice(0, -2);
    const nameM = /name="([^"]+)"/.exec(header);
    const fileM = /filename="([^"]*)"/.exec(header);
    const typeM = /Content-Type:\s*([^\r\n]+)/i.exec(header);
    if (!nameM) continue;
    if (fileM && fileM[1]) file = { field: nameM[1], filename: fileM[1], mime: typeM ? typeM[1].trim() : "application/octet-stream", data: body };
    else fields[nameM[1]] = body.toString("utf8");
  }
  return { fields, file };
}

function send(res, status, body) {
  const json = JSON.stringify(body ?? {});
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(json);
}

export async function handle(req, res, { corsOrigin } = {}) {
  const url = new URL(req.url, "http://localhost");
  res.setHeader("Access-Control-Allow-Origin", corsOrigin || "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.writeHead(204).end();

  const match = routes.find((r) => r.method === req.method && r.regex.test(url.pathname));
  if (!match) return send(res, 404, { error: "Not found" });
  const params = {};
  const m = match.regex.exec(url.pathname);
  match.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));

  const authHeader = req.headers.authorization || "";
  const token = url.searchParams.get("token") || (authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "");
  const userId = verifyToken(token);

  let body = {};
  let file = null;
  const ctype = req.headers["content-type"] || "";
  if (req.method !== "GET" && req.method !== "DELETE") {
    const raw = await readBody(req).catch((e) => {
      send(res, e.status || 400, { error: e.message });
      return null;
    });
    if (raw === null) return;
    if (ctype.includes("multipart/form-data")) {
      const parsed = parseMultipart(raw, ctype);
      body = parsed.fields;
      file = parsed.file;
    } else if (raw.length) {
      try {
        body = JSON.parse(raw.toString("utf8"));
      } catch {
        return send(res, 400, { error: "Invalid JSON body" });
      }
    }
  }

  try {
    await match.handler(req, res, { params, query: url.searchParams, body, file, userId, json: (status, data) => send(res, status, data), require: () => { if (!userId) throw new ApiError(401, "Sign in required"); return userId; } });
  } catch (e) {
    if (e instanceof ApiError || e.status) send(res, e.status || 400, { error: e.message });
    else {
      console.error(e);
      send(res, 500, { error: "Internal server error" });
    }
  }
}
