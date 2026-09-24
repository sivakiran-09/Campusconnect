// CampusConnect backend — a reference implementation of the REST + SSE contract that
// frontend/src/lib/api.js speaks. Zero runtime dependencies on purpose (this sandbox has no
// network access to `npm install` Express/Mongoose), so this uses only Node's built-in
// `http` module. See README.md for the exact, mechanical path to swapping this for real
// Express + MongoDB in production — no frontend code changes, and no route *shape* changes.
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { handle } from "./router.js";

// Side-effect imports: each of these calls get/post/patch/del at module load time to
// register its routes with the router.
import "./routes/auth.js";
import "./routes/bootstrap.js";
import "./routes/resources.js";
import "./routes/transactions.js";
import "./routes/chats.js";
import "./routes/knowledge.js";
import "./routes/skills.js";
import "./routes/uploads.js";
import "./routes/ai.js";
import "./routes/stream.js";

const PORT = Number(process.env.PORT) || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url.startsWith("/uploads/")) {
    const file = join(process.cwd(), req.url);
    if (existsSync(file) && statSync(file).isFile()) {
      res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream", "Access-Control-Allow-Origin": CORS_ORIGIN });
      return createReadStream(file).pipe(res);
    }
    res.writeHead(404).end();
    return;
  }
  handle(req, res, { corsOrigin: CORS_ORIGIN });
});

server.listen(PORT, () => {
  console.log(`CampusConnect backend listening on http://localhost:${PORT}`);
  console.log(`CORS allowed origin: ${CORS_ORIGIN}`);
  console.log(`AI microservice proxy target: ${process.env.AI_SERVICE_URL || "(none — using local fallback)"}`);
});
