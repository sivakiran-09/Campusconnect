import { get, post, ApiError } from "../router.js";
import db, { uid } from "../db.js";

get("/skills", async (req, res, { json }) => json(200, db.skills));

post("/skills", async (req, res, { require, body, json }) => {
  const userId = require();
  const s = { id: uid("s"), userId, sessions: 0, tag: "Peer tutor", credits: Number(body.credits) || 10, minutes: Number(body.minutes) || 60, mentor: body.mentor || null, cat: body.cat || "Programming", title: String(body.title || "").trim(), desc: String(body.desc || "").trim(), swapFor: body.swapFor || "Campus Credits" };
  db.skills.unshift(s);
  json(201, s);
});

post("/skills/sessions", async (req, res, { require, body, json }) => {
  const userId = require();
  const sk = db.skills.find((x) => x.id === body.skillId);
  if (!sk) throw new ApiError(404, "Skill not found");
  const wallet = db.credits[userId] || (db.credits[userId] = { balance: 0, ledger: [] });
  const minutes = Number(body.minutes) || sk.minutes;
  const credits = body.mode === "credits" ? Math.max(1, Math.round((sk.credits / sk.minutes) * minutes)) : 0;
  if (credits > wallet.balance) throw new ApiError(402, "Not enough Campus Credits");
  if (credits) {
    wallet.balance -= credits;
    wallet.ledger.unshift({ id: uid("l"), delta: -credits, note: `${sk.title} (held until complete)`, at: Date.now() });
  }
  const ss = { id: uid("ss"), skillId: sk.id, userId: sk.userId, bookedBy: userId, when: body.when, zone: body.zone, minutes, credits, mode: body.mode, status: "BOOKED" };
  db.sessions.unshift(ss);
  json(201, ss);
});

post("/skills/sessions/:id/complete", async (req, res, { params, require, json }) => {
  require();
  const ss = db.sessions.find((s) => s.id === params.id);
  if (ss) ss.status = "COMPLETED";
  json(200, ss || {});
});
