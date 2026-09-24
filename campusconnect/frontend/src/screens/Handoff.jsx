import { useEffect, useState } from "react";
import "../styles/handoff.css";
import { Icon } from "../lib/icons.jsx";
import { Avatar, BackBar, Stars, Empty } from "../components/kit.jsx";
import { CoverArt } from "../components/cover.jsx";
import { QRCode } from "../components/qrcode.jsx";
import { statusOf, zoneName } from "../components/cards.jsx";
import { actions, useStore, txRole, txOther } from "../lib/store.jsx";
import { useNav } from "../lib/nav.jsx";
import { useUI } from "../lib/ui.jsx";
import { inr, dueIn, fmtDate, clock, copyText } from "../lib/format.js";

const STEPS = ["Pre-check", "QR Handover", "Active", "Return"];
const stepIndex = (status) => ({ REQUESTED: 0, ACCEPTED: 1, ACTIVE: 2, RETURN_PENDING: 3, RETURNED: 4, DECLINED: -1, CANCELLED: -1 }[status] ?? 0);

export default function Handoff({ id }) {
  const nav = useNav();
  const ui = useUI();
  const tx = useStore((s) => s.transactions.find((t) => t.id === id));
  const r = useStore((s) => s.resources.find((x) => x.id === tx?.resourceId));
  const users = useStore((s) => s.users);
  const meId = useStore((s) => s.meId);
  if (!tx || !r) return <div className="screen"><Empty icon="handshake" title="Exchange not found" action={<button className="btn" onClick={nav.pop}>Go back</button>} /></div>;

  const role = txRole(tx, meId);
  const other = users[txOther(tx, meId)];
  const st = statusOf(tx.status);
  const idx = stepIndex(tx.status);

  return (
    <div className="screen">
      <BackBar title={r.title} sub={`${role === "owner" ? "Lending to" : "Borrowing from"} ${other.name}`} right={<span className={`badge lg ${st.tone}`}>{st.label}</span>} />
      <div className="scroll pb-safe pad">
        <div className="ho-top">
          <div className="ho-thumb"><CoverArt r={r} /></div>
          <div className="grow">
            <b>{r.title}</b>
            <div className="small muted mt-4">{r.mode === "LEND" ? `${tx.days} days · ${inr(tx.price)}` : r.mode === "SELL" ? inr(tx.price) : "Free"}{tx.deposit ? ` · ${inr(tx.deposit)} deposit` : ""}</div>
          </div>
          <button onClick={() => nav.push("user", { id: other.id })} aria-label={`${other.name} profile`}><Avatar u={other} tick={other.role !== "Student"} /></button>
        </div>

        {idx >= 0 && (
          <div className="stepper-row mt-16">
            {STEPS.map((s, i) => (
              <div key={s} className={`step ${i < idx ? "done" : i === idx ? "cur" : ""}`}>
                <span className="dot">{i < idx ? <Icon name="check" size={13} /> : i + 1}</span>
                <span className="lbl">{s}</span>
                {i < STEPS.length - 1 && <i className="line" />}
              </div>
            ))}
          </div>
        )}

        <div className="mt-20">
          {tx.status === "REQUESTED" && <RequestedPanel tx={tx} r={r} role={role} other={other} nav={nav} ui={ui} />}
          {tx.status === "ACCEPTED" && <AcceptedPanel tx={tx} role={role} nav={nav} ui={ui} />}
          {tx.status === "ACTIVE" && <ActivePanel tx={tx} role={role} ui={ui} />}
          {tx.status === "RETURN_PENDING" && <ReturnPendingPanel tx={tx} role={role} />}
          {tx.status === "RETURNED" && <ReturnedPanel tx={tx} role={role} other={other} />}
          {(tx.status === "DECLINED" || tx.status === "CANCELLED") && <Empty icon="x" title={`Exchange ${tx.status.toLowerCase()}`} body="No further action needed." />}
        </div>

        {tx.precheck && (
          <section className="cond-card mt-20">
            <div className="row"><span className="icon-tile green"><Icon name="camera" /></span><div className="grow"><b>Pre-handover condition</b><div className="small muted">Recorded when the request was accepted</div></div><span className="badge green lg">{tx.precheck.grade}</span></div>
            <p className="small soft-text mt-8">{tx.precheck.note}</p>
          </section>
        )}

        {tx.events?.length > 0 && (
          <section className="mt-20">
            <h2 className="h-md">Timeline</h2>
            <div className="timeline mt-8">
              {tx.events.map((e, i) => (
                <div key={i} className="tl-row"><i className="tl-dot" /><div className="grow"><div className="small">{e.t}</div><div className="tiny muted">{fmtDate(e.at)} · {clock(e.at)}</div></div></div>
              ))}
            </div>
          </section>
        )}
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

function RequestedPanel({ tx, r, role, other, nav, ui }) {
  if (role === "borrower")
    return (
      <div className="panel">
        <Icon name="clock" size={30} className="primary-text" />
        <h3>Waiting for {other.name.split(" ")[0]} to accept</h3>
        <p className="small soft-text center">You'll get a QR handover as soon as it's accepted.</p>
        <button className="btn ghost mt-8" onClick={async () => { const ok = await ui.confirm({ title: "Cancel this request?", body: "Frequent cancellations lightly affect your Trust Score." }); if (ok) (actions.cancelRequest(tx.id), nav.pop()); }}>Cancel request</button>
      </div>
    );
  return (
    <div className="panel align-start">
      <div className="row"><Avatar u={other} /><div className="grow"><b>{other.name}</b><div className="small muted">wants to {r.mode === "DONATE" ? "claim" : r.mode === "SELL" ? "buy" : "borrow"} this{r.mode === "LEND" ? ` for ${tx.days} days` : ""}</div></div></div>
      {tx.message && <div className="quote mt-12">“{tx.message}”</div>}
      <div className="row gap-8 mt-16" style={{ width: "100%" }}>
        <button className="btn ghost grow" onClick={() => actions.declineRequest(tx.id)}>Decline</button>
        <button className="btn grow" onClick={() => ui.openSheet({ title: "Record item condition", render: (close) => <PrecheckForm r={r} onSubmit={(p) => (actions.acceptRequest(tx.id, p), close())} /> })}>Accept & record condition</button>
      </div>
    </div>
  );
}
function PrecheckForm({ r, onSubmit }) {
  const [grade, setGrade] = useState(r.condition || "Good");
  const [note, setNote] = useState("");
  return (
    <div className="col gap-16">
      <div className="field"><span className="lbl">Condition right now</span><div className="wrap row gap-8">{["Excellent", "Good", "Minor damage", "Fair"].map((g) => <button key={g} className={`chip ${grade === g ? "on" : ""}`} onClick={() => setGrade(g)}>{g}</button>)}</div></div>
      <label className="field"><span className="lbl">Notes (optional)</span><textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. small scuff on the cover, all pages intact" /></label>
      <div className="pipeline-note"><Icon name="camera" /><span>In the full app you'd attach a photo here too — this record protects both of you.</span></div>
      <button className="btn lg block" onClick={() => onSubmit({ grade, note: note.trim() || `${grade} condition. Recorded before handover.` })}>Accept request</button>
    </div>
  );
}

function AcceptedPanel({ tx, role, nav, ui }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const gen = () => actions.generateHandover(tx.id);
  const left = tx.handover ? Math.max(0, tx.handover.expiresAt - now) : 0;
  const mm = Math.floor(left / 60000);
  const ss = Math.floor((left % 60000) / 1000);
  const confirm = (val) => {
    try {
      actions.confirmHandover(tx.id, val);
      setErr("");
    } catch (e) {
      setErr(e.message);
    }
  };

  if (role === "owner")
    return (
      <div className="panel">
        {!tx.handover ? (
          <>
            <span className="icon-tile" style={{ width: 56, height: 56 }}><Icon name="qr" size={28} /></span>
            <h3>Generate the handover QR</h3>
            <p className="small soft-text center">Meet {statusHint(tx)} and show this to your borrower.</p>
            <button className="btn lg mt-8" onClick={gen}><Icon name="qr" />Generate QR</button>
          </>
        ) : left > 0 ? (
          <>
            <QRCode value={tx.handover.token} size={220} />
            <div className="row gap-6 mt-12 tiny bold amber-text"><Icon name="timer" size={14} />Expires in {mm}:{String(ss).padStart(2, "0")}</div>
            <div className="pin-row mt-12"><span>Backup PIN</span><b className="num">{tx.handover.pin}</b><button onClick={() => copyText(tx.handover.pin).then(() => ui.toast({ title: "PIN copied", icon: "copy" }))}><Icon name="copy" size={15} /></button></div>
            <p className="tiny muted center mt-12">Ask the borrower to scan this, or read out the PIN if their camera can't scan.</p>
          </>
        ) : (
          <>
            <Icon name="warn" size={30} className="red-text" />
            <h3>QR expired</h3>
            <button className="btn mt-8" onClick={gen}>Generate a new QR</button>
          </>
        )}
      </div>
    );

  return (
    <div className="panel">
      {!tx.handover ? (
        <>
          <Icon name="clock" size={30} className="primary-text" />
          <h3>Waiting for the QR</h3>
          <p className="small soft-text center">Ask the owner to generate the handover QR when you meet.</p>
        </>
      ) : (
        <>
          <button className="btn lg" onClick={() => nav.push("scanner", { id: tx.id })}><Icon name="scan" />Scan handover QR</button>
          <div className="divider-or mt-16"><span>or enter code</span></div>
          <div className="row gap-8 mt-12" style={{ width: "100%" }}>
            <input className={`input grow ${err ? "err" : ""}`} value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit PIN" inputMode="numeric" maxLength={6} />
            <button className="btn" onClick={() => confirm(code)} disabled={code.length < 6}>Confirm</button>
          </div>
          {err && <div className="help err mt-8">{err}</div>}
        </>
      )}
    </div>
  );
}
const statusHint = (tx) => `at ${zoneName(tx.zone)}`;

function ActivePanel({ tx, role, ui }) {
  const due = dueIn(tx.dueAt);
  if (role === "owner")
    return (
      <div className="panel">
        <span className={`icon-tile ${due.late ? "red" : "green"}`} style={{ width: 56, height: 56 }}><Icon name="clock" size={26} /></span>
        <h3>{due.late ? "Overdue" : "Currently on loan"}</h3>
        <p className={`small center ${due.late ? "red-text bold" : "soft-text"}`}>{due.text}</p>
      </div>
    );
  return (
    <div className="panel">
      <span className={`icon-tile ${due.late ? "red" : ""}`} style={{ width: 56, height: 56 }}><Icon name="clock" size={26} /></span>
      <h3>Return by {fmtDate(tx.dueAt)}</h3>
      <p className={`small center ${due.late ? "red-text bold" : "soft-text"}`}>{due.text}</p>
      <button className="btn lg mt-12" onClick={() => ui.openSheet({ title: "Return this item", tall: true, render: (close) => <ReturnForm tx={tx} close={close} /> })}><Icon name="camera" />Start return</button>
    </div>
  );
}
function ReturnForm({ tx, close }) {
  const [photo, setPhoto] = useState(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setPhoto(r.result);
    r.readAsDataURL(f);
  };
  const run = () => {
    setChecking(true);
    setTimeout(() => {
      const match = 90 + Math.floor(Math.random() * 10);
      const verdict = match >= 95 ? "Returned in original condition" : "Minor wear detected, within normal use";
      setResult({ match, verdict, diffs: match >= 95 ? ["No new marks", "Cover intact"] : ["Slight edge wear"] });
      setChecking(false);
    }, 1400);
  };
  return (
    <div className="col gap-16">
      <div className="photo-compare">
        <div className="pc-col"><span className="tiny bold muted">Before</span><div className="pc-box">{tx.precheck ? <div className="pc-cond">{tx.precheck.grade}</div> : <Icon name="image" />}</div></div>
        <Icon name="arrow" className="muted" />
        <div className="pc-col"><span className="tiny bold muted">Now</span><label className="pc-box upload">{photo ? <img src={photo} alt="Return condition" /> : <><Icon name="camera" /><span className="tiny">Add photo</span></>}<input type="file" accept="image/*" hidden onChange={pick} /></label></div>
      </div>
      {!result ? (
        <button className="btn lg block" disabled={checking} onClick={run}>{checking ? "Running AI condition check…" : "Run AI condition check"}<Icon name={checking ? "sparkles" : "sparkles"} /></button>
      ) : (
        <>
          <div className={`ai-result ${result.match >= 95 ? "good" : "warn"}`}>
            <div className="row between"><b>AI condition match</b><span className="num" style={{ fontSize: 22, fontWeight: 800 }}>{result.match}%</span></div>
            <p className="small mt-4">{result.verdict}</p>
            <div className="wrap row gap-6 mt-8">{result.diffs.map((d) => <span key={d} className="badge">{d}</span>)}</div>
          </div>
          <button className="btn lg block" onClick={() => (actions.submitReturn(tx.id, result), close())}>Submit return</button>
        </>
      )}
    </div>
  );
}

function ReturnPendingPanel({ tx, role }) {
  const late = tx.returnedAt > tx.dueAt;
  if (role === "borrower")
    return (
      <div className="panel">
        <Icon name="clock" size={30} className="primary-text" />
        <h3>Waiting for confirmation</h3>
        <p className="small soft-text center">The owner will confirm the return shortly.</p>
      </div>
    );
  return (
    <div className="panel align-start">
      <div className={`ai-result ${tx.ret.match >= 95 ? "good" : "warn"}`} style={{ width: "100%" }}>
        <div className="row between"><b>AI condition match</b><span className="num" style={{ fontSize: 22, fontWeight: 800 }}>{tx.ret.match}%</span></div>
        <p className="small mt-4">{tx.ret.verdict}</p>
      </div>
      {late && <div className="badge red lg mt-12">Returned after the due date</div>}
      <button className="btn lg block mt-16" onClick={() => actions.confirmReturn(tx.id)}>Confirm return<Icon name="check" /></button>
    </div>
  );
}

function ReturnedPanel({ tx, other }) {
  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState([]);
  const opts = ["On time", "Great condition", "Friendly", "Easy handover", "Fair price"];
  const toggle = (t) => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]));
  return (
    <div className="panel align-start">
      <div className="row" style={{ width: "100%" }}><span className="icon-tile green"><Icon name="check" /></span><div className="grow"><b>Exchange complete</b><div className="small muted">Closed {fmtDate(tx.returnedAt || tx.createdAt)}</div></div></div>
      {tx.trust && (
        <div className="trust-bump mt-12"><Icon name="shield" /><span>Trust Score {tx.trust.before} → <b>{tx.trust.after}</b></span></div>
      )}
      {tx.review ? (
        <div className="card tint pad-card mt-16" style={{ width: "100%" }}><Stars value={tx.review.rating} /><div className="wrap row gap-6 mt-8">{tx.review.tags.map((t) => <span key={t} className="badge">{t}</span>)}</div></div>
      ) : (
        <div className="mt-16" style={{ width: "100%" }}>
          <b className="small">Rate {other.name.split(" ")[0]}</b>
          <div className="mt-8"><Stars value={rating} onChange={setRating} size={26} /></div>
          <div className="wrap row gap-8 mt-12">{opts.map((t) => <button key={t} className={`chip sm ${tags.includes(t) ? "on" : ""}`} onClick={() => toggle(t)}>{t}</button>)}</div>
          <button className="btn block mt-12" onClick={() => actions.submitReview(tx.id, { rating, tags })}>Submit review</button>
        </div>
      )}
    </div>
  );
}
