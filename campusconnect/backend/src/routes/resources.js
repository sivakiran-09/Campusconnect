import { get, post, del, ApiError } from "../router.js";
import db, { uid } from "../db.js";
import { matchOne } from "../services/matching.js";

const findResource = (id) => {
  const r = db.resources.find((x) => x.id === id);
  if (!r) throw new ApiError(404, "Resource not found");
  return r;
};

get("/resources", async (req, res, { json, query }) => {
  const mine = query.get("mine");
  const rows = mine ? db.resources.filter((r) => r.ownerId === mine) : db.resources;
  json(200, rows);
});

post("/resources", async (req, res, { require, body, json }) => {
  const ownerId = require();
  const r = {
    id: uid("r"),
    status: "available",
    likes: 0,
    comments: [],
    deposit: Number(body.deposit) || 0,
    maxDays: Number(body.maxDays) || 14,
    images: Array.isArray(body.images) ? body.images.slice(0, 4) : [],
    createdAt: Date.now(),
    ownerId,
    title: String(body.title || "Untitled item"),
    subtitle: body.subtitle || "",
    mode: ["LEND", "SELL", "DONATE"].includes(body.mode) ? body.mode : "LEND",
    category: body.category || "books",
    subject: body.subject || "",
    code: body.code || "",
    sem: body.sem ?? null,
    branch: body.branch || "ALL",
    condition: body.condition || "Good",
    desc: body.desc || "",
    price: body.mode === "DONATE" ? 0 : Number(body.price) || 0,
    pickup: body.pickup || "lib",
    distanceM: 0,
    tags: Array.isArray(body.tags) ? body.tags : [],
    art: body.art || { kind: "book", hue: 220, label: (body.title || "Item").slice(0, 9) },
  };
  db.resources.unshift(r);
  json(201, r);
});

post("/resources/:id/like", async (req, res, { params, require, json }) => {
  require();
  const r = findResource(params.id);
  r.likes = Math.max(0, (r.likes || 0) + 1);
  json(200, r);
});
post("/resources/:id/save", async (req, res, { params, json }) => {
  findResource(params.id);
  json(200, { ok: true });
});
post("/resources/:id/comments", async (req, res, { params, require, body, json }) => {
  const userId = require();
  const r = findResource(params.id);
  const c = { id: uid("c"), userId, text: String(body.text || "").slice(0, 500), at: Date.now() };
  r.comments = [...(r.comments || []), c];
  json(201, c);
});

/** Natural-language resource search — the same intent parser used by /ai/match, exposed directly too. */
get("/resources/search", async (req, res, { query, json }) => {
  const q = query.get("q") || "";
  json(200, matchOne(q, db.resources, db.users));
});

get("/wishlist", async (req, res, { require, json }) => json(200, db.wishlist[require()] || []));
post("/wishlist", async (req, res, { require, body, json }) => {
  const userId = require();
  const w = { id: uid("w"), title: String(body.title || "").trim(), mode: body.mode || "ANY", maxPrice: body.maxPrice ?? null, alerts: body.alerts !== false, createdAt: Date.now() };
  db.wishlist[userId] = [w, ...(db.wishlist[userId] || [])];
  json(201, w);
});
del("/wishlist/:id", async (req, res, { params, require, json }) => {
  const userId = require();
  db.wishlist[userId] = (db.wishlist[userId] || []).filter((w) => w.id !== params.id);
  json(200, { ok: true });
});
