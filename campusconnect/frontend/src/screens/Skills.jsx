import { useEffect, useMemo, useState } from "react";
import "../styles/skills.css";
import { Icon } from "../lib/icons.jsx";
import { Seg, Empty, Avatar, TrustRing } from "../components/kit.jsx";
import { SkillCard, PostCard } from "../components/cards.jsx";
import { actions, useStore, useMe } from "../lib/store.jsx";
import { useNav } from "../lib/nav.jsx";
import { useUI } from "../lib/ui.jsx";
import { SKILL_CATEGORIES, SAFE_ZONES } from "../lib/seed.js";
import { timeAgoLong } from "../lib/format.js";

const KTYPES = ["All", "Interview", "Placement", "Internship", "Hackathon", "Certification", "Notes", "Project", "Career"];

export default function Skills() {
  const nav = useNav();
  const ui = useUI();
  const me = useMe();
  const [tab, setTab] = useState("swap");
  const skills = useStore((s) => s.skills);
  const knowledge = useStore((s) => s.knowledge);
  const sessions = useStore((s) => s.sessions);
  const [cat, setCat] = useState("All skills");
  const [ktype, setKtype] = useState("All");
  const creditsBalance = useStore((s) => s.credits.balance);

  useEffect(() => {
    const h1 = () => (setTab("swap"), setTimeout(() => openOfferSkill(ui), 150));
    const h2 = () => setTab("knowledge");
    window.addEventListener("cc:offer-skill", h1);
    window.addEventListener("cc:knowledge", h2);
    return () => (window.removeEventListener("cc:offer-skill", h1), window.removeEventListener("cc:knowledge", h2));
  }, [ui]);

  const swapList = skills.filter((s) => s.userId !== me.id && (cat === "All skills" || s.cat === cat));
  const kList = knowledge.filter((p) => ktype === "All" || p.type === ktype);
  const mySessions = sessions.filter((s) => s.userId || true);

  return (
    <>
      <header className="appbar">
        <h1>Skills</h1>
        <span className="spacer" />
        <button className="icon-btn filled" onClick={() => (tab === "knowledge" ? nav.push("post", { compose: true }) : openOfferSkill(ui))} aria-label={tab === "knowledge" ? "Share experience" : "Offer a skill"}><Icon name="plus" /></button>
      </header>
      <div className="pad" style={{ paddingBottom: 10 }}>
        <Seg value={tab} onChange={setTab} items={[{ id: "swap", label: "Skill swap" }, { id: "knowledge", label: "Knowledge hub" }, { id: "sessions", label: "My sessions", count: sessions.filter((s) => s.status === "BOOKED").length }]} />
      </div>

      <div className="scroll pb-tab">
        {tab === "swap" && (
          <>
            <div className="pad">
              <div className="credit-strip" onClick={() => nav.push("wallet")}>
                <span className="icon-tile amber"><Icon name="coins" /></span>
                <div className="grow"><b>{creditsBalance} Campus Credits</b><div className="tiny muted">Teach 1 hr = +10 · Learn 1 hr = −10</div></div>
                <Icon name="next" />
              </div>
            </div>
            <div className="hscroll mt-12">{SKILL_CATEGORIES.map((c) => <button key={c} className={`chip ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>{c}</button>)}</div>
            <div className="col gap-12 pad mt-16">
              {swapList.length ? swapList.map((s) => <SkillCard key={s.id} s={s} onBook={(sk, mode, min) => openSkillBooking(ui, sk, mode, min)} onOpenUser={(u) => nav.push("user", { id: u.id })} />) : <Empty icon="bulb" title="No offers in this category yet" body="Be the first to offer this skill." action={<button className="btn mt-8" onClick={() => openOfferSkill(ui)}>Offer a skill</button>} />}
            </div>
          </>
        )}

        {tab === "knowledge" && (
          <>
            <div className="hscroll mt-8">{KTYPES.map((t) => <button key={t} className={`chip ${ktype === t ? "on" : ""}`} onClick={() => setKtype(t)}>{t}</button>)}</div>
            <div className="listing-list mt-16">
              {kList.length ? kList.map((p) => <PostCard key={p.id} p={p} onOpen={(x) => nav.push("post", { id: x.id })} onAsk={(x) => nav.push("chat", { id: "ai", ask: `What did seniors share about ${x.title}?` })} />) : <Empty icon="news" title="Nothing here yet" />}
            </div>
          </>
        )}

        {tab === "sessions" && <Sessions sessions={mySessions} nav={nav} />}
      </div>
    </>
  );
}

function Sessions({ sessions, nav }) {
  const skills = useStore((s) => s.skills);
  const users = useStore((s) => s.users);
  if (!sessions.length) return <Empty icon="calendar" title="No sessions booked" body="Book a mentor or skill swap to see it here." />;
  return (
    <div className="col gap-12 pad mt-8">
      {sessions.map((s) => {
        const sk = skills.find((x) => x.id === s.skillId);
        const u = users[s.userId];
        return (
          <div key={s.id} className="scard">
            <div className="row">
              <Avatar u={u} size="lg" tick />
              <div className="grow">
                <div className="row between"><b>{sk?.title}</b><span className={`badge ${s.status === "BOOKED" ? "" : "green"}`}>{s.status === "BOOKED" ? "Upcoming" : "Completed"}</span></div>
                <div className="small muted">with {u?.name} · {s.when} · {SAFE_ZONES.find((z) => z.id === s.zone)?.name || "Safe Zone"}</div>
                <div className="small bold mt-4">{s.mode === "credits" ? `${s.credits} credits held` : "Skill swap"}</div>
              </div>
            </div>
            {s.status === "BOOKED" && (
              <div className="row gap-8">
                <button className="btn soft grow" onClick={() => nav.push("chat", { id: `c_${u?.id}` })}>Message</button>
                <button className="btn grow" onClick={() => actions.completeSession(s.id)}>Mark completed</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function openSkillBooking(ui, sk, mode = "swap", minutes) {
  ui.openSheet({ title: mode === "credits" ? "Quick book mentoring" : "Request a skill swap", tall: true, render: (close) => <BookForm sk={sk} mode={mode} minutes={minutes} close={close} /> });
}
function BookForm({ sk, mode, minutes, close }) {
  const [zone, setZone] = useState(SAFE_ZONES[0].id);
  const [when, setWhen] = useState("This Saturday, 5:00 pm");
  const credits = useStore((s) => s.credits.balance);
  const cost = mode === "credits" ? Math.max(1, Math.round((sk.credits / sk.minutes) * (minutes || sk.minutes))) : 0;
  const insufficient = cost > credits;
  return (
    <div className="col gap-16">
      <div className="row"><Avatar u={{ id: sk.userId, name: undefined, hue: undefined }} size="lg" /><div className="grow"><b>{sk.title}</b><div className="small muted">{minutes || sk.minutes} minutes · {mode === "credits" ? `${cost} credits` : `Swap: ${sk.swapFor}`}</div></div></div>
      <label className="field"><span className="lbl">When</span>
        <div className="wrap row gap-8">{["Today, 6 pm", "Tomorrow, 5 pm", "This Saturday, 5:00 pm", "This Sunday, 11 am"].map((w) => <button key={w} className={`chip sm ${when === w ? "on" : ""}`} onClick={() => setWhen(w)}>{w}</button>)}</div>
      </label>
      <label className="field"><span className="lbl">Meet at</span>
        <div className="col gap-8">{SAFE_ZONES.slice(0, 3).map((z) => <button key={z.id} className={`zone-opt ${zone === z.id ? "on" : ""}`} onClick={() => setZone(z.id)}><Icon name="pin" /><div className="grow" style={{ textAlign: "left" }}><b>{z.name}</b></div><i className="radio" /></button>)}</div>
      </label>
      {mode === "credits" && (
        <div className="receipt"><div className="row between"><span>Your balance</span><b className="num">{credits} credits</b></div><div className="row between"><span>This session</span><b className="num">− {cost} credits</b></div></div>
      )}
      {insufficient && <div className="help err">Not enough credits. Teach a skill to earn more, or request a swap instead.</div>}
      <button className="btn lg block" disabled={insufficient} onClick={() => { try { actions.bookSession({ skillId: sk.id, when, zone, mode, minutes: minutes || sk.minutes }); close(); } catch (e) { alert(e.message); } }}>Confirm booking<Icon name="check" /></button>
    </div>
  );
}

const SKILL_SUGG = ["Python", "Guitar basics", "Figma", "DSA", "Resume review", "Spoken English", "Machine Learning", "Verilog", "Photography", "Public speaking"];
export function openOfferSkill(ui) {
  ui.openSheet({ title: "Offer a skill", tall: true, render: (close) => <OfferForm close={close} /> });
}
function OfferForm({ close }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("Programming");
  const [swapFor, setSwapFor] = useState("");
  const [credits, setCredits] = useState(10);
  const ok = title.trim().length > 4 && desc.trim().length > 8 && swapFor.trim().length > 1;
  return (
    <div className="col gap-16">
      <label className="field"><span className="lbl">What can you teach?</span><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Python basics for beginners" autoFocus /></label>
      <div className="wrap row gap-8">{SKILL_SUGG.map((s) => <button key={s} className="chip sm" onClick={() => setTitle(s)}>{s}</button>)}</div>
      <div className="field"><span className="lbl">Category</span><div className="wrap row gap-8">{SKILL_CATEGORIES.slice(1).map((c) => <button key={c} className={`chip ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>{c}</button>)}</div></div>
      <label className="field"><span className="lbl">Describe a session</span><textarea className="textarea" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What will you cover in an hour?" /></label>
      <label className="field"><span className="lbl">I'd like to swap for</span><input className="input" value={swapFor} onChange={(e) => setSwapFor(e.target.value)} placeholder="e.g. Guitar lessons, or leave blank for credits only" /></label>
      <div className="field"><span className="lbl row between"><span>Credits per hour</span><b className="primary-text num">{credits}</b></span><input type="range" min="5" max="15" step="1" value={credits} onChange={(e) => setCredits(+e.target.value)} /></div>
      <button className="btn lg block" disabled={!ok} onClick={() => { actions.offerSkill({ title: title.trim(), desc: desc.trim(), cat, swapFor: swapFor.trim() || "Campus Credits", credits, minutes: 60 }); close(); }}>Publish skill offer</button>
    </div>
  );
}
