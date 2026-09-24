// Single source of truth. A tiny external store (no Redux needed) + an `actions` object.
// Demo Mode: everything runs locally and simulates the other students.
// API Mode (VITE_API_URL set): actions update the UI optimistically, call the backend, then reconcile via /bootstrap.
import { useSyncExternalStore } from "react";
import * as seed from "./seed.js";
import { uid, now, ago, inDays, inr, distance } from "./format.js";
import { trustBreakdown } from "./trust.js";
import { API_ON, api, setToken, getToken, openStream } from "./api.js";
import { matchResources } from "./matching.js";
import { buildKnowledgeIndex, FAQS } from "./retrieval.js";
import { askCampusAi } from "./campusAi.js";

const KEY = "cc_state_v3";
const clone = (x) => JSON.parse(JSON.stringify(x));

/* ---------- bus: lets the store trigger UI (toasts, navigation) without importing React ---------- */
export const bus = { toast: () => {}, route: () => {} };
const toast = (t) => bus.toast(t);

/* ---------- initial state ---------- */
function initial() {
  return {
    auth: { status: "out", email: "" },
    meId: "u_me",
    users: clone(seed.USERS),
    resources: clone(seed.RESOURCES),
    wishlist: clone(seed.WISHLIST),
    transactions: clone(seed.TRANSACTIONS),
    skills: clone(seed.SKILLS),
    sessions: clone(seed.SESSIONS),
    credits: clone(seed.CREDITS),
    knowledge: clone(seed.KNOWLEDGE),
    stories: clone(seed.STORIES),
    chats: clone(seed.CHATS),
    notifications: clone(seed.NOTIFICATIONS),
    impact: clone(seed.IMPACT),
    likes: { r_dbms: false },
    saved: { r_guitar: true },
    kLikes: {},
    kSaved: {},
    postComments: {},
    theme: "system",
    prefs: { wishlist: true, returns: true, messages: true, showDistance: true },
    flags: { live: false },
    browse: { mode: null, cat: null },
    typing: {},
    aiTyping: false,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return { ...initial(), ...s, typing: {}, aiTyping: false };
  } catch {
    return null;
  }
}

let state = load() || initial();
const subs = new Set();
let saveT;
function persist() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    try {
      const { typing, aiTyping, ...rest } = state;
      localStorage.setItem(KEY, JSON.stringify(rest));
    } catch {
      /* storage full or unavailable: the app keeps working in memory */
    }
  }, 350);
}
export const getState = () => state;
export function set(patch) {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  persist();
  subs.forEach((f) => f());
}
const subscribe = (f) => (subs.add(f), () => subs.delete(f));
export const useStore = (sel) => useSyncExternalStore(subscribe, () => sel(state), () => sel(state));
export const useMe = () => useStore((s) => s.users[s.meId]);
export const useUser = (id) => useStore((s) => s.users[id]);

const upd = (list, id, fn) => list.map((x) => (x.id === id ? { ...x, ...(typeof fn === "function" ? fn(x) : fn) } : x));
const me = () => state.users[state.meId];
export const isMine = (uidv) => uidv === state.meId;

/* ---------- helpers ---------- */
export const COLLEGE_EMAIL = /^[^\s@]+@([a-z0-9-]+\.)*(edu|ac\.[a-z]{2}|edu\.[a-z]{2})$/i;
export const isCollegeEmail = (e) => COLLEGE_EMAIL.test((e || "").trim());

export function priceFor(r, days = 7) {
  if (r.mode === "LEND") return Math.max(1, Math.ceil((r.price / 7) * days));
  if (r.mode === "SELL") return r.price;
  return 0;
}
export const txRole = (tx, id = state.meId) => (tx.ownerId === id ? "owner" : "borrower");
export const txOther = (tx, id = state.meId) => (tx.ownerId === id ? tx.borrowerId : tx.ownerId);
export const isActiveTx = (tx) => ["REQUESTED", "ACCEPTED", "ACTIVE", "RETURN_PENDING"].includes(tx.status);
export const needsMyAction = (tx) => {
  const role = txRole(tx);
  if (tx.status === "REQUESTED") return role === "owner";
  if (tx.status === "ACCEPTED") return true;
  if (tx.status === "ACTIVE") return role === "borrower";
  if (tx.status === "RETURN_PENDING") return role === "owner";
  return false;
};
export const wishlistMatches = (s = state) => {
  const pool = s.resources.filter((r) => r.ownerId !== s.meId && (!r.status || r.status === "available"));
  const out = [];
  s.wishlist.forEach((w) => {
    const { results } = matchResources(w.title, pool, s.users, { limit: 1 });
    const hit = results[0];
    if (hit && hit.pct >= 55 && (!w.maxPrice || hit.r.price <= w.maxPrice)) out.push({ w, r: hit.r, pct: hit.pct });
  });
  return out;
};
export const knowledgeIndexOf = (() => {
  let last, idx;
  return (posts) => (posts === last ? idx : ((last = posts), (idx = buildKnowledgeIndex(posts, FAQS))));
})();

const remote = (method, path, body) => {
  if (!API_ON) return Promise.resolve(null);
  return api(path, { method, body })
    .then((r) => (scheduleRefresh(), r))
    .catch((e) => (toast({ title: "Couldn't sync with the server", body: e.message, tone: "alert" }), null));
};
let refreshT;
const scheduleRefresh = () => {
  clearTimeout(refreshT);
  refreshT = setTimeout(hydrate, 600);
};
export async function hydrate() {
  if (!API_ON) return;
  try {
    const d = await api("/bootstrap");
    set({ ...d, auth: { status: "in", email: d.users?.[d.meId]?.email || state.auth.email } });
  } catch (e) {
    if (e.status === 401) actions.logout();
  }
}

function notify(n, { silent = false } = {}) {
  const item = { id: uid("n"), at: now(), read: false, group: "social", ...n };
  set((s) => ({ notifications: [item, ...s.notifications] }));
  if (!silent)
    toast({ title: item.title, body: item.body, tone: n.tone || (n.kind === "wishlist" ? "alert" : ""), icon: item.icon, action: item.action ? { label: n.actionLabel || "View", run: () => bus.route(item.action) } : null });
  return item;
}

function bumpStats(id, fn) {
  set((s) => ({ users: { ...s.users, [id]: { ...s.users[id], stats: fn(s.users[id].stats) } } }));
}

function addMsg(chatId, msg) {
  const m = { id: uid("m"), at: now(), ...msg };
  set((s) => ({ chats: s.chats.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, m], unread: msg.from !== s.meId && !msg.silentRead ? (c.unread || 0) + 1 : c.unread } : c)) }));
  return m;
}

function openChat(userId, context) {
  const ex = state.chats.find((c) => c.type === "dm" && c.peer === userId);
  if (ex) {
    if (context) set((s) => ({ chats: upd(s.chats, ex.id, { context }) }));
    return ex.id;
  }
  const id = uid("c");
  set((s) => ({ chats: [{ id, type: "dm", peer: userId, unread: 0, messages: [], context }, ...s.chats] }));
  return id;
}

function smartReply(text, chat) {
  const t = text.toLowerCase();
  if (/still available|available\?/.test(t)) return "Yes, still available! When would you like to pick it up?";
  if (/library|safe desk|meet|pick ?up|where/.test(t)) return "Central Library Safe Desk works for me. Around 5pm? I'll bring the QR.";
  if (/extend|extra day|more day/.test(t)) return "No problem, extend it by a couple of days. Just update it in the app 👍";
  if (/thank|thanks|thx/.test(t)) return "Anytime! 🙌";
  if (/price|cheaper|less|discount|negotiat/.test(t)) return "The price is already capped for students, but I can do a small discount for a longer rental.";
  if (/swap|teach|learn|lesson|session/.test(t)) return "Sounds great. Let's book a slot in Skill Swap so credits are tracked.";
  if (/\?$/.test(t)) return "Good question! Let me check and get back to you in a bit.";
  return ["Sure 👍", "Sounds good!", "Got it, thanks for letting me know 🙂", "Perfect, see you then!"][Math.floor(Math.random() * 4)];
}

/* ---------- actions ---------- */
export const actions = {
  /* auth */
  async requestOtp(email) {
    if (!isCollegeEmail(email)) throw new Error("Use your college email (for example name@campusname.ac.in). Personal emails aren't accepted.");
    if (API_ON) return api("/auth/request-otp", { method: "POST", body: { email } });
    return { devOtp: "123456" };
  },
  async verifyOtp(email, code) {
    if (API_ON) {
      const r = await api("/auth/verify-otp", { method: "POST", body: { email, otp: code } });
      setToken(r.token);
      if (!r.isNew) await hydrate();
      return { isNew: !!r.isNew };
    }
    if (code !== "123456") throw new Error("That code isn't right. In demo mode the code is 123456.");
    return { isNew: true };
  },
  loginDemo() {
    set({ auth: { status: "in", email: "rahul.s@campus.edu" }, users: { ...state.users, u_me: { ...state.users.u_me, ...clone(seed.USERS.u_me) } } });
    setTimeout(() => {
      const stuck = state.transactions.find((t) => t.status === "ACCEPTED" && t.borrowerId === state.meId && !t.handover);
      if (stuck) actions._autoGenerateHandover(stuck.id);
    }, 5000);
  },
  completeProfile(p) {
    const name = p.name || "New student";
    const handle = (p.email || state.auth.email || "student").split("@")[0].toLowerCase();
    const fresh = {
      ...state.users[state.meId],
      name,
      handle,
      email: p.email || state.auth.email,
      branch: p.branch,
      sem: p.sem,
      batch: `${p.branch} '${String(new Date().getFullYear() + Math.ceil((9 - p.sem) / 2)).slice(2)}`,
      teach: p.teach || [],
      want: p.want || [],
      bio: p.bio || "",
      stats: { verified: true, successful: 0, onTimeReturns: 0, returnsTotal: 0, conditionAvg: 0, ratingAvg: 0, ratingCount: 0, cancellations: 0, requests: 0 },
    };
    set((s) => ({
      users: { ...s.users, [s.meId]: fresh },
      resources: s.resources.filter((r) => r.ownerId !== s.meId),
      transactions: [],
      chats: s.chats.filter((c) => c.type === "ai" || c.type === "group"),
      wishlist: [],
      sessions: [],
      credits: { balance: 20, ledger: [{ id: uid("l"), delta: 20, note: "Welcome bonus", at: now() }] },
      notifications: [{ id: uid("n"), kind: "trust", icon: "shield", title: "Welcome to CampusConnect", body: "Your college email is verified. List your first item to start building your Trust Score.", at: now(), read: false, group: "social" }],
      impact: { ...s.impact, me: { saved: 0, reused: 0, co2: 0, level: 1, posts: 0, sessions: 0, exchanges: 0, hoursTaught: 0 } },
    }));
    set({ auth: { status: "in", email: fresh.email } });
    remote("PATCH", "/users/me", { name, branch: p.branch, sem: p.sem, teach: p.teach, want: p.want });
  },
  updateProfile(patch) {
    set((s) => ({ users: { ...s.users, [s.meId]: { ...s.users[s.meId], ...patch } } }));
    remote("PATCH", "/users/me", patch);
    toast({ title: "Profile updated", icon: "check", tone: "success" });
  },
  logout() {
    setToken("");
    set({ auth: { status: "out", email: "" } });
  },
  resetDemo() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    state = initial();
    subs.forEach((f) => f());
  },
  setTheme(theme) {
    set({ theme });
  },
  setPref(k, v) {
    set((s) => ({ prefs: { ...s.prefs, [k]: v } }));
  },

  /* listings */
  toggleLike(id) {
    const on = !state.likes[id];
    set((s) => ({ likes: { ...s.likes, [id]: on }, resources: upd(s.resources, id, (r) => ({ likes: Math.max(0, r.likes + (on ? 1 : -1)) })) }));
    remote("POST", `/resources/${id}/like`);
  },
  toggleSave(id) {
    const on = !state.saved[id];
    set((s) => ({ saved: { ...s.saved, [id]: on } }));
    toast({ title: on ? "Saved to your profile" : "Removed from saved", icon: "bookmark" });
    remote("POST", `/resources/${id}/save`);
  },
  addComment(id, text) {
    const c = { id: uid("c"), userId: state.meId, text, at: now() };
    set((s) => ({ resources: upd(s.resources, id, (r) => ({ comments: [...(r.comments || []), c] })) }));
    remote("POST", `/resources/${id}/comments`, { text });
  },
  createListing(d) {
    const r = { id: uid("r"), status: "available", likes: 0, comments: [], deposit: 0, maxDays: 14, createdAt: now(), ownerId: state.meId, distanceM: 0, tags: [], ...d };
    set((s) => ({ resources: [r, ...s.resources] }));
    remote("POST", "/resources", { ...d, images: (d.images || []).map((i) => i) });
    return r;
  },
  setResourceStatus(id, status) {
    set((s) => ({ resources: upd(s.resources, id, { status }) }));
  },

  /* wishlist */
  addWishlist(w) {
    const item = { id: uid("w"), alerts: true, createdAt: now(), ...w };
    set((s) => ({ wishlist: [item, ...s.wishlist] }));
    remote("POST", "/wishlist", w);
    const hit = wishlistMatches().find((x) => x.w.id === item.id);
    if (hit) toast({ title: "Already listed on campus", body: `${hit.r.title}, ${inr(hit.r.price)}${hit.r.mode === "LEND" ? "/wk" : ""}`, tone: "alert", icon: "sparkles", action: { label: "View", run: () => bus.route({ type: "item", id: hit.r.id }) } });
    else toast({ title: "Added to wishlist", body: "We'll alert you the moment someone lists it.", tone: "success", icon: "bell" });
  },
  removeWishlist(id) {
    set((s) => ({ wishlist: s.wishlist.filter((w) => w.id !== id) }));
    remote("DELETE", `/wishlist/${id}`);
  },
  toggleAlert(id) {
    set((s) => ({ wishlist: upd(s.wishlist, id, (w) => ({ alerts: !w.alerts })) }));
  },
  /** Demo helper: a matching listing "goes live" and the wishlist alert fires. */
  addLive(manual) {
    if (state.resources.some((r) => r.id === seed.LIVE_LISTING.id)) {
      if (manual) toast({ title: "The live listing is already on campus", body: "Open Resources to see it.", icon: "info" });
      return;
    }
    const r = { ...clone(seed.LIVE_LISTING), createdAt: now() };
    set((s) => ({ resources: [r, ...s.resources], flags: { ...s.flags, live: true } }));
    const wants = state.wishlist.find((w) => w.alerts && /operating|galvin/i.test(w.title));
    if (wants && state.prefs.wishlist)
      notify({ kind: "wishlist", icon: "sparkles", tone: "alert", title: "Your wishlist item is available!", body: `Operating Systems, 10th Edition · ${inr(25)}/week · ${distance(r.distanceM)} away`, action: { type: "item", id: r.id }, actionLabel: "View", group: "requests" });
  },

  /* transactions */
  requestItem(resourceId, { days = 7, zone, message } = {}) {
    const r = state.resources.find((x) => x.id === resourceId);
    const tx = { id: uid("t"), resourceId, ownerId: r.ownerId, borrowerId: state.meId, status: "REQUESTED", days, price: priceFor(r, days), deposit: r.deposit || 0, zone: zone || r.pickup, message, createdAt: now(), events: [{ at: now(), t: "Request sent" }] };
    set((s) => ({ transactions: [tx, ...s.transactions] }));
    bumpStats(state.meId, (st) => ({ ...st, requests: (st.requests || 0) + 1 }));
    const chatId = openChat(r.ownerId, { resourceId, txId: tx.id });
    addMsg(chatId, { from: state.meId, type: "listing", resourceId, text: r.mode === "DONATE" ? "I'd like to claim this" : r.mode === "SELL" ? "I'd like to reserve this" : `Requesting for ${days} days`, status: "sent" });
    if (message) addMsg(chatId, { from: state.meId, text: message, status: "sent" });
    remote("POST", "/transactions", { resourceId, days, zone, message });
    if (!API_ON) setTimeout(() => actions._autoAccept(tx.id), 4200);
    return tx;
  },
  _autoAccept(txId) {
    const tx = state.transactions.find((t) => t.id === txId);
    if (!tx || tx.status !== "REQUESTED") return;
    const r = state.resources.find((x) => x.id === tx.resourceId);
    actions.acceptRequest(txId, { grade: r.condition === "Excellent" ? "Excellent" : "Good", note: `${r.condition} condition. Recorded with photos before handover.` }, true);
    setTimeout(() => actions._autoGenerateHandover(txId), 2600);
  },
  /** Demo helper: the simulated owner generates the handover QR so a borrower isn't stuck waiting. */
  _autoGenerateHandover(txId) {
    const tx = state.transactions.find((t) => t.id === txId);
    if (!tx || tx.status !== "ACCEPTED" || tx.handover) return;
    const h = actions.generateHandover(txId);
    const other = txOther(tx);
    const chatId = openChat(other, { resourceId: tx.resourceId, txId });
    addMsg(chatId, { from: other, type: "system", text: `${state.users[other].name.split(" ")[0]} generated the handover QR · scan it to confirm`, txId });
    notify({ kind: "request", icon: "qr", tone: "alert", title: "Handover QR ready", body: `${state.users[other].name.split(" ")[0]} is ready to meet at the Safe Zone`, action: { type: "tx", id: txId }, actionLabel: "Scan now", group: "requests" });
    return h;
  },
  acceptRequest(txId, precheck, auto = false) {
    const tx = state.transactions.find((t) => t.id === txId);
    set((s) => ({
      transactions: upd(s.transactions, txId, (t) => ({ status: "ACCEPTED", acceptedAt: now(), precheck, events: [...(t.events || []), { at: now(), t: "Accepted · pre-check recorded" }] })),
      resources: upd(s.resources, tx.resourceId, { status: "reserved" }),
    }));
    const other = txOther(tx);
    const chatId = openChat(other, { resourceId: tx.resourceId, txId });
    if (auto) {
      addMsg(chatId, { from: tx.ownerId, type: "system", text: `${state.users[tx.ownerId].name.split(" ")[0]} accepted your request · pre-check recorded`, txId });
      notify({ kind: "request", icon: "check", tone: "success", title: `${state.users[tx.ownerId].name.split(" ")[0]} accepted your request`, body: "Meet at the Safe Zone and scan the handover QR", action: { type: "tx", id: txId }, actionLabel: "Open", group: "requests" });
    } else addMsg(chatId, { from: state.meId, type: "system", text: "You accepted the request · pre-check recorded", txId, silentRead: true });
    remote("POST", `/transactions/${txId}/accept`, precheck);
  },
  declineRequest(txId) {
    set((s) => ({ transactions: upd(s.transactions, txId, { status: "DECLINED" }) }));
    remote("POST", `/transactions/${txId}/decline`);
    toast({ title: "Request declined", icon: "x" });
  },
  cancelRequest(txId) {
    const tx = state.transactions.find((t) => t.id === txId);
    set((s) => ({ transactions: upd(s.transactions, txId, { status: "CANCELLED" }), resources: upd(s.resources, tx.resourceId, { status: "available" }) }));
    bumpStats(state.meId, (st) => ({ ...st, cancellations: (st.cancellations || 0) + 1 }));
    remote("POST", `/transactions/${txId}/cancel`);
    toast({ title: "Request cancelled", body: "Cancellations lightly affect your Trust Score.", icon: "x" });
  },
  generateHandover(txId) {
    const token = `CC-${txId.slice(-6).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const handover = { token, pin, expiresAt: now() + 20 * 60 * 1000 };
    set((s) => ({ transactions: upd(s.transactions, txId, { handover }) }));
    remote("POST", `/transactions/${txId}/handover`);
    return handover;
  },
  confirmHandover(txId, code) {
    const tx = state.transactions.find((t) => t.id === txId);
    const h = tx.handover;
    const clean = String(code || "").replace(/\D/g, "");
    const ok = h && (code === h.token || clean === h.pin);
    if (!ok) throw new Error("That code doesn't match this exchange. Check the QR or PIN and try again.");
    if (h.expiresAt < now()) throw new Error("This QR has expired. Ask the owner to generate a new one.");
    actions._activate(txId);
    remote("POST", `/transactions/${txId}/scan`, { token: h.token, pin: clean });
  },
  _activate(txId) {
    const tx = state.transactions.find((t) => t.id === txId);
    const r = state.resources.find((x) => x.id === tx.resourceId);
    const sold = r.mode !== "LEND";
    set((s) => ({
      transactions: upd(s.transactions, txId, (t) => ({ status: sold ? "RETURNED" : "ACTIVE", startedAt: now(), dueAt: inDays(t.days), handover: null, returnedAt: sold ? now() : undefined, events: [...(t.events || []), { at: now(), t: sold ? "Handover confirmed · exchange complete" : "Handover confirmed by QR" }] })),
      resources: upd(s.resources, tx.resourceId, { status: sold ? (r.mode === "SELL" ? "sold" : "given") : "lent" }),
    }));
    if (sold) actions._bookImpact(txId);
    notify({ kind: "request", icon: "check", tone: "success", title: sold ? "Handover complete" : "Handover confirmed · exchange is ACTIVE", body: sold ? `${r.title} has a new home` : `Return by ${new Date(state.transactions.find((t) => t.id === txId).dueAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} to keep your on-time streak`, action: { type: "tx", id: txId }, actionLabel: "Open", group: "requests" });
  },
  submitReturn(txId, ret) {
    set((s) => ({ transactions: upd(s.transactions, txId, (t) => ({ status: "RETURN_PENDING", returnedAt: now(), ret, events: [...(t.events || []), { at: now(), t: `Return photo uploaded · AI check ${ret.match}% match` }] })) }));
    remote("POST", `/transactions/${txId}/return`, { match: ret.match, verdict: ret.verdict });
    const tx = state.transactions.find((t) => t.id === txId);
    if (!API_ON && txRole(tx) === "borrower") setTimeout(() => actions.confirmReturn(txId, true), 5200);
  },
  confirmReturn(txId, auto = false) {
    const tx = state.transactions.find((t) => t.id === txId);
    if (!tx || tx.status !== "RETURN_PENDING") return;
    const r = state.resources.find((x) => x.id === tx.resourceId);
    const late = (tx.returnedAt || now()) > (tx.dueAt || now()) + 60 * 60 * 1000;
    const cond = (tx.ret?.match || 95) / 100;
    const bump = (st, isBorrower) => {
      const n = st.returnsTotal || 0;
      return {
        ...st,
        successful: (st.successful || 0) + 1,
        returnsTotal: isBorrower ? n + 1 : n,
        onTimeReturns: (st.onTimeReturns || 0) + (isBorrower && !late ? 1 : 0),
        conditionAvg: isBorrower ? ((st.conditionAvg || 0) * n + cond) / (n + 1) : st.conditionAvg,
        requests: (st.requests || 0) + (isBorrower ? 0 : 1),
      };
    };
    const before = trustBreakdown(state.users[tx.borrowerId].stats).score;
    const afterStats = bump(state.users[tx.borrowerId].stats, true);
    const after = trustBreakdown(afterStats).score;
    set((s) => ({
      users: { ...s.users, [tx.borrowerId]: { ...s.users[tx.borrowerId], stats: afterStats }, [tx.ownerId]: { ...s.users[tx.ownerId], stats: bump(s.users[tx.ownerId].stats, false) } },
      transactions: upd(s.transactions, txId, (t) => ({ status: "RETURNED", late, trust: { userId: t.borrowerId, before, after }, events: [...(t.events || []), { at: now(), t: "Return verified · Trust Scores updated" }] })),
      resources: upd(s.resources, tx.resourceId, { status: "available" }),
    }));
    actions._bookImpact(txId);
    if (auto) notify({ kind: "trust", icon: "shield", tone: "success", title: "Return verified", body: `${r.title} returned ${late ? "late" : "on time"}. Trust Score ${before} → ${after}`, action: { type: "tx", id: txId }, actionLabel: "Review", group: "requests" });
    else toast({ title: "Return confirmed", body: `${state.users[tx.borrowerId].name.split(" ")[0]}'s Trust Score is now ${after}`, tone: "success", icon: "shield" });
    remote("POST", `/transactions/${txId}/confirm-return`);
  },
  _bookImpact(txId) {
    const tx = state.transactions.find((t) => t.id === txId);
    const r = state.resources.find((x) => x.id === tx.resourceId);
    const saved = r.mode === "LEND" ? r.price * 30 : r.mode === "DONATE" ? 450 : Math.round(r.price * 1.2);
    set((s) => {
      const c = s.impact.campus;
      const mine = tx.borrowerId === s.meId;
      return { impact: { ...s.impact, campus: { ...c, reused: c.reused + 1, savings: c.savings + saved }, me: mine ? { ...s.impact.me, saved: s.impact.me.saved + saved, reused: s.impact.me.reused + 1, co2: s.impact.me.co2 + 1, exchanges: s.impact.me.exchanges + 1 } : s.impact.me } };
    });
  },
  submitReview(txId, review) {
    const tx = state.transactions.find((t) => t.id === txId);
    const other = txOther(tx);
    set((s) => ({ transactions: upd(s.transactions, txId, { review }) }));
    bumpStats(other, (st) => {
      const n = st.ratingCount || 0;
      return { ...st, ratingAvg: ((st.ratingAvg || 0) * n + review.rating) / (n + 1), ratingCount: n + 1 };
    });
    remote("POST", `/transactions/${txId}/review`, review);
    toast({ title: "Review posted", body: "Thanks. Reviews keep the community trustworthy.", tone: "success", icon: "star" });
  },

  /* chat */
  openChat,
  sendMessage(chatId, msg) {
    const chat = state.chats.find((c) => c.id === chatId);
    const m = addMsg(chatId, { from: state.meId, status: "sent", silentRead: true, ...msg });
    remote("POST", `/chats/${chatId}/messages`, msg);
    if (API_ON) return;
    const peerId = chat.type === "dm" ? chat.peer : chat.members.filter((x) => x !== state.meId)[Math.floor(Math.random() * (chat.members.length - 1))];
    const setStatus = (status) => set((s) => ({ chats: s.chats.map((c) => (c.id === chatId ? { ...c, messages: c.messages.map((x) => (x.id === m.id ? { ...x, status } : x)) } : c)) }));
    setTimeout(() => setStatus("delivered"), 600);
    if (!peerId) return;
    setTimeout(() => {
      setStatus("read");
      set((s) => ({ typing: { ...s.typing, [chatId]: peerId } }));
    }, 1500);
    setTimeout(() => {
      set((s) => ({ typing: { ...s.typing, [chatId]: null } }));
      addMsg(chatId, { from: peerId, text: smartReply(msg.text || "", chat), silentRead: state.viewingChat === chatId });
      if (state.viewingChat === chatId) set((s) => ({ chats: upd(s.chats, chatId, { unread: 0 }) }));
    }, 3300);
  },
  react(chatId, msgId, emoji) {
    set((s) => ({
      chats: s.chats.map((c) => (c.id !== chatId ? c : { ...c, messages: c.messages.map((m) => {
        if (m.id !== msgId) return m;
        const cur = { ...(m.reactions || {}) };
        Object.keys(cur).forEach((e) => (cur[e] = cur[e].filter((u) => u !== s.meId)));
        if (!(m.reactions?.[emoji] || []).includes(s.meId)) cur[emoji] = [...(cur[emoji] || []), s.meId];
        Object.keys(cur).forEach((e) => !cur[e].length && delete cur[e]);
        return { ...m, reactions: cur };
      }) })),
    }));
  },
  deleteMessage(chatId, msgId) {
    set((s) => ({ chats: s.chats.map((c) => (c.id === chatId ? { ...c, messages: c.messages.map((m) => (m.id === msgId ? { ...m, deleted: true, text: "This message was deleted", type: "text", reactions: {} } : m)) } : c)) }));
  },
  markRead(chatId) {
    if (state.chats.find((c) => c.id === chatId)?.unread) set((s) => ({ chats: upd(s.chats, chatId, { unread: 0 }) }));
  },
  viewChat(id) {
    state = { ...state, viewingChat: id };
  },
  chatFlag(chatId, patch) {
    set((s) => ({ chats: upd(s.chats, chatId, patch) }));
  },
  deleteChat(chatId) {
    set((s) => ({ chats: s.chats.filter((c) => c.id !== chatId) }));
  },
  askAi(text) {
    const s0 = state;
    addMsg("ai", { from: s0.meId, text, status: "read", silentRead: true });
    set({ aiTyping: true });
    const run = async () => {
      let ans;
      if (API_ON) {
        try {
          ans = await api("/ai/chat", { method: "POST", body: { message: text } });
        } catch {
          ans = null;
        }
      }
      if (!ans) ans = askCampusAi(text, { resources: state.resources, users: state.users, knowledgeIndex: knowledgeIndexOf(state.knowledge), meId: state.meId });
      set({ aiTyping: false });
      addMsg("ai", { from: "ai", ...ans, silentRead: true });
    };
    setTimeout(run, 900 + Math.random() * 600);
  },

  /* knowledge */
  createPost(p) {
    const post = { id: uid("k"), authorId: state.meId, likes: 0, comments: 0, saves: 0, helpful: 0, createdAt: now(), tags: [], ...p };
    set((s) => ({ knowledge: [post, ...s.knowledge], impact: { ...s.impact, me: { ...s.impact.me, posts: s.impact.me.posts + 1 }, campus: { ...s.impact.campus, knowledge: s.impact.campus.knowledge + 1, interviews: s.impact.campus.interviews + (p.type === "Interview" ? 1 : 0) } } }));
    remote("POST", "/knowledge", p);
    return post;
  },
  toggleLikePost(id) {
    const on = !state.kLikes[id];
    set((s) => ({ kLikes: { ...s.kLikes, [id]: on }, knowledge: upd(s.knowledge, id, (k) => ({ likes: k.likes + (on ? 1 : -1) })) }));
    remote("POST", `/knowledge/${id}/like`);
  },
  toggleSavePost(id) {
    const on = !state.kSaved[id];
    set((s) => ({ kSaved: { ...s.kSaved, [id]: on }, knowledge: upd(s.knowledge, id, (k) => ({ saves: k.saves + (on ? 1 : -1) })) }));
    toast({ title: on ? "Saved to your library" : "Removed from saved", icon: "bookmark" });
  },
  addPostComment(id, text) {
    const c = { id: uid("c"), userId: state.meId, text, at: now() };
    set((s) => ({ postComments: { ...s.postComments, [id]: [...(s.postComments[id] || []), c] }, knowledge: upd(s.knowledge, id, (k) => ({ comments: k.comments + 1 })) }));
  },

  /* skills & credits */
  bookSession({ skillId, when, zone, mode, minutes }) {
    const sk = state.skills.find((x) => x.id === skillId);
    const credits = mode === "credits" ? Math.max(1, Math.round((sk.credits / sk.minutes) * minutes)) : 0;
    if (credits > state.credits.balance) throw new Error("Not enough Campus Credits. Teach a skill to earn more.");
    const ss = { id: uid("ss"), skillId, userId: sk.userId, when, zone, minutes, credits, mode, status: "BOOKED" };
    set((s) => ({
      sessions: [ss, ...s.sessions],
      credits: credits ? { balance: s.credits.balance - credits, ledger: [{ id: uid("l"), delta: -credits, note: `${sk.title} (held until complete)`, at: now() }, ...s.credits.ledger] } : s.credits,
    }));
    const chatId = openChat(sk.userId);
    addMsg(chatId, { from: state.meId, type: "system", text: `Session booked: ${sk.title} · ${when}`, silentRead: true });
    remote("POST", "/skills/sessions", { skillId, when, zone, mode, minutes });
    toast({ title: "Session booked", body: `${when} · ${state.users[sk.userId].name.split(" ")[0]}`, tone: "success", icon: "calendar" });
    return ss;
  },
  completeSession(id) {
    set((s) => ({ sessions: upd(s.sessions, id, { status: "COMPLETED" }), impact: { ...s.impact, me: { ...s.impact.me, sessions: s.impact.me.sessions + 1 }, campus: { ...s.impact.campus, skillExchanges: s.impact.campus.skillExchanges + 1 } } }));
    toast({ title: "Session completed", body: "Credits released. Rate your mentor to help others.", tone: "success", icon: "check" });
  },
  offerSkill(sk) {
    const item = { id: uid("s"), userId: state.meId, sessions: 0, tag: "Peer tutor", credits: 10, minutes: 60, mentor: null, ...sk };
    set((s) => ({ skills: [item, ...s.skills] }));
    remote("POST", "/skills", sk);
    toast({ title: "Skill offer published", body: "Earn +10 credits per hour you teach.", tone: "success", icon: "grad" });
  },

  /* misc */
  markStorySeen(id) {
    set((s) => ({ stories: upd(s.stories, id, { seen: true }) }));
  },
  markAllRead() {
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
    remote("POST", "/notifications/read");
  },
  readNotification(id) {
    set((s) => ({ notifications: upd(s.notifications, id, { read: true }) }));
  },
  notify,
};

/* ---------- realtime (API mode) ---------- */
let closeStream = () => {};
export function startRealtime() {
  closeStream();
  if (!API_ON || !getToken()) return;
  closeStream = openStream((type, data) => {
    if (type === "notification") toast({ title: data.title, body: data.body, icon: data.icon, tone: data.tone });
    if (type === "typing") set((s) => ({ typing: { ...s.typing, [data.chatId]: data.userId } }));
    hydrate();
  });
}
if (API_ON && getToken()) hydrate().then(startRealtime);
