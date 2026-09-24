import { useState } from "react";
import { Icon, CAT_ICON, MODE_ICON } from "../lib/icons.jsx";
import { Avatar, Stars } from "./kit.jsx";
import { CoverArt } from "./cover.jsx";
import { actions, useStore, txRole, txOther } from "../lib/store.jsx";
import { distance, inr, priceLabel, timeAgoLong, dueIn, fmtDate } from "../lib/format.js";
import { trustOf } from "../lib/trust.js";

export const returnRate = (u) => (u?.stats?.returnsTotal ? Math.round((u.stats.onTimeReturns / u.stats.returnsTotal) * 100) : null);
const COND = { Excellent: "Like-new", Good: "Good", "Minor damage": "Minor wear", Fair: "Fair" };
const ZONES = { lib: "Central Library", union: "Student Union", canteen: "Canteen", hostel: "Hostel A", gate: "Main Gate" };
export const zoneName = (id) => ZONES[id] || "Safe Zone";

export function ModeTag({ r, className = "" }) {
  const tone = r.mode === "SELL" ? "amber" : r.mode === "DONATE" ? "green" : "";
  return (
    <span className={`badge solid ${tone} ${className}`}>
      <Icon name={MODE_ICON[r.mode]} />
      {r.mode === "LEND" ? `LEND · ${inr(r.price)}/wk` : r.mode === "SELL" ? `SELL · ${inr(r.price)}` : "DONATE · Free"}
    </span>
  );
}

export function ListingCard({ r, onOpen, compact, onRequest, showNew }) {
  const owner = useStore((s) => s.users[r.ownerId]);
  const liked = useStore((s) => !!s.likes[r.id]);
  const meId = useStore((s) => s.meId);
  const mine = r.ownerId === meId;
  const rate = returnRate(owner);
  const unavailable = r.status && r.status !== "available";
  const cta = r.mode === "LEND" ? "Request lend" : r.mode === "SELL" ? "Reserve" : "Claim free";
  if (compact)
    return (
      <article className="lcard compact" onClick={() => onOpen(r)}>
        <div className="lc-media">
          <CoverArt r={r} />
          <ModeTag r={r} className="lc-mode" />
          {unavailable && <span className="lc-state">{r.status === "lent" ? "On loan" : r.status === "reserved" ? "Reserved" : "Gone"}</span>}
        </div>
        <div className="lc-body">
          <h3 className="clamp2">{r.title}</h3>
          <div className="row between tiny muted"><span className="truncate">{owner?.name.split(" ")[0]} · {r.distanceM ? distance(r.distanceM) : "Yours"}</span><span className="row gap-4"><Icon name="heart" size={12} />{r.likes}</span></div>
        </div>
      </article>
    );
  return (
    <article className="lcard">
      <div className="lc-media" onClick={() => onOpen(r)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen(r)}>
        <CoverArt r={r} />
        <ModeTag r={r} className="lc-mode" />
        <span className="lc-cond"><Icon name="ok" />{COND[r.condition] || r.condition}</span>
        <span className="lc-loc"><Icon name="pin" />{zoneName(r.pickup)}{r.distanceM ? ` · ${distance(r.distanceM)}` : ""}</span>
        {showNew || r.tag === "New" ? <span className="lc-new">New</span> : null}
        <button className={`lc-like ${liked ? "on" : ""}`} onClick={(e) => (e.stopPropagation(), actions.toggleLike(r.id))} aria-label={liked ? "Unlike" : "Like"} aria-pressed={liked}>
          <Icon name="heart" />
        </button>
        {unavailable && <span className="lc-state">{r.status === "lent" ? "Currently on loan" : r.status === "reserved" ? "Reserved" : "No longer available"}</span>}
      </div>
      <div className="lc-body">
        <div className="row between">
          <span className="badge">{r.code || (r.category === "cycles" ? "Campus" : r.subject)}{r.code && r.sem ? ` / ${r.sem}` : ""}</span>
          {r.tag && r.tag !== "New" && <span className="lc-tag"><Icon name={r.tag === "Instant Handoff" ? "qr" : "grad"} />{r.tag}</span>}
        </div>
        <h3 onClick={() => onOpen(r)}>{r.title}</h3>
        <p className="clamp2 soft-text small">{r.subtitle}</p>
        <div className="lc-foot">
          <div className="row grow" style={{ minWidth: 0 }}>
            <Avatar u={owner} size="sm" tick={owner?.role !== "Student"} />
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="small bold truncate">{mine ? "You" : owner?.name.split(" ")[0] + " " + (owner?.name.split(" ")[1]?.[0] || "") + "."}<span className="muted" style={{ fontWeight: 500 }}> {owner?.batch?.replace("CSE ", "").replace("ECE ", "").replace("Chem ", "")}</span></div>
              <div className="tiny green-text bold truncate">{rate != null ? `${rate}% return rate` : `Trust ${trustOf(owner)}`}</div>
            </div>
          </div>
          {mine ? (
            <button className="btn sm soft" onClick={() => onOpen(r)}>Manage</button>
          ) : (
            <button className={`btn sm ${r.mode === "DONATE" ? "green" : r.mode === "SELL" ? "amber" : ""}`} disabled={unavailable} onClick={() => (onRequest ? onRequest(r) : onOpen(r))}>{cta}</button>
          )}
        </div>
      </div>
    </article>
  );
}

export function PostCard({ p, onOpen, onAsk, full }) {
  const author = useStore((s) => s.users[p.authorId]);
  const liked = useStore((s) => !!s.kLikes[p.id]);
  const saved = useStore((s) => !!s.kSaved[p.id]);
  const [more, setMore] = useState(false);
  const paras = p.body.split("\n\n");
  return (
    <article className="pcard">
      <header className="row">
        <Avatar u={author} tick={author?.role !== "Student"} />
        <div className="grow">
          <div className="bold truncate">{author?.name}</div>
          <div className="tiny muted truncate">{author?.role !== "Student" ? author?.role + " · " : ""}{author?.batch} · {timeAgoLong(p.createdAt)}</div>
        </div>
        <span className={`badge ${p.type === "Notes" ? "green" : p.type === "Hackathon" ? "amber" : ""}`}>{p.type}</span>
      </header>
      <h3 className="ptitle" onClick={() => onOpen?.(p)}>{p.title}</h3>
      <div className={`pbody ${full || more ? "" : "clamp3"}`}>{full || more ? paras.map((t, i) => <p key={i}>{t}</p>) : p.body}</div>
      {!full && !more && <button className="link-btn" onClick={() => setMore(true)}>Read more</button>}
      <div className="row wrap gap-6 mt-8">{p.tags.slice(0, 4).map((t) => <span key={t} className="tagpill">#{t}</span>)}</div>
      <div className="pactions">
        <button className={liked ? "on" : ""} onClick={() => actions.toggleLikePost(p.id)} aria-pressed={liked} aria-label="Like"><Icon name="heart" style={{ fill: liked ? "currentColor" : "none" }} />{p.likes}</button>
        <button onClick={() => onOpen?.(p)} aria-label="Comments"><Icon name="comment" />{p.comments}</button>
        <button onClick={() => onAsk?.(p)} aria-label="Ask Campus AI about this"><Icon name="sparkles" />Ask AI</button>
        <span className="grow" />
        <button className={saved ? "on" : ""} onClick={() => actions.toggleSavePost(p.id)} aria-pressed={saved} aria-label="Save"><Icon name="bookmark" style={{ fill: saved ? "currentColor" : "none" }} /></button>
      </div>
      <div className="tiny muted" style={{ marginTop: 6 }}><Icon name="thumb" size={12} style={{ verticalAlign: "-2px" }} /> Helped {p.helpful} juniors</div>
    </article>
  );
}

export function SkillCard({ s, onBook, onOpenUser }) {
  const u = useStore((st) => st.users[s.userId]);
  const meId = useStore((st) => st.meId);
  return (
    <article className="scard">
      <div className="row" style={{ alignItems: "flex-start" }}>
        <button onClick={() => onOpenUser?.(u)} aria-label={`${u.name} profile`}><Avatar u={u} size="lg" tick /></button>
        <div className="grow">
          <div className="row gap-6 wrap"><b className="sc-name">{u.name.split(" ")[0]} {u.name.split(" ")[1]?.[0]}.</b><span className="badge green">{s.tag}</span><span className="row gap-4 small bold" style={{ color: "var(--amber)" }}><Icon name="star" size={13} style={{ fill: "var(--gold)", color: "var(--gold)" }} />{(u.stats.ratingAvg || 0).toFixed(2).replace(/0$/, "")}</span></div>
          <h3 className="sc-title">{s.title}</h3>
          <p className="small soft-text clamp2">{s.desc}</p>
        </div>
      </div>
      <div className="sc-swap">
        <div className="grow">
          <div className="tiny bold muted">Swap or credit</div>
          <div className="row gap-6 wrap small bold primary-text"><Icon name="swap" size={14} />{s.swapFor}<span className="muted" style={{ fontWeight: 500 }}>or</span><span style={{ color: "var(--amber)" }}>{s.credits} credits</span></div>
        </div>
        <button className="btn sm" disabled={s.userId === meId} onClick={() => onBook(s, "swap")}>{s.userId === meId ? "Your offer" : "Request swap"}</button>
      </div>
      {s.mentor && (
        <div className="sc-swap mentor">
          <div className="grow">
            <div className="tiny bold muted">Peer mentoring</div>
            <div className="small bold green-text row gap-6"><Icon name="ok" size={14} />{s.mentor.label}</div>
          </div>
          <button className="btn sm outline" disabled={s.userId === meId} onClick={() => onBook(s, "credits", s.mentor.minutes)}>Quick book</button>
        </div>
      )}
    </article>
  );
}

const STATUS = {
  REQUESTED: { label: "Requested", tone: "amber" },
  ACCEPTED: { label: "Ready for handover", tone: "" },
  ACTIVE: { label: "Active", tone: "green" },
  RETURN_PENDING: { label: "Return pending", tone: "amber" },
  RETURNED: { label: "Returned", tone: "green" },
  DECLINED: { label: "Declined", tone: "red" },
  CANCELLED: { label: "Cancelled", tone: "gray" },
};
export const statusOf = (s) => STATUS[s] || STATUS.REQUESTED;

export function TxCard({ tx, onOpen, action }) {
  const r = useStore((s) => s.resources.find((x) => x.id === tx.resourceId));
  const users = useStore((s) => s.users);
  const meId = useStore((s) => s.meId);
  if (!r) return null;
  const role = txRole(tx, meId);
  const other = users[txOther(tx, meId)];
  const st = statusOf(tx.status);
  const due = tx.status === "ACTIVE" && tx.dueAt ? dueIn(tx.dueAt) : null;
  return (
    <article className="txcard" onClick={() => onOpen(tx)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen(tx)}>
      <div className="tx-thumb"><CoverArt r={r} /></div>
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="row between" style={{ alignItems: "flex-start" }}>
          <h3 className="truncate">{r.title}</h3>
          <span className={`badge ${st.tone}`}>{st.label}</span>
        </div>
        <div className="small muted truncate">{role === "owner" ? "Lending to" : "Borrowing from"} {other?.name} · {r.mode === "LEND" ? `${tx.days} days` : r.mode === "SELL" ? "Purchase" : "Free"}</div>
        <div className="row between mt-8">
          {due ? <span className={`small bold ${due.late ? "red-text" : "green-text"}`}><Icon name="clock" size={13} style={{ verticalAlign: "-2px" }} /> {due.text}</span> : <span className="tiny muted">{tx.status === "RETURNED" ? `Closed ${fmtDate(tx.returnedAt || tx.createdAt)}` : `${fmtDate(tx.createdAt)}`}</span>}
          {action}
        </div>
      </div>
    </article>
  );
}
