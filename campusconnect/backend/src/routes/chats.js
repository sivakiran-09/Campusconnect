import { post, ApiError } from "../router.js";
import db, { uid } from "../db.js";
import { emit } from "../services/sse.js";
import { ensureDm, ensureAiChat } from "./bootstrap.js";
import { askCampusAi } from "../services/ai.js";

const findChat = (id, uid_) => {
  const real = id === "ai" ? `ai:${uid_}` : id;
  const c = db.chats[real];
  if (!c) throw new ApiError(404, "Conversation not found");
  return c;
};

post("/chats/:id/messages", async (req, res, { params, require, body, json }) => {
  const userId = require();
  const chat = findChat(params.id, userId);
  const msg = { id: uid("m"), from: userId, at: Date.now(), text: body.text, type: body.type || "text", secs: body.secs, src: body.src, resourceId: body.resourceId, status: "sent" };
  chat.messages.push(msg);
  if (chat.type === "dm") emit(chat.members.find((m) => m !== userId), "message", { chatId: chat.id, msg });
  if (chat.type === "group") chat.members.forEach((m) => m !== userId && emit(m, "message", { chatId: chat.id, msg }));

  if (chat.type === "ai") {
    const reply = await askCampusAi(body.text, db);
    const aiMsg = { id: uid("m"), from: "ai", at: Date.now() + 1, ...reply };
    chat.messages.push(aiMsg);
    return json(201, { user: msg, ai: aiMsg });
  }
  json(201, msg);
});

post("/chats/open", async (req, res, { require, body, json }) => {
  const userId = require();
  if (body.peerId === "ai") return json(200, chatSummary(ensureAiChat(userId)));
  json(200, chatSummary(ensureDm(userId, body.peerId)));
});
const chatSummary = (c) => ({ id: c.type === "ai" ? "ai" : c.id });

post("/notifications/read", async (req, res, { require, json }) => {
  const userId = require();
  db.notifications[userId] = (db.notifications[userId] || []).map((n) => ({ ...n, read: true }));
  json(200, { ok: true });
});
