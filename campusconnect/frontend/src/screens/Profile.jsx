import { useState } from "react";
import "../styles/profile.css";
import { Icon } from "../lib/icons.jsx";
import { Avatar, TrustRing, Seg, Empty, Switch, BackBar } from "../components/kit.jsx";
import { ListingCard, PostCard } from "../components/cards.jsx";
import { actions, useStore, useMe, isMine } from "../lib/store.jsx";
import { useNav } from "../lib/nav.jsx";
import { useUI } from "../lib/ui.jsx";
import { trustOf } from "../lib/trust.js";
import { BADGES } from "../lib/seed.js";
import { compact, inr } from "../lib/format.js";

export default function Profile({ id, active }) {
  const nav = useNav();
  const ui = useUI();
  const me = useMe();
  const users = useStore((s) => s.users);
  const resources = useStore((s) => s.resources);
  const knowledge = useStore((s) => s.knowledge);
  const skills = useStore((s) => s.skills);
  const saved = useStore((s) => s.saved);
  const impact = useStore((s) => s.impact);
  const credits = useStore((s) => s.credits.balance);
  const isPushed = id != null;
  const uid = id || me.id;
  const u = users[uid];
  const own = isMine(uid);
  const [tab, setTab] = useState("listings");
  if (!u) return null;

  const myListings = resources.filter((r) => r.ownerId === uid && (!r.status || r.status === "available"));
  const myPosts = knowledge.filter((p) => p.authorId === uid);
  const mySkills = skills.filter((s) => s.userId === uid);
  const savedItems = own ? resources.filter((r) => saved[r.id]) : [];

  const Header = isPushed ? BackBar : "header";
  const headerProps = isPushed
    ? { title: u.name, onBack: nav.pop, right: !own && <button className="icon-btn" onClick={() => nav.push("chat", { id: actions.openChat(uid) })} aria-label="Message"><Icon name="comment" /></button> }
    : { className: "appbar" };

  return (
    <div className={isPushed ? "screen" : undefined}>
      {isPushed ? <Header {...headerProps} /> : <header className="appbar"><h1>Profile</h1><span className="spacer" /><button className="icon-btn" onClick={() => nav.push("settings")} aria-label="Settings"><Icon name="settings" /></button></header>}
      <div className="scroll pb-tab">
        <div className="pcover" />
        <div className="pad p-head">
          <div className="row" style={{ alignItems: "flex-end", marginTop: -46 }}>
            <span className="p-avatar-ring"><Avatar u={u} size="xl" /></span>
            <div className="grow" style={{ paddingBottom: 4 }} />
            <TrustRing score={trustOf(u)} size={72} stroke={7} label={false} sub={false} />
          </div>
          <h2 className="p-name">{u.name}</h2>
          <div className="row gap-8 wrap mt-4">
            <span className="badge">{u.branch} · {u.batch}</span>
            {u.role !== "Student" && <span className="badge green">{u.role}</span>}
            <span className="badge amber"><Icon name="star" size={12} style={{ fill: "var(--gold)", color: "var(--gold)" }} />{(u.stats.ratingAvg || 0).toFixed(1)} ({u.stats.ratingCount || 0})</span>
          </div>
          {u.bio && <p className="small soft-text mt-8">{u.bio}</p>}
          <div className="p-stats mt-16">
            <div><b className="num">{u.stats.successful || 0}</b><span>exchanges</span></div>
            <div><b className="num">{myListings.length}</b><span>listed</span></div>
            <div><b className="num">{myPosts.length}</b><span>shared</span></div>
          </div>
          {own ? (
            <div className="row gap-8 mt-16">
              <button className="btn soft grow" onClick={() => openEditProfile(ui, me)}><Icon name="edit" />Edit profile</button>
              <button className="btn ghost grow" onClick={() => nav.push("trust", { id: u.id })}><Icon name="shield" />Trust details</button>
            </div>
          ) : (
            <div className="row gap-8 mt-16">
              <button className="btn grow" onClick={() => nav.push("chat", { id: actions.openChat(uid) })}><Icon name="comment" />Message</button>
              <button className="btn soft grow" onClick={() => nav.push("trust", { id: u.id })}><Icon name="shield" />View trust</button>
            </div>
          )}
        </div>

        {own && (
          <div className="pad">
            <div className="row gap-12" style={{ overflowX: "auto" }}>
              <MiniStat icon="wallet" label="Saved" value={inr(impact.me.saved)} onClick={() => nav.push("impact")} tone="green" />
              <MiniStat icon="coins" label="Credits" value={credits} onClick={() => nav.push("wallet")} tone="amber" />
              <MiniStat icon="recycle" label="Reused" value={impact.me.reused} onClick={() => nav.push("impact")} />
            </div>
          </div>
        )}

        {own && (
          <section className="pad mt-16">
            <div className="row between"><h2 className="h-md">Badges</h2><span className="small muted">{BADGES.filter((b) => b.earned).length}/{BADGES.length}</span></div>
            <div className="badge-grid mt-12">
              {BADGES.map((b) => (
                <div key={b.id} className={`badge-tile ${b.earned ? "" : "locked"}`} title={b.hint}>
                  <span className={`icon-tile ${b.tone}`}><Icon name={b.icon === "grad" ? "grad" : b.icon === "bulb" ? "bulb" : b.icon} /></span>
                  <span className="tiny bold">{b.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="pad mt-16">
          <Seg value={tab} onChange={setTab} items={own ? [{ id: "listings", label: "Listings" }, { id: "knowledge", label: "Posts" }, { id: "skills", label: "Skills" }, { id: "saved", label: "Saved" }] : [{ id: "listings", label: "Listings" }, { id: "knowledge", label: "Posts" }, { id: "skills", label: "Skills" }]} />
        </div>
        <div className="mt-12">
          {tab === "listings" && (myListings.length ? <div className="listing-grid">{myListings.map((r) => <ListingCard key={r.id} r={r} compact onOpen={(x) => nav.push("item", { id: x.id })} />)}</div> : <Empty icon="repeat" title="No active listings" action={own && <button className="btn mt-8" onClick={() => nav.push("create")}>List your first item</button>} />)}
          {tab === "knowledge" && (myPosts.length ? <div className="listing-list">{myPosts.map((p) => <PostCard key={p.id} p={p} onOpen={(x) => nav.push("post", { id: x.id })} onAsk={() => {}} />)}</div> : <Empty icon="news" title="No experiences shared yet" action={own && <button className="btn mt-8" onClick={() => nav.push("post", { compose: true })}>Share an experience</button>} />)}
          {tab === "skills" && (mySkills.length ? <div className="col gap-12 pad">{mySkills.map((s) => <div key={s.id} className="scard"><b>{s.title}</b><p className="small soft-text mt-4">{s.desc}</p></div>)}</div> : <Empty icon="bulb" title="No skills offered yet" />)}
          {tab === "saved" && (savedItems.length ? <div className="listing-grid">{savedItems.map((r) => <ListingCard key={r.id} r={r} compact onOpen={(x) => nav.push("item", { id: x.id })} />)}</div> : <Empty icon="bookmark" title="Nothing saved yet" />)}
        </div>
        {active === undefined && null}
      </div>
    </div>
  );
}

const MiniStat = ({ icon, label, value, onClick, tone }) => (
  <button className="mini-stat" onClick={onClick}>
    <span className={`icon-tile ${tone || ""}`}><Icon name={icon} /></span>
    <div><div className="tiny muted">{label}</div><b className="num">{value}</b></div>
  </button>
);

const BRANCHES = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "IT"];
const SKILLS = ["Python", "Guitar basics", "Figma", "DSA", "Arduino", "Spoken English", "Resume review", "Machine Learning", "Photography", "Sketching"];
export function openEditProfile(ui, me) {
  ui.openSheet({ title: "Edit profile", tall: true, render: (close) => <EditForm me={me} close={close} /> });
}
function EditForm({ me, close }) {
  const [v, setV] = useState({ name: me.name, bio: me.bio || "", branch: me.branch, sem: me.sem, teach: me.teach || [], want: me.want || [] });
  const toggle = (k, val) => setV((p) => ({ ...p, [k]: p[k].includes(val) ? p[k].filter((x) => x !== val) : [...p[k], val] }));
  return (
    <div className="col gap-16">
      <label className="field"><span className="lbl">Full name</span><input className="input" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></label>
      <label className="field"><span className="lbl">Bio</span><textarea className="textarea" style={{ minHeight: 70 }} value={v.bio} onChange={(e) => setV({ ...v, bio: e.target.value })} /></label>
      <div className="field"><span className="lbl">Branch</span><div className="wrap row gap-8">{BRANCHES.map((b) => <button key={b} className={`chip ${v.branch === b ? "on" : ""}`} onClick={() => setV({ ...v, branch: b })}>{b}</button>)}</div></div>
      <div className="field"><span className="lbl">Semester</span><div className="wrap row gap-8">{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <button key={n} className={`chip ${v.sem === n ? "on" : ""}`} style={{ minWidth: 44, justifyContent: "center" }} onClick={() => setV({ ...v, sem: n })}>{n}</button>)}</div></div>
      <div className="field"><span className="lbl">I can teach</span><div className="wrap row gap-8">{SKILLS.map((s) => <button key={s} className={`chip sm ${v.teach.includes(s) ? "on" : ""}`} onClick={() => toggle("teach", s)}>{s}</button>)}</div></div>
      <div className="field"><span className="lbl">I want to learn</span><div className="wrap row gap-8">{SKILLS.map((s) => <button key={s} className={`chip sm ${v.want.includes(s) ? "on" : ""}`} onClick={() => toggle("want", s)}>{s}</button>)}</div></div>
      <button className="btn lg block" onClick={() => (actions.updateProfile(v), close())}>Save changes</button>
    </div>
  );
}
