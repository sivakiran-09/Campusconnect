import { useState } from "react";
import "../styles/misc.css";
import { Icon } from "../lib/icons.jsx";
import { BackBar, Switch, TrustRing, Seg } from "../components/kit.jsx";
import { actions, useStore, useMe } from "../lib/store.jsx";
import { useNav } from "../lib/nav.jsx";
import { useUI } from "../lib/ui.jsx";
import { trustBreakdown } from "../lib/trust.js";
import { inr, fmtDate, timeAgoLong } from "../lib/format.js";
import { API_ON } from "../lib/api.js";
import { CAMPUS } from "../lib/seed.js";

/* ---------------- Settings ---------------- */
export function Settings() {
  const nav = useNav();
  const ui = useUI();
  const me = useMe();
  const theme = useStore((s) => s.theme);
  const prefs = useStore((s) => s.prefs);

  const doLogout = async () => {
    const ok = await ui.confirm({ title: "Sign out?", body: "You can sign back in with your college email any time." });
    if (ok) (actions.logout(), nav.go("hub"));
  };
  const doReset = async () => {
    const ok = await ui.confirm({ title: "Reset demo data?", body: "This clears everything and restarts the demo campus from scratch.", danger: true, ok: "Reset" });
    if (ok) actions.resetDemo();
  };

  return (
    <div className="screen">
      <BackBar title="Settings" onBack={nav.pop} />
      <div className="scroll pb-safe pad">
        <Section title="Account">
          <Row icon="mail" label="College email" value={me.email || `@${CAMPUS.domain}`} />
          <Row icon="edit" label="Edit profile" chevron onClick={() => nav.pop()} />
        </Section>

        <Section title="Appearance">
          <div className="theme-row">
            {[["system", "sun", "Auto"], ["light", "sun", "Light"], ["dark", "moon", "Dark"]].map(([id, ic, l]) => (
              <button key={id} className={`theme-opt ${theme === id ? "on" : ""}`} onClick={() => actions.setTheme(id)}>
                <Icon name={ic} />
                {l}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Notifications">
          <PrefRow label="Wishlist alerts" desc="When a matching item is listed" k="wishlist" prefs={prefs} />
          <PrefRow label="Return reminders" desc="Before an item is due back" k="returns" prefs={prefs} />
          <PrefRow label="Messages" desc="New chat messages" k="messages" prefs={prefs} />
          <PrefRow label="Show distance to others" desc="Approximate distance on listings" k="showDistance" prefs={prefs} />
        </Section>

        <Section title="About">
          <Row icon="shield" label="Community guidelines" chevron />
          <Row icon="lock" label="Privacy & data" chevron />
          <Row icon="info" label="App version" value="1.0.0 (Demo)" />
          <Row icon="globe" label="Connection" value={API_ON ? "Live backend" : "Demo mode"} />
        </Section>

        <button className="btn danger block mt-16" onClick={doReset}><Icon name="undo" />Reset demo data</button>
        <button className="btn ghost block mt-8" onClick={doLogout}><Icon name="logout" />Sign out</button>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
const Section = ({ title, children }) => (
  <section className="mt-20">
    <div className="s-title">{title}</div>
    <div className="s-card">{children}</div>
  </section>
);
const Row = ({ icon, label, value, chevron, onClick }) => (
  <button className="s-row" onClick={onClick} disabled={!onClick && !chevron}>
    <Icon name={icon} className="muted" />
    <span className="grow" style={{ textAlign: "left" }}>{label}</span>
    {value && <span className="small muted">{value}</span>}
    {chevron && <Icon name="next" className="muted" size={18} />}
  </button>
);
const PrefRow = ({ label, desc, k, prefs }) => (
  <div className="s-row" style={{ cursor: "default" }}>
    <div className="grow"><div>{label}</div><div className="tiny muted">{desc}</div></div>
    <Switch on={prefs[k]} onChange={() => actions.setPref(k, !prefs[k])} label={label} />
  </div>
);

/* ---------------- Trust detail ---------------- */
export function TrustDetail({ id }) {
  const nav = useNav();
  const u = useStore((s) => s.users[id || s.meId]);
  const { score, factors, tier } = trustBreakdown(u.stats);
  return (
    <div className="screen">
      <BackBar title="Campus Trust Score" sub={u.name} onBack={nav.pop} />
      <div className="scroll pb-safe pad">
        <div className="center mt-16"><TrustRing score={score} size={200} sub={tier.name} /></div>
        <p className="small soft-text center mt-12">Built from six signals, updated automatically after every exchange.</p>
        <div className="col gap-10 mt-20">
          {factors.map((f) => (
            <div key={f.key} className="factor-row">
              <div className="row between"><b className="small">{f.label}</b><span className="small bold primary-text">{f.points.toFixed(1)}<span className="muted" style={{ fontWeight: 500 }}> / {f.max.toFixed(0)}</span></span></div>
              <div className="bar mt-6"><div style={{ width: `${f.value * 100}%` }} /></div>
              <div className="tiny muted mt-4">{f.detail}</div>
            </div>
          ))}
        </div>
        <div className="pipeline-note mt-20"><Icon name="shield" /><span>Weights: transactions 30%, on-time returns 25%, condition 20%, ratings 15%, verification 5%, cancellations 5%. New accounts start from a neutral baseline that adjusts as history builds.</span></div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

/* ---------------- Wallet ---------------- */
export function Wallet() {
  const nav = useNav();
  const credits = useStore((s) => s.credits);
  const [tab, setTab] = useState("all");
  const rows = credits.ledger.filter((l) => tab === "all" || (tab === "earned" ? l.delta > 0 : l.delta < 0));
  return (
    <div className="screen">
      <BackBar title="Campus Credits" onBack={nav.pop} />
      <div className="scroll pb-safe pad">
        <div className="wallet-hero">
          <span className="tiny bold" style={{ opacity: 0.85 }}>Your balance</span>
          <div className="hero-num num">{credits.balance}<small style={{ fontSize: 16, fontWeight: 700, marginLeft: 6 }}>credits</small></div>
          <div className="small mt-4" style={{ opacity: 0.85 }}>Teach 1 hr = +10 · Learn 1 hr = −10</div>
        </div>
        <div className="pad" style={{ padding: "16px 0 6px" }}><Seg value={tab} onChange={setTab} items={[{ id: "all", label: "All" }, { id: "earned", label: "Earned" }, { id: "spent", label: "Spent" }]} /></div>
        <div className="col mt-8">
          {rows.map((l) => (
            <div key={l.id} className="ledger-row">
              <span className={`icon-tile ${l.delta > 0 ? "green" : ""}`}><Icon name={l.delta > 0 ? "arrow" : "swap"} style={l.delta > 0 ? { transform: "rotate(-90deg)" } : undefined} /></span>
              <div className="grow"><div className="small">{l.note}</div><div className="tiny muted">{timeAgoLong(l.at)}</div></div>
              <b className={`num ${l.delta > 0 ? "green-text" : ""}`}>{l.delta > 0 ? "+" : ""}{l.delta}</b>
            </div>
          ))}
        </div>
        <div className="pipeline-note mt-16"><Icon name="bulb" /><span>Earn more by offering a skill in the Skills tab, or by publishing a knowledge post that helps 100+ juniors.</span></div>
        <button className="btn block mt-16" onClick={() => nav.go("skills")}>Offer a skill<Icon name="arrow" /></button>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
