// College-email OTP + a minimal signed-token scheme (HMAC-SHA256), so no JWT library is
// required. Format: base64url(payload).base64url(signature) — same idea as a JWT, smaller.
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import db, { uid } from "../db.js";

const SECRET = process.env.AUTH_SECRET || "dev-secret-change-me";
const OTP_TTL_MS = 5 * 60 * 1000;
const TOKEN_TTL_MS = 30 * 24 * 3600 * 1000;
export const COLLEGE_EMAIL = /^[^\s@]+@([a-z0-9-]+\.)*(edu|ac\.[a-z]{2}|edu\.[a-z]{2})$/i;

const b64url = (buf) => Buffer.from(buf).toString("base64url");
const sign = (payload) => createHmac("sha256", SECRET).update(payload).digest();

export function requestOtp(email) {
  if (!COLLEGE_EMAIL.test(email)) {
    const err = new Error("Use your college email (for example name@campusname.ac.in).");
    err.status = 400;
    throw err;
  }
  const code = String(randomInt(0, 1000000)).padStart(6, "0");
  db.otps.set(email, { code, expiresAt: Date.now() + OTP_TTL_MS });
  // No real mail service in this sandbox: log it server-side, like a dev SMTP catcher would.
  console.log(`[auth] OTP for ${email}: ${code} (valid ${OTP_TTL_MS / 60000} min)`);
  return { sent: true, devOtp: code }; // devOtp is returned only because this is a local demo build
}

export function verifyOtp(email, otp) {
  const rec = db.otps.get(email);
  if (!rec || rec.expiresAt < Date.now() || rec.code !== String(otp)) {
    const err = new Error("That code isn't right or has expired.");
    err.status = 401;
    throw err;
  }
  db.otps.delete(email);
  let user = Object.values(db.users).find((u) => u.email === email);
  const isNew = !user;
  if (!user) {
    const id = uid("u");
    user = { id, name: "", handle: email.split("@")[0], email, branch: "", sem: null, batch: "", role: "Student", hue: Math.floor(Math.random() * 360), online: true, bio: "", teach: [], want: [], stats: { verified: true, cancellations: 0, requests: 0, successful: 0, onTimeReturns: 0, returnsTotal: 0, conditionAvg: 0, ratingAvg: 0, ratingCount: 0 } };
    db.users[id] = user;
    db.wishlist[id] = [];
    db.notifications[id] = [];
    db.credits[id] = { balance: 20, ledger: [{ id: uid("l"), delta: 20, note: "Welcome bonus", at: Date.now() }] };
  }
  const token = issueToken(user.id);
  return { token, isNew, userId: user.id };
}

export function issueToken(userId) {
  const payload = b64url(JSON.stringify({ uid: userId, exp: Date.now() + TOKEN_TTL_MS }));
  const sig = b64url(sign(payload));
  return `${payload}.${sig}`;
}

/** Returns the authenticated user id, or null. Never throws. */
export function verifyToken(token) {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const expected = b64url(sign(payload));
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.exp < Date.now()) return null;
    return db.users[data.uid] ? data.uid : null;
  } catch {
    return null;
  }
}
