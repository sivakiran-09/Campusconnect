import { useState } from "react";
import "../styles/impact.css";
import { Icon } from "../lib/icons.jsx";
import { BackBar, Seg, Avatar } from "../components/kit.jsx";
import { useStore } from "../lib/store.jsx";
import { useNav } from "../lib/nav.jsx";
import { inr, compact } from "../lib/format.js";

export default function Impact() {
  const nav = useNav();
  const impact = useStore((s) => s.impact);
  const users = useStore((s) => s.users);
  const [tab, setTab] = useState("campus");
  const c = impact.campus;
  const m = impact.me;

  return (
    <div className="screen">
      <BackBar title="Campus Impact" onBack={nav.pop} />
      <div className="pad" style={{ paddingBottom: 8 }}><Seg value={tab} onChange={setTab} items={[{ id: "campus", label: "Campus-wide" }, { id: "me", label: "My footprint" }]} /></div>
      <div className="scroll pb-safe pad">
        {tab === "campus" ? (
          <>
            <div className="impact-hero">
              <div className="live-badge"><i className="live-dot" />Live campus sustainability feed</div>
              <h1>Campus Impact & Metrics</h1>
              <p className="small" style={{ opacity: 0.85 }}>Visualizing resource circularity, peer mentoring and collective savings.</p>
              <div className="hero-num num">{inr(c.savings)}</div>
              <div className="small" style={{ opacity: 0.85 }}>estimated student savings this term</div>
            </div>

            <div className="tile-grid mt-16">
              <Tile icon="repeat" label="Resources shared" value={compact(c.shared)} />
              <Tile icon="recycle" label="Resources reused" value={compact(c.reused)} tone="green" />
              <Tile icon="news" label="Knowledge posts" value={compact(c.knowledge)} />
              <Tile icon="briefcase" label="Interview experiences" value={compact(c.interviews)} />
              <Tile icon="swap" label="Skill exchanges" value={compact(c.skillExchanges)} tone="amber" />
              <Tile icon="clock" label="Hours mentored" value={compact(c.hours)} />
            </div>

            <section className="mt-24">
              <h2 className="h-md">Circularity & cost reduction</h2>
              <div className="reduce-card mt-12">
                <div className="row between"><span className="small muted">Peer cost vs bookstore retail</span><span className="badge green lg">{Math.round((1 - c.peerCost / c.retail) * 100)}% reduction</span></div>
                <div className="bar mt-12"><div style={{ width: `${(c.peerCost / c.retail) * 100}%` }} /></div>
                <div className="row between mt-8 small"><span>Paid by students <b>{inr(c.peerCost)}</b></span><span>Total value retained <b className="green-text">{inr(c.retail - c.peerCost)}</b></span></div>
              </div>
              <div className="col gap-10 mt-12">
                {c.categories.map((cat) => (
                  <div key={cat.id} className="cat-row">
                    <span className="icon-tile"><Icon name={cat.id === "books" ? "book" : cat.id === "lab" ? "flask" : "cpu"} /></span>
                    <div className="grow"><b className="small">{cat.label}</b><div className="tiny muted">{cat.rate} · {cat.loans} active loans</div></div>
                    <b className="small num">{inr(cat.retained)}</b>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-24">
              <h2 className="h-md">Senior knowledge preservation</h2>
              <p className="small soft-text">Preserving senior knowledge for future batches and enabling peer mentoring.</p>
              <div className="row gap-10 mt-12">
                <div className="stat-tile grow"><div className="k">Study packs archived</div><div className="v">{c.packs}</div></div>
                <div className="stat-tile grow"><div className="k">Mentoring completed</div><div className="v">{c.sessions}+</div></div>
              </div>
              <div className="hall mt-12">
                <Avatar u={users[c.hall.userId]} tick />
                <div className="grow"><b className="small">{users[c.hall.userId]?.name} <span className="badge amber" style={{ marginLeft: 6 }}>Hall of Fame</span></b><div className="tiny muted">{c.hall.title} · {c.hall.downloads} downloads · {c.hall.hours} hrs mentored</div></div>
              </div>
            </section>

            <section className="mt-24">
              <h2 className="h-md">Environmental ROI</h2>
              <div className="row gap-10 mt-12">
                <div className="eco-tile"><Icon name="tree" /><b className="num">{c.waste} tons</b><span>Landfill waste diverted</span></div>
                <div className="eco-tile"><Icon name="leaf" /><b className="num">{c.co2} MT</b><span>CO₂e emissions avoided</span></div>
              </div>
              <div className="row between mt-16 small"><span>Green circularity target</span><b>{c.greenTarget}% achieved</b></div>
              <div className="bar mt-8" style={{ background: "var(--surface-3)" }}><div style={{ width: `${c.greenTarget}%`, background: "var(--green)" }} /></div>
            </section>
          </>
        ) : (
          <>
            <div className="impact-hero" style={{ background: "linear-gradient(150deg, #0a7a4d, #23b878)" }}>
              <div className="live-badge">Level {m.level} Peer</div>
              <h1>Your impact</h1>
              <div className="hero-num num">{inr(m.saved)}</div>
              <div className="small" style={{ opacity: 0.85 }}>saved through reuse this year</div>
            </div>
            <div className="tile-grid mt-16">
              <Tile icon="recycle" label="Items reused" value={m.reused} tone="green" />
              <Tile icon="leaf" label="CO₂e avoided" value={`${m.co2} kg`} tone="green" />
              <Tile icon="news" label="Posts shared" value={m.posts} />
              <Tile icon="grad" label="Sessions taught" value={m.sessions} tone="amber" />
              <Tile icon="handshake" label="Exchanges" value={m.exchanges} />
              <Tile icon="clock" label="Hours taught" value={m.hoursTaught} />
            </div>
            <div className="pipeline-note mt-24"><Icon name="rocket" /><span>Keep lending, teaching and sharing notes — your Campus Impact Score grows with every exchange.</span></div>
          </>
        )}
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

const Tile = ({ icon, label, value, tone }) => (
  <div className="impact-tile">
    <span className={`icon-tile ${tone || ""}`}><Icon name={icon} /></span>
    <b className="num">{value}</b>
    <span>{label}</span>
  </div>
);
