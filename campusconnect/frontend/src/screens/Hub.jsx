import { useEffect, useMemo, useState } from "react";
import "../styles/hub.css";
import { Icon, CAT_ICON, MODE_ICON } from "../lib/icons.jsx";
import { Avatar, StoryAvatar, SectionHead, Empty } from "../components/kit.jsx";
import { ListingCard, PostCard, SkillCard } from "../components/cards.jsx";
import { StoryViewer } from "../components/stories.jsx";
import { actions, set, useStore, useMe, wishlistMatches, txRole } from "../lib/store.jsx";
import { useNav } from "../lib/nav.jsx";
import { useUI } from "../lib/ui.jsx";
import { CATEGORIES, CAMPUS } from "../lib/seed.js";
import { API_ON } from "../lib/api.js";
import { compact, priceLabel } from "../lib/format.js";
import { SUGGESTIONS } from "../lib/campusAi.js";
import { openSkillBooking } from "./Skills.jsx";
import { openCreateMenu } from "./CreateMenu.jsx";

const MODES = [
  { id: "LEND", label: "Lend", hint: "Rent by wk/day", pop: true },
  { id: "SELL", label: "Sell", hint: "Price-capped" },
  { id: "DONATE", label: "Donate", hint: "Free dorm drop" },
];

export default function Hub({ active }) {
  const nav = useNav();
  const ui = useUI();
  const me = useMe();
  const resources = useStore((s) => s.resources);
  const stories = useStore((s) => s.stories);
  const users = useStore((s) => s.users);
  const txs = useStore((s) => s.transactions);
  const knowledge = useStore((s) => s.knowledge);
  const skills = useStore((s) => s.skills);
  const unread = useStore((s) => s.notifications.filter((n) => !n.read).length);
  const impact = useStore((s) => s.impact);
  const flags = useStore((s) => s.flags);
  const wl = useStore((s) => s.wishlist);
  const [mode, setMode] = useState("LEND");
  const [cat, setCat] = useState(null);
  const [story, setStory] = useState(null);

  useEffect(() => {
    if (API_ON || flags.live) return;
    const t = setTimeout(() => actions.addLive(), 9000);
    return () => clearTimeout(t);
  }, [flags.live]);

  const featured = useMemo(
    () => resources.filter((r) => r.ownerId !== me.id && r.mode === mode && (!cat || r.category === cat) && (!r.status || r.status === "available")).sort((a, b) => b.createdAt - a.createdAt || b.likes - a.likes),
    [resources, mode, cat, me.id]
  );
  const matches = useMemo(() => wishlistMatches(), [resources, wl]); // eslint-disable-line react-hooks/exhaustive-deps
  const handover = txs.find((t) => t.status === "ACCEPTED");
  const role = handover && txRole(handover, me.id);
  const hoRes = handover && resources.find((r) => r.id === handover.resourceId);
  const openItem = (r) => nav.push("item", { id: r.id });
  const seeAll = () => (set({ browse: { mode, cat } }), nav.go("resources"));
  const mentors = skills.filter((s) => s.userId !== me.id).slice(0, 2);

  return (
    <>
      <header className="appbar">
        <div className="brand"><Icon name="shield" />CampusConnect</div>
        <span className="spacer" />
        <button className="icon-btn filled" onClick={() => openCreateMenu(ui, nav)} aria-label="Create"><Icon name="plus" /></button>
        <button className="icon-btn" onClick={() => nav.push("notifications")} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Icon name="bell" />
          {unread > 0 && <span className="dot">{unread}</span>}
        </button>
        <button onClick={() => nav.go("me")} aria-label="Your profile"><Avatar u={me} size="sm" tick /></button>
      </header>

      <div className="scroll pb-tab">
        <div className="stories" role="list" aria-label="Campus stories">
          <StoryAvatar add label="Your story" onClick={() => nav.push("post", { compose: true })} />
          {stories.map((s) => (
            <StoryAvatar key={s.id} u={users[s.authorId]} label={s.label} seen={s.seen} onClick={() => setStory(s.id)} />
          ))}
        </div>

        <div className="pad mt-12">
          <div className="zone-card">
            <span className="zone-logo"><Icon name="shield" /></span>
            <div className="grow">
              <div className="row between" style={{ alignItems: "flex-start", gap: 8 }}>
                <b className="zone-title">Campus-Only Protected Zone</b>
                <span className="badge solid green" style={{ flex: "none" }}>SSO verified</span>
              </div>
              <p className="small soft-text">Secured by student SSO, AI condition checks and QR handoffs at designated Safe Zones.</p>
              <div className="zone-me"><Icon name="check" />{me.email || `@${CAMPUS.domain}`}<span className="dotsep" /><Icon name="star" size={12} style={{ fill: "var(--gold)", color: "var(--gold)" }} />{(me.stats.ratingAvg || 0).toFixed(1)} ({me.stats.ratingCount || 0})</div>
            </div>
          </div>
        </div>

        <div className="pad mt-16">
          <button className="search" onClick={() => nav.push("search")} aria-label="Search resources">
            <Icon name="search" />
            <span className="txt">Search course code, or “DBMS book for 10 days”</span>
            <span className="fbtn"><Icon name="sliders" />Filter</span>
          </button>
        </div>

        {matches.length > 0 && (
          <div className="pad mt-12">
            <button className="wish-banner" onClick={() => nav.push("item", { id: matches[0].r.id })}>
              <span className="wb-ic"><Icon name="sparkles" /></span>
              <div className="grow"><b>Your wishlist item is available!</b><div className="small">{matches[0].r.title} · {priceLabel(matches[0].r)}</div></div>
              <Icon name="next" />
            </button>
          </div>
        )}

        <div className="row between pad" style={{ margin: "22px 0 10px" }}>
          <h2 className="h-sm">Exchange resource mode</h2>
          <span className="small bold green-text row gap-6"><i className="live-dot" />{CAMPUS.activeNow} active on campus</span>
        </div>
        <div className="pad">
          <div className="mode-seg" role="tablist" aria-label="Resource mode">
            {MODES.map((m) => (
              <button key={m.id} role="tab" aria-selected={mode === m.id} className={`m-${m.id}`} onClick={() => setMode(m.id)}>
                {m.pop && <span className="popular">Popular</span>}
                <span className="m-l">{m.label}<Icon name={MODE_ICON[m.id]} size={15} /></span>
                <span className="m-h">{m.hint}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="hscroll mt-12" role="tablist" aria-label="Categories">
          <button className={`chip ${!cat ? "on" : ""}`} onClick={() => setCat(null)}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} className={`chip ${cat === c.id ? "on" : ""}`} onClick={() => setCat(cat === c.id ? null : c.id)}><Icon name={CAT_ICON[c.id]} />{c.label}</button>
          ))}
        </div>

        <div className="pad mt-16">
          {handover ? (
            <div className="handover-card">
              <div className="grow">
                <div className="row gap-6 tiny bold green-text"><i className="live-dot" />SAFE ZONE MEETUP</div>
                <h3>Quick Campus Handover</h3>
                <p className="small soft-text">{hoRes?.title}: {role === "owner" ? "show the QR" : "scan the owner's QR"} at the Safe Desk.</p>
              </div>
              <button className="ho-btn" onClick={() => nav.push("handoff", { id: handover.id })} aria-label="Open handover">
                <Icon name="qr" size={26} />
                {role === "owner" ? "Show QR" : "Scan QR"}
              </button>
            </div>
          ) : (
            <div className="handover-card idle">
              <div className="grow"><h3>Quick Campus Handover</h3><p className="small soft-text">Request an item and meet at a Safe Zone. We'll create a QR handover for you.</p></div>
              <span className="icon-tile"><Icon name="qr" /></span>
            </div>
          )}
        </div>

        <SectionHead title="Featured listings" more={`See all (${featured.length})`} onMore={seeAll} />
        {featured.length ? (
          <div className="listing-list">
            {featured.slice(0, 3).map((r) => <ListingCard key={r.id} r={r} onOpen={openItem} />)}
          </div>
        ) : (
          <Empty icon="search" title="Nothing here yet" body="No listings in this mode and category. Try another filter or add it to your wishlist." action={<button className="btn soft sm mt-8" onClick={() => { setCat(null); setMode("LEND"); }}>Reset filters</button>} />
        )}

        <div className="section-h" style={{ paddingBottom: 6 }}>
          <div className="row gap-8" style={{ alignItems: "center" }}>
            <span className="icon-tile" style={{ width: 34, height: 34 }}><Icon name="bulb" /></span>
            <div><div className="tiny bold primary-text">Peer knowledge hub</div><h2>1-on-1 mentoring & skill swaps</h2></div>
          </div>
        </div>
        <div className="pad col gap-12">
          {mentors.map((s) => <SkillCard key={s.id} s={s} onBook={(sk, m, min) => openSkillBooking(ui, sk, m, min)} onOpenUser={(u) => nav.push("user", { id: u.id })} />)}
          <button className="btn soft block" onClick={() => nav.go("skills")}>Browse all skills<Icon name="arrow" /></button>
        </div>

        <div className="pad mt-24">
          <div className="ai-card">
            <div className="row gap-8"><span className="ai-ic"><Icon name="sparkles" /></span><div><b>Ask Campus AI</b><div className="small" style={{ opacity: 0.85 }}>Answers from {compact(impact.campus.knowledge)} senior contributions</div></div></div>
            <div className="ai-chips">
              {SUGGESTIONS.slice(0, 3).map((q) => <button key={q} onClick={() => nav.push("chat", { id: "ai", ask: q })}>{q}</button>)}
            </div>
          </div>
        </div>

        <SectionHead title="Fresh from seniors" more="Knowledge hub" onMore={() => { nav.go("skills"); setTimeout(() => window.dispatchEvent(new CustomEvent("cc:knowledge")), 200); }} />
        <div className="listing-list">
          {knowledge.slice(0, 2).map((p) => <PostCard key={p.id} p={p} onOpen={(x) => nav.push("post", { id: x.id })} onAsk={(x) => nav.push("chat", { id: "ai", ask: `What did seniors share about ${x.title}?` })} />)}
        </div>

        <div className="pad mt-24">
          <button className="impact-card" onClick={() => nav.push("impact")}>
            <div className="row between"><span className="tiny bold" style={{ opacity: 0.85 }}>Campus impact this term</span><Icon name="arrowUR" /></div>
            <div className="ic-big num">₹{(impact.campus.savings / 1e5).toFixed(1)} lakh</div>
            <div className="small" style={{ opacity: 0.85 }}>saved by students through reuse</div>
            <div className="ic-stats">
              <div><b className="num">{impact.campus.shared.toLocaleString("en-IN")}</b><span>shared</span></div>
              <div><b className="num">{impact.campus.reused.toLocaleString("en-IN")}</b><span>reused</span></div>
              <div><b className="num">{impact.campus.knowledge.toLocaleString("en-IN")}</b><span>knowledge</span></div>
            </div>
          </button>
        </div>
      </div>

      {story && (
        <StoryViewer
          story={stories.find((s) => s.id === story)}
          onClose={() => setStory(null)}
          onNextStory={() => {
            const i = stories.findIndex((s) => s.id === story);
            setStory(stories[i + 1]?.id || null);
          }}
        />
      )}
    </>
  );
}
