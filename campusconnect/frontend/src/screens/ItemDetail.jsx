import { useMemo, useRef, useState } from "react";
import "../styles/item.css";
import { Icon } from "../lib/icons.jsx";
import { Avatar, TrustRing, Verified, Empty } from "../components/kit.jsx";
import { CoverArt } from "../components/cover.jsx";
import { ModeTag, ListingCard, zoneName, returnRate, statusOf } from "../components/cards.jsx";
import { actions, useStore, priceFor, isActiveTx, txRole } from "../lib/store.jsx";
import { useNav } from "../lib/nav.jsx";
import { useUI } from "../lib/ui.jsx";
import { SAFE_ZONES } from "../lib/seed.js";
import { inr, distance, timeAgoLong } from "../lib/format.js";
import { trustOf } from "../lib/trust.js";
import { copyText } from "../lib/format.js";
import booksPhoto from "../assets/books.jpg";

export default function ItemDetail({ id }) {
  const nav = useNav();
  const ui = useUI();
  const r = useStore((s) => s.resources.find((x) => x.id === id));
  const owner = useStore((s) => s.users[r?.ownerId]);
  const users = useStore((s) => s.users);
  const meId = useStore((s) => s.meId);
  const liked = useStore((s) => !!s.likes[id]);
  const saved = useStore((s) => !!s.saved[id]);
  const all = useStore((s) => s.resources);
  const txs = useStore((s) => s.transactions);
  const [days, setDays] = useState(7);
  const [slide, setSlide] = useState(0);
  const [comment, setComment] = useState("");
  const scroller = useRef();

  const mine = r?.ownerId === meId;
  const existing = r && txs.find((t) => t.resourceId === r.id && t.borrowerId === meId && isActiveTx(t));
  const incoming = r && txs.filter((t) => t.resourceId === r.id && t.ownerId === meId && isActiveTx(t));
  const similar = useMemo(() => (r ? all.filter((x) => x.id !== r.id && x.ownerId !== meId && (x.category === r.category || x.subject === r.subject)).slice(0, 6) : []), [all, r, meId]);
  if (!r) return <div className="screen"><Empty icon="search" title="Listing not found" action={<button className="btn" onClick={nav.pop}>Go back</button>} /></div>;

  const slides = [{ kind: "cover" }, ...(r.images?.length ? r.images.slice(1).map((s) => ({ kind: "img", src: s })) : []), ...(r.photo === "books" ? [{ kind: "img", src: booksPhoto }] : [])];
  const maxDays = r.maxDays || 14;
  const cost = priceFor(r, days);
  const rate = returnRate(owner);
  const unavailable = r.status && r.status !== "available";
  const ctaLabel = r.mode === "LEND" ? `Request lend · ${inr(cost)}` : r.mode === "SELL" ? `Reserve · ${inr(r.price)}` : "Claim for free";

  const share = async () => {
    const ok = await copyText(`https://campusconnect.app/r/${r.id}`);
    ui.toast({ title: ok ? "Link copied" : "Share this listing", body: "Only campus-verified students can open it.", icon: "link" });
  };
  const message = () => nav.push("chat", { id: actions.openChat(r.ownerId, { resourceId: r.id }) });

  const request = () =>
    ui.openSheet({ title: r.mode === "DONATE" ? "Claim this item" : r.mode === "SELL" ? "Reserve this item" : "Request to borrow", tall: true, render: (close) => <RequestForm r={r} owner={owner} days={days} setDays={setDays} close={close} onDone={(tx) => nav.push("handoff", { id: tx.id })} /> });

  return (
    <div className="screen item">
      <div className="scroll">
        <div className="gallery">
          <div className="g-track" ref={scroller} onScroll={(e) => setSlide(Math.round(e.target.scrollLeft / e.target.clientWidth))}>
            {slides.map((s, i) => <div className="g-slide" key={i}>{s.kind === "cover" ? <CoverArt r={{ ...r, images: [] , photo: null }} /> : <img src={s.src} alt={`${r.title} photo ${i}`} />}</div>)}
          </div>
          <div className="g-top">
            <button className="icon-btn glass" onClick={nav.pop} aria-label="Back"><Icon name="back" /></button>
            <span className="spacer" />
            <button className="icon-btn glass" onClick={share} aria-label="Share"><Icon name="share" /></button>
            <button className={`icon-btn glass ${saved ? "on" : ""}`} onClick={() => actions.toggleSave(r.id)} aria-pressed={saved} aria-label="Save"><Icon name="bookmark" style={{ fill: saved ? "currentColor" : "none" }} /></button>
          </div>
          {slides.length > 1 && <div className="g-dots">{slides.map((_, i) => <i key={i} className={i === slide ? "on" : ""} />)}</div>}
          <ModeTag r={r} className="g-mode" />
        </div>

        <div className="pad item-main">
          <div className="row gap-6 wrap">
            {r.code && <span className="badge">{r.code}</span>}
            <span className="badge gray">{r.category === "books" ? "Textbook" : r.category}</span>
            {r.tag && <span className="badge green"><Icon name={r.tag === "Instant Handoff" ? "qr" : "grad"} />{r.tag}</span>}
          </div>
          <h1 className="item-title">{r.title}</h1>
          <p className="soft-text">{r.subtitle}</p>

          <div className="price-row">
            <div>
              <div className="price num">{r.mode === "DONATE" ? "Free" : inr(r.price)}{r.mode === "LEND" && <small>/week</small>}</div>
              {r.mode === "LEND" && <div className="small muted">Prorated daily · max {maxDays} days{r.deposit ? ` · ${inr(r.deposit)} refundable deposit` : ""}</div>}
              {r.mode === "SELL" && <div className="small muted">Student price cap applied</div>}
              {r.mode === "DONATE" && <div className="small green-text bold">Pass-down · pay it forward</div>}
            </div>
            <div className="row gap-16">
              <button className={`stat-btn ${liked ? "on" : ""}`} onClick={() => actions.toggleLike(r.id)} aria-pressed={liked}><Icon name="heart" style={{ fill: liked ? "currentColor" : "none" }} /><b>{r.likes}</b></button>
              <div className="stat-btn"><Icon name="comment" /><b>{r.comments?.length || 0}</b></div>
            </div>
          </div>

          <div className="facts">
            <Fact icon="ok" k="Condition" v={r.condition} />
            <Fact icon="pin" k="Pickup" v={`${zoneName(r.pickup)}${r.distanceM ? ` · ${distance(r.distanceM)}` : ""}`} />
            {r.sem && <Fact icon="grad" k="Semester" v={`${r.sem}${r.branch && r.branch !== "ALL" ? " · " + r.branch : ""}`} />}
            <Fact icon="clock" k="Listed" v={timeAgoLong(r.createdAt)} />
          </div>

          {(existing || (mine && incoming.length > 0)) && (
            <div className="card tint pad-card mt-16">
              {existing && (
                <button className="row" style={{ width: "100%", textAlign: "left" }} onClick={() => nav.push("handoff", { id: existing.id })}>
                  <span className="icon-tile"><Icon name="handshake" /></span>
                  <div className="grow"><b>You've requested this</b><div className="small muted">{statusOf(existing.status).label} · tap to open</div></div>
                  <Icon name="next" />
                </button>
              )}
              {mine && incoming.map((t) => (
                <button key={t.id} className="row" style={{ width: "100%", textAlign: "left" }} onClick={() => nav.push("handoff", { id: t.id })}>
                  <span className="icon-tile amber"><Icon name="bell" /></span>
                  <div className="grow"><b>{users[t.borrowerId]?.name} · {statusOf(t.status).label}</b><div className="small muted">Tap to manage</div></div>
                  <Icon name="next" />
                </button>
              ))}
            </div>
          )}

          <section className="owner-card">
            <div className="row" style={{ alignItems: "flex-start" }}>
              <button onClick={() => nav.push("user", { id: owner.id })} aria-label="View profile"><Avatar u={owner} size="lg" tick /></button>
              <div className="grow">
                <div className="bold" style={{ fontSize: 17 }}>{mine ? "You" : owner.name}</div>
                <div className="small muted">{owner.role !== "Student" ? owner.role + " · " : ""}{owner.batch}</div>
                <div className="mt-8"><Verified /></div>
              </div>
              <button onClick={() => nav.push("trust", { id: owner.id })} aria-label="Trust score details"><TrustRing score={trustOf(owner)} size={78} stroke={8} label={false} sub={false} /></button>
            </div>
            <div className="owner-stats">
              <div><b className="num">{owner.stats.successful}</b><span>exchanges</span></div>
              <div><b className="num">{rate != null ? rate + "%" : "New"}</b><span>on-time</span></div>
              <div><b className="num">{(owner.stats.ratingAvg || 0).toFixed(1)}</b><span>rating</span></div>
            </div>
            {!mine && <div className="row gap-8 mt-12"><button className="btn soft grow" onClick={message}><Icon name="comment" />Message</button><button className="btn ghost grow" onClick={() => nav.push("user", { id: owner.id })}>View profile</button></div>}
          </section>

          <h2 className="h-md mt-24">About this item</h2>
          <p className="soft-text mt-8" style={{ lineHeight: 1.6 }}>{r.desc}</p>
          <div className="row wrap gap-6 mt-12">{(r.tags || []).map((t) => <span key={t} className="tagpill">#{t}</span>)}</div>

          <section className="cond-card mt-24">
            <div className="row"><span className="icon-tile green"><Icon name="camera" /></span><div className="grow"><b>Condition record</b><div className="small muted">Photographed before every handover</div></div><span className="badge green lg">{r.condition}</span></div>
            <div className="cond-scale" aria-hidden="true">{["Fair", "Minor damage", "Good", "Excellent"].map((c) => <i key={c} className={c === r.condition || (r.condition === "Good" && c === "Good") ? "on" : ""}><span>{c === "Minor damage" ? "Minor" : c}</span></i>)}</div>
            <p className="small soft-text mt-8">On return, the borrower uploads a photo and Campus AI compares it with this record. Both Trust Scores update automatically.</p>
          </section>

          <h2 className="h-md mt-24">Questions & comments <span className="muted" style={{ fontWeight: 600 }}>{r.comments?.length || 0}</span></h2>
          <div className="col mt-8">
            {(r.comments || []).map((c) => (
              <div key={c.id} className="comment"><Avatar u={users[c.userId]} size="sm" /><div className="grow"><div className="small"><b>{users[c.userId]?.name.split(" ")[0]}</b> <span className="muted">{timeAgoLong(c.at)}</span></div><div>{c.text}</div></div></div>
            ))}
            <form className="comment-in" onSubmit={(e) => { e.preventDefault(); if (comment.trim()) (actions.addComment(r.id, comment.trim()), setComment("")); }}>
              <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ask a public question…" aria-label="Add a comment" />
              <button className="icon-btn" disabled={!comment.trim()} aria-label="Post comment"><Icon name="send" /></button>
            </form>
          </div>

          {similar.length > 0 && (<>
            <h2 className="h-md mt-24">More like this</h2>
            <div className="similar mt-12">{similar.map((x) => <div key={x.id} style={{ width: 168, flex: "none" }}><ListingCard r={x} compact onOpen={(y) => nav.replace("item", { id: y.id })} /></div>)}</div>
          </>)}
          <div style={{ height: 110 }} />
        </div>
      </div>

      <div className="buybar">
        {mine ? (
          <>
            <button className="btn soft grow" onClick={() => actions.setResourceStatus(r.id, unavailable ? "available" : "reserved")}>{unavailable ? "Mark available" : "Pause listing"}</button>
            <button className="btn grow" onClick={() => nav.go("resources")}>View requests</button>
          </>
        ) : (
          <>
            {r.mode === "LEND" && !unavailable && !existing && (
              <div className="days-mini"><button onClick={() => setDays(Math.max(1, days - 1))} aria-label="Fewer days">−</button><output><b>{days}</b><span>days</span></output><button onClick={() => setDays(Math.min(maxDays, days + 1))} aria-label="More days">+</button></div>
            )}
            <button className="icon-btn filled" onClick={message} aria-label="Message owner"><Icon name="comment" /></button>
            <button className={`btn lg grow ${r.mode === "DONATE" ? "green" : r.mode === "SELL" ? "amber" : ""}`} disabled={unavailable || !!existing} onClick={request}>{existing ? "Requested" : unavailable ? "Not available" : ctaLabel}</button>
          </>
        )}
      </div>
    </div>
  );
}

const Fact = ({ icon, k, v }) => <div className="fact"><Icon name={icon} /><div><span>{k}</span><b>{v}</b></div></div>;

function RequestForm({ r, owner, days, setDays, close, onDone }) {
  const [zone, setZone] = useState(r.pickup);
  const [msg, setMsg] = useState("");
  const maxDays = r.maxDays || 14;
  const cost = priceFor(r, days);
  const quick = ["Is this still available?", "I can pick it up today", "Needed for my exam this week"];
  const go = () => {
    const tx = actions.requestItem(r.id, { days, zone, message: msg.trim() || undefined });
    close();
    setTimeout(() => onDone(tx), 150);
  };
  return (
    <div className="col gap-16">
      <div className="row"><div style={{ width: 64, height: 64, borderRadius: 16, overflow: "hidden", flex: "none" }}><CoverArt r={r} /></div><div className="grow"><b>{r.title}</b><div className="small muted">from {owner.name} · Trust {trustOf(owner)}</div></div></div>
      {r.mode === "LEND" && (
        <div className="field"><span className="lbl">How long do you need it?</span>
          <div className="row between"><div className="wrap row gap-8">{[3, 7, 10, 14].filter((d) => d <= maxDays).map((d) => <button key={d} className={`chip ${days === d ? "on" : ""}`} onClick={() => setDays(d)}>{d} days</button>)}</div></div>
          <div className="row between mt-12"><div className="stepper"><button onClick={() => setDays(Math.max(1, days - 1))} aria-label="Fewer days">−</button><output>{days} d</output><button onClick={() => setDays(Math.min(maxDays, days + 1))} aria-label="More days">+</button></div><span className="small muted">Max {maxDays} days</span></div>
        </div>
      )}
      <div className="field"><span className="lbl">Meet at a Safe Zone</span>
        <div className="col gap-8">{SAFE_ZONES.slice(0, 4).map((z) => (
          <button key={z.id} className={`zone-opt ${zone === z.id ? "on" : ""}`} onClick={() => setZone(z.id)} role="radio" aria-checked={zone === z.id}>
            <Icon name="pin" /><div className="grow" style={{ textAlign: "left" }}><b>{z.name}</b><div className="tiny muted">{z.spot} · {z.open}</div></div>{z.staff && <span className="badge green">Staff</span>}<i className="radio" />
          </button>))}</div>
      </div>
      <label className="field"><span className="lbl">Message to {owner.name.split(" ")[0]} (optional)</span><textarea className="textarea" style={{ minHeight: 76 }} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Hi! Could I borrow this for my exam?" /></label>
      <div className="wrap row gap-6">{quick.map((q) => <button key={q} className="chip sm" onClick={() => setMsg(q)}>{q}</button>)}</div>
      <div className="receipt">
        <div className="row between"><span>{r.mode === "LEND" ? `${inr(r.price)}/wk × ${days} days` : r.mode === "SELL" ? "Item price" : "Item"}</span><b>{cost ? inr(cost) : "Free"}</b></div>
        {!!r.deposit && <div className="row between"><span>Refundable deposit <span className="muted">(escrow)</span></span><b>{inr(r.deposit)}</b></div>}
        <div className="row between total"><span>Pay at handover</span><b>{inr(cost + (r.deposit || 0))}</b></div>
      </div>
      <p className="tiny muted" style={{ marginTop: -4 }}><Icon name="shield" size={12} style={{ verticalAlign: "-2px" }} /> Deposits are held until the return is verified. Demo mode simulates payments; no real money moves.</p>
      <button className={`btn lg block ${r.mode === "DONATE" ? "green" : r.mode === "SELL" ? "amber" : ""}`} onClick={go}>{r.mode === "DONATE" ? "Send claim" : "Send request"}<Icon name="send" /></button>
    </div>
  );
}
