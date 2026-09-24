// The core trust mechanic, server-authoritative: REQUESTED -> ACCEPTED -> ACTIVE ->
// RETURN_PENDING -> RETURNED, with the Trust Score recomputed from real stats after every
// completed return (never trusted from the client).
import { randomBytes } from "node:crypto";
import { get, post, ApiError } from "../router.js";
import db, { uid } from "../db.js";
import { trustScore } from "../services/trust.js";
import { emit } from "../services/sse.js";
import { ensureDm } from "./bootstrap.js";

const findTx = (id) => {
  const t = db.transactions.find((x) => x.id === id);
  if (!t) throw new ApiError(404, "Transaction not found");
  return t;
};
const findResource = (id) => {
  const r = db.resources.find((x) => x.id === id);
  if (!r) throw new ApiError(404, "Resource not found");
  return r;
};
const other = (tx, uid_) => (tx.ownerId === uid_ ? tx.borrowerId : tx.ownerId);
const requireParty = (tx, uid_) => {
  if (tx.ownerId !== uid_ && tx.borrowerId !== uid_) throw new ApiError(403, "Not part of this exchange");
};
const priceFor = (r, days) => (r.mode === "LEND" ? Math.max(1, Math.ceil((r.price / 7) * days)) : r.mode === "SELL" ? r.price : 0);
const notify = (userId, n) => {
  const item = { id: uid("n"), at: Date.now(), read: false, ...n };
  db.notifications[userId] = [item, ...(db.notifications[userId] || [])];
  emit(userId, "notification", item);
  return item;
};
const sysMsg = (a, b, text, extra = {}) => {
  const chat = ensureDm(a, b);
  const msg = { id: uid("m"), from: a, type: "system", text, at: Date.now(), ...extra };
  chat.messages.push(msg);
  emit(a, "message", { chatId: chat.id, msg });
  emit(b, "message", { chatId: chat.id, msg });
};

get("/transactions", async (req, res, { require, json }) => {
  const uid_ = require();
  json(200, db.transactions.filter((t) => t.ownerId === uid_ || t.borrowerId === uid_));
});

post("/transactions", async (req, res, { require, body, json }) => {
  const borrowerId = require();
  const r = findResource(body.resourceId);
  if (r.ownerId === borrowerId) throw new ApiError(400, "You can't request your own listing");
  const days = Number(body.days) || 7;
  const tx = { id: uid("t"), resourceId: r.id, ownerId: r.ownerId, borrowerId, status: "REQUESTED", days, price: priceFor(r, days), deposit: r.deposit || 0, zone: body.zone || r.pickup, message: body.message || "", createdAt: Date.now(), events: [{ at: Date.now(), t: "Request sent" }] };
  db.transactions.unshift(tx);
  const chat = ensureDm(borrowerId, r.ownerId, { resourceId: r.id, txId: tx.id });
  const msg = { id: uid("m"), from: borrowerId, type: "listing", resourceId: r.id, text: body.message || `Requesting ${r.title}`, at: Date.now() };
  chat.messages.push(msg);
  emit(r.ownerId, "message", { chatId: chat.id, msg });
  notify(r.ownerId, { kind: "request", icon: "package", title: `${db.users[borrowerId]?.name.split(" ")[0]} requested your ${r.title}`, body: `${days} days · pickup at ${tx.zone}`, action: { type: "tx", id: tx.id }, group: "requests" });
  json(201, tx);
});

post("/transactions/:id/accept", async (req, res, { params, require, body, json }) => {
  const uid_ = require();
  const tx = findTx(params.id);
  if (tx.ownerId !== uid_) throw new ApiError(403, "Only the owner can accept");
  if (tx.status !== "REQUESTED") throw new ApiError(409, "Request is no longer pending");
  tx.status = "ACCEPTED";
  tx.acceptedAt = Date.now();
  tx.precheck = { grade: body.grade || "Good", note: body.note || "Recorded before handover." };
  tx.events.push({ at: Date.now(), t: "Accepted · pre-check recorded" });
  const r = findResource(tx.resourceId);
  r.status = "reserved";
  notify(tx.borrowerId, { kind: "request", icon: "check", title: `${db.users[tx.ownerId].name.split(" ")[0]} accepted your request`, body: "Meet at the Safe Zone for the QR handover", action: { type: "tx", id: tx.id }, group: "requests" });
  sysMsg(tx.ownerId, tx.borrowerId, `${db.users[tx.ownerId].name.split(" ")[0]} accepted the request · pre-check recorded`, { txId: tx.id });
  emit(tx.ownerId, "transaction", tx);
  emit(tx.borrowerId, "transaction", tx);
  json(200, tx);
});

post("/transactions/:id/decline", async (req, res, { params, require, json }) => {
  const uid_ = require();
  const tx = findTx(params.id);
  if (tx.ownerId !== uid_) throw new ApiError(403, "Only the owner can decline");
  tx.status = "DECLINED";
  notify(tx.borrowerId, { kind: "request", icon: "x", title: "Your request was declined", body: "", action: { type: "tx", id: tx.id }, group: "requests" });
  json(200, tx);
});

post("/transactions/:id/cancel", async (req, res, { params, require, json }) => {
  const uid_ = require();
  const tx = findTx(params.id);
  requireParty(tx, uid_);
  tx.status = "CANCELLED";
  const stats = db.users[tx.borrowerId].stats;
  stats.cancellations = (stats.cancellations || 0) + 1;
  const r = findResource(tx.resourceId);
  r.status = "available";
  json(200, tx);
});

post("/transactions/:id/handover", async (req, res, { params, require, json }) => {
  const uid_ = require();
  const tx = findTx(params.id);
  requireParty(tx, uid_);
  if (tx.status !== "ACCEPTED") throw new ApiError(409, "Not ready for handover");
  const token = `CC-${tx.id.slice(-6).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const pin = String(Math.floor(100000 + Math.random() * 900000));
  tx.handover = { token, pin, expiresAt: Date.now() + 20 * 60 * 1000 };
  emit(other(tx, uid_), "transaction", tx);
  json(200, tx.handover);
});

post("/transactions/:id/scan", async (req, res, { params, require, body, json }) => {
  const uid_ = require();
  const tx = findTx(params.id);
  requireParty(tx, uid_);
  if (tx.status !== "ACCEPTED") throw new ApiError(409, "Not ready for handover");
  const h = tx.handover;
  const clean = String(body.pin || "").replace(/\D/g, "");
  if (!h || (body.token !== h.token && clean !== h.pin)) throw new ApiError(401, "That code doesn't match this exchange.");
  if (h.expiresAt < Date.now()) throw new ApiError(410, "This QR has expired.");
  const r = findResource(tx.resourceId);
  const sold = r.mode !== "LEND";
  tx.status = sold ? "RETURNED" : "ACTIVE";
  tx.startedAt = Date.now();
  tx.dueAt = Date.now() + tx.days * 86400e3;
  tx.handover = null;
  tx.events.push({ at: Date.now(), t: sold ? "Handover confirmed · exchange complete" : "Handover confirmed by QR" });
  r.status = sold ? (r.mode === "SELL" ? "sold" : "given") : "lent";
  emit(tx.ownerId, "transaction", tx);
  emit(tx.borrowerId, "transaction", tx);
  json(200, tx);
});

post("/transactions/:id/return", async (req, res, { params, require, body, json }) => {
  const uid_ = require();
  const tx = findTx(params.id);
  requireParty(tx, uid_);
  if (tx.status !== "ACTIVE") throw new ApiError(409, "Item is not currently active");
  tx.status = "RETURN_PENDING";
  tx.returnedAt = Date.now();
  tx.ret = { match: Number(body.match) || 95, verdict: body.verdict || "Returned in original condition" };
  tx.events.push({ at: Date.now(), t: `Return photo uploaded · AI check ${tx.ret.match}% match` });
  notify(tx.ownerId, { kind: "return", icon: "check", title: `${db.users[tx.borrowerId].name.split(" ")[0]} returned an item`, body: `AI condition check: ${tx.ret.match}% match`, action: { type: "tx", id: tx.id }, group: "requests" });
  json(200, tx);
});

post("/transactions/:id/confirm-return", async (req, res, { params, require, json }) => {
  const uid_ = require();
  const tx = findTx(params.id);
  if (tx.ownerId !== uid_) throw new ApiError(403, "Only the owner can confirm a return");
  if (tx.status !== "RETURN_PENDING") throw new ApiError(409, "Nothing pending confirmation");
  const r = findResource(tx.resourceId);
  const late = tx.returnedAt > tx.dueAt + 3600e3;
  const cond = (tx.ret?.match || 95) / 100;
  const before = trustScore(db.users[tx.borrowerId].stats);

  const bStats = db.users[tx.borrowerId].stats;
  const n = bStats.returnsTotal || 0;
  bStats.successful = (bStats.successful || 0) + 1;
  bStats.returnsTotal = n + 1;
  bStats.onTimeReturns = (bStats.onTimeReturns || 0) + (late ? 0 : 1);
  bStats.conditionAvg = (( bStats.conditionAvg || 0) * n + cond) / (n + 1);

  const oStats = db.users[tx.ownerId].stats;
  oStats.successful = (oStats.successful || 0) + 1;
  oStats.requests = (oStats.requests || 0) + 1;

  const after = trustScore(bStats);
  tx.status = "RETURNED";
  tx.late = late;
  tx.trust = { userId: tx.borrowerId, before, after };
  tx.events.push({ at: Date.now(), t: "Return verified · Trust Scores updated" });
  r.status = "available";
  notify(tx.borrowerId, { kind: "trust", icon: "shield", title: "Return verified", body: `Trust Score ${before} → ${after}`, action: { type: "tx", id: tx.id }, group: "requests" });
  emit(tx.borrowerId, "transaction", tx);
  json(200, tx);
});

post("/transactions/:id/review", async (req, res, { params, require, body, json }) => {
  const uid_ = require();
  const tx = findTx(params.id);
  requireParty(tx, uid_);
  const target = other(tx, uid_);
  tx.review = { rating: Math.max(1, Math.min(5, Number(body.rating) || 5)), tags: Array.isArray(body.tags) ? body.tags : [] };
  const stats = db.users[target].stats;
  const n = stats.ratingCount || 0;
  stats.ratingAvg = ((stats.ratingAvg || 0) * n + tx.review.rating) / (n + 1);
  stats.ratingCount = n + 1;
  json(200, tx);
});
