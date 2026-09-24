import { get, patch } from "../router.js";
import db, { IMPACT_CAMPUS } from "../db.js";
import { trustScore } from "../services/trust.js";

/** A dm/group/ai chat, reshaped for one specific viewer (peer id, unread count, etc). */
export function chatForUser(chat, uid) {
  const messages = chat.messages || [];
  const unread = messages.filter((m) => m.from !== uid && (!chat.readAt?.[uid] || m.at > chat.readAt[uid])).length;
  const base = { id: chat.type === "ai" ? "ai" : chat.id, type: chat.type, unread, messages, muted: !!chat.mutedBy?.[uid], context: chat.context };
  if (chat.type === "group") return { ...base, title: chat.title, members: chat.members, memberCount: chat.members.length };
  if (chat.type === "dm") return { ...base, peer: chat.members.find((m) => m !== uid) };
  return { ...base, title: "Campus AI", pinned: true };
}
export function chatsForUser(uid) {
  const own = Object.values(db.chats).filter((c) => c.type === "ai" && c.owner === uid);
  const others = Object.values(db.chats).filter((c) => (c.type === "dm" || c.type === "group") && c.members.includes(uid));
  return [...own, ...others].map((c) => chatForUser(c, uid));
}
export function ensureAiChat(uid) {
  const id = `ai:${uid}`;
  if (!db.chats[id]) db.chats[id] = { id, type: "ai", owner: uid, messages: [] };
  return db.chats[id];
}
export function dmId(a, b) {
  return `dm:${[a, b].sort().join(":")}`;
}
export function ensureDm(a, b, context) {
  const id = dmId(a, b);
  if (!db.chats[id]) db.chats[id] = { id, type: "dm", members: [a, b], messages: [], context };
  else if (context) db.chats[id].context = context;
  return db.chats[id];
}

get("/bootstrap", async (req, res, { require, json }) => {
  const uid = require();
  const me = db.users[uid];
  ensureAiChat(uid);
  json(200, {
    meId: uid,
    users: db.users,
    resources: db.resources,
    wishlist: db.wishlist[uid] || [],
    transactions: db.transactions.filter((t) => t.ownerId === uid || t.borrowerId === uid),
    skills: db.skills,
    sessions: db.sessions.filter((s) => s.userId === uid || s.bookedBy === uid),
    credits: db.credits[uid] || { balance: 0, ledger: [] },
    knowledge: db.knowledge,
    stories: [],
    chats: chatsForUser(uid),
    notifications: db.notifications[uid] || [],
    impact: { campus: IMPACT_CAMPUS, me: { saved: 0, reused: me?.stats.successful || 0, co2: 0, level: 1, posts: db.knowledge.filter((k) => k.authorId === uid).length, sessions: 0, exchanges: me?.stats.successful || 0, hoursTaught: 0 } },
    trust: trustScore(me?.stats),
  });
});

patch("/users/me", async (req, res, { require, body, json }) => {
  const uid = require();
  const allowed = ["name", "bio", "branch", "sem", "teach", "want"];
  for (const k of allowed) if (k in body) db.users[uid][k] = body[k];
  if (body.branch && body.sem) db.users[uid].batch = `${body.branch} '${String(new Date().getFullYear() + Math.ceil((9 - body.sem) / 2)).slice(2)}`;
  json(200, db.users[uid]);
});
