import { get, post } from "../router.js";
import db, { uid } from "../db.js";

get("/knowledge", async (req, res, { json }) => json(200, db.knowledge));

post("/knowledge", async (req, res, { require, body, json }) => {
  const authorId = require();
  const p = { id: uid("k"), authorId, likes: 0, comments: 0, saves: 0, helpful: 0, createdAt: Date.now(), type: body.type || "Notes", title: String(body.title || "").trim(), company: body.company || "", body: String(body.body || "").trim(), tags: Array.isArray(body.tags) ? body.tags : [] };
  db.knowledge.unshift(p);
  json(201, p);
});

post("/knowledge/:id/like", async (req, res, { params, require, json }) => {
  require();
  const p = db.knowledge.find((k) => k.id === params.id);
  if (p) p.likes = Math.max(0, (p.likes || 0) + 1);
  json(200, p || {});
});

post("/knowledge/:id/comments", async (req, res, { params, require, body, json }) => {
  const userId = require();
  const p = db.knowledge.find((k) => k.id === params.id);
  if (!p) return json(404, { error: "Post not found" });
  p.comments = (p.comments || 0) + 1;
  db.postComments = db.postComments || {};
  const c = { id: uid("c"), userId, text: body.text, at: Date.now() };
  db.postComments[params.id] = [...(db.postComments[params.id] || []), c];
  json(201, c);
});
