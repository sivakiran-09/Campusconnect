import { useEffect, useMemo, useState } from "react";
import "../styles/resources.css";
import { Icon, CAT_ICON } from "../lib/icons.jsx";
import { Seg, Empty, Switch } from "../components/kit.jsx";
import { ListingCard, TxCard } from "../components/cards.jsx";
import { actions, set, useStore, useMe, isActiveTx, needsMyAction, txRole, wishlistMatches } from "../lib/store.jsx";
import { useNav } from "../lib/nav.jsx";
import { useUI } from "../lib/ui.jsx";
import { CATEGORIES } from "../lib/seed.js";
import { API_ON } from "../lib/api.js";
import { inr, priceLabel, distance } from "../lib/format.js";
import { matchResources } from "../lib/matching.js";
import { trustOf } from "../lib/trust.js";

const SORTS = { new: "Newest", near: "Nearest", cheap: "Price: low to high", liked: "Most liked", trust: "Most trusted" };
const EMPTY = { mode: null, cat: null, sem: null, branch: null, maxPrice: null, maxDist: null, sort: "new", availableOnly: true };

export default function Resources() {
  const nav = useNav();
  const ui = useUI();
  const me = useMe();
  const resources = useStore((s) => s.resources);
  const users = useStore((s) => s.users);
  const txs = useStore((s) => s.transactions);
  const wishlist = useStore((s) => s.wishlist);
  const browse = useStore((s) => s.browse);
  const flags = useStore((s) => s.flags);
  const [tab, setTab] = useState("browse");
  const [q, setQ] = useState("");
  const [f, setF] = useState(EMPTY);
  const [view, setView] = useState("list");

  useEffect(() => {
    if (browse && (browse.mode || browse.cat)) {
      setTab("browse");
      setF((x) => ({ ...x, mode: browse.mode, cat: browse.cat }));
      set({ browse: { mode: null, cat: null } });
    }
  }, [browse]);
  useEffect(() => {
    const h = () => (setTab("wishlist"), openWishSheet(ui));
    window.addEventListener("cc:add-wish", h);
    return () => window.removeEventListener("cc:add-wish", h);
  }, [ui]);

  const list = useMemo(() => {
    let rows = resources.filter((r) => r.ownerId !== me.id);
    if (f.availableOnly) rows = rows.filter((r) => !r.status || r.status === "available");
    if (f.mode) rows = rows.filter((r) => r.mode === f.mode);
    if (f.cat) rows = rows.filter((r) => r.category === f.cat);
    if (f.sem) rows = rows.filter((r) => r.sem === f.sem);
    if (f.branch) rows = rows.filter((r) => r.branch === f.branch || r.branch === "ALL");
    if (f.maxPrice != null) rows = rows.filter((r) => r.mode === "DONATE" || r.price <= f.maxPrice);
    if (f.maxDist) rows = rows.filter((r) => r.distanceM <= f.maxDist);
    if (q.trim()) {
      const m = matchResources(q, rows, users, { limit: 50 });
      return m.results.map((x) => x.r);
    }
    const by = { new: (a, b) => b.createdAt - a.createdAt, near: (a, b) => a.distanceM - b.distanceM, cheap: (a, b) => a.price - b.price, liked: (a, b) => b.likes - a.likes, trust: (a, b) => trustOf(users[b.ownerId]) - trustOf(users[a.ownerId]) };
    return [...rows].sort(by[f.sort]);
  }, [resources, users, f, q, me.id]);

  const activeCount = ["mode", "cat", "sem", "branch", "maxPrice", "maxDist"].filter((k) => f[k] != null).length + (f.sort !== "new" ? 1 : 0);
  const pending = txs.filter((t) => needsMyAction(t)).length;
  const openItem = (r) => nav.push("item", { id: r.id });

  return (
    <>
      <header className="appbar">
        <h1>Resources</h1>
        <span className="spacer" />
        <button className="icon-btn" onClick={() => nav.push("search")} aria-label="Smart search"><Icon name="sparkles" /></button>
        <button className="btn sm" onClick={() => nav.push("create")}><Icon name="plus" />List item</button>
      </header>
      <div className="pad" style={{ paddingBottom: 10 }}>
        <Seg value={tab} onChange={setTab} items={[{ id: "browse", label: "Browse" }, { id: "exchanges", label: "Exchanges", count: pending }, { id: "wishlist", label: "Wishlist" }]} />
      </div>

      <div className="scroll pb-tab">
        {tab === "browse" && (
          <>
            <div className="pad row gap-8">
              <label className="search grow" style={{ boxShadow: "none" }}>
                <Icon name="search" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search books, kits, cycles…" aria-label="Search resources" />
                {q && <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setQ("")} aria-label="Clear"><Icon name="x" size={16} /></button>}
              </label>
              <button className={`filter-btn ${activeCount ? "on" : ""}`} onClick={() => openFilterSheet(ui, f, setF)} aria-label="Filters">
                <Icon name="sliders" />
                {activeCount > 0 && <span className="fdot">{activeCount}</span>}
              </button>
            </div>
            <div className="hscroll mt-12">
              {["LEND", "SELL", "DONATE"].map((m) => <button key={m} className={`chip ${f.mode === m ? "on" : ""}`} onClick={() => setF({ ...f, mode: f.mode === m ? null : m })}>{m[0] + m.slice(1).toLowerCase()}</button>)}
              <span style={{ width: 1, background: "var(--line)", margin: "6px 2px", flex: "none" }} />
              {CATEGORIES.map((c) => <button key={c.id} className={`chip ${f.cat === c.id ? "on" : ""}`} onClick={() => setF({ ...f, cat: f.cat === c.id ? null : c.id })}><Icon name={CAT_ICON[c.id]} />{c.label}</button>)}
            </div>
            <div className="row between pad mt-12">
              <span className="small muted"><b className="soft-text">{list.length}</b> result{list.length === 1 ? "" : "s"}{q ? ` for “${q}”` : ""} · {SORTS[f.sort]}</span>
              <div className="viewtoggle" role="group" aria-label="Layout">
                <button aria-pressed={view === "list"} onClick={() => setView("list")} aria-label="List"><Icon name="layers" /></button>
                <button aria-pressed={view === "grid"} onClick={() => setView("grid")} aria-label="Grid"><Icon name="grid" /></button>
              </div>
            </div>
            <div className="mt-12">
              {list.length ? (
                <div className={view === "grid" ? "listing-grid" : "listing-list"}>
                  {list.map((r) => <ListingCard key={r.id} r={r} compact={view === "grid"} onOpen={openItem} />)}
                </div>
              ) : (
                <Empty icon="search" title="No matches on campus yet" body="Add it to your wishlist and we'll alert you the moment a student lists it." action={<button className="btn mt-8" onClick={() => (actions.addWishlist({ title: q || "New item", mode: "ANY" }), setTab("wishlist"))}><Icon name="bell" />Add “{q || "this"}” to wishlist</button>} />
              )}
            </div>
          </>
        )}
        {tab === "exchanges" && <Exchanges txs={txs} nav={nav} meId={me.id} />}
        {tab === "wishlist" && <Wishlist ui={ui} wishlist={wishlist} nav={nav} flags={flags} />}
      </div>
    </>
  );
}

const actionLabel = (tx, role) => {
  if (tx.status === "REQUESTED") return role === "owner" ? "Review request" : "Waiting…";
  if (tx.status === "ACCEPTED") return role === "owner" ? "Show QR" : "Scan QR";
  if (tx.status === "ACTIVE") return role === "borrower" ? "Return item" : "In use";
  if (tx.status === "RETURN_PENDING") return role === "owner" ? "Confirm return" : "Verifying…";
  if (tx.status === "RETURNED") return tx.review ? "Reviewed" : "Leave review";
  return "";
};

function Group({ title, list, meId, open }) {
  if (!list.length) return null;
  return (
    <section className="mt-16">
      <div className="pad row between" style={{ marginBottom: 8 }}><h2 className="h-md">{title}</h2></div>
      <div className="listing-list">
        {list.map((t) => {
          const lbl = actionLabel(t, txRole(t, meId));
          return <TxCard key={t.id} tx={t} onOpen={open} action={lbl && <span className={`badge lg ${needsMyAction(t) ? "solid" : "gray"}`}>{lbl}</span>} />;
        })}
      </div>
    </section>
  );
}

function Exchanges({ txs, nav, meId }) {
  const mine = txs.filter((t) => t.ownerId === meId || t.borrowerId === meId);
  const action = mine.filter(needsMyAction);
  const active = mine.filter((t) => isActiveTx(t) && !needsMyAction(t));
  const done = mine.filter((t) => !isActiveTx(t));
  const open = (t) => nav.push("handoff", { id: t.id });
  if (!mine.length) return <Empty icon="handshake" title="No exchanges yet" body="Request a textbook, calculator or cycle. Every handover is verified with a QR and condition photos." action={<button className="btn mt-8" onClick={() => nav.go("hub")}>Browse resources</button>} />;
  return (
    <>
      <div className="pad">
        <div className="ex-summary">
          <div><b className="num">{action.length}</b><span>need you</span></div>
          <div><b className="num">{active.length}</b><span>in progress</span></div>
          <div><b className="num">{done.filter((t) => t.status === "RETURNED").length}</b><span>completed</span></div>
        </div>
      </div>
      <Group title="Needs your action" list={action} meId={meId} open={open} />
      <Group title="In progress" list={active} meId={meId} open={open} />
      <Group title="History" list={done} meId={meId} open={open} />
    </>
  );
}

function Wishlist({ ui, wishlist, nav, flags }) {
  const matches = useMemo(() => wishlistMatches(), [wishlist, flags.live]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <div className="pad">
        <div className="wish-hero">
          <span className="icon-tile amber"><Icon name="bell" /></span>
          <div className="grow"><b>Never miss a listing</b><div className="small soft-text">We alert you the moment a student lists something on your wishlist.</div></div>
        </div>
        <button className="btn block mt-12" onClick={() => openWishSheet(ui)}><Icon name="plus" />Add to wishlist</button>
        {!API_ON && !flags.live && (
          <button className="btn soft block mt-8" onClick={() => actions.addLive(true)}><Icon name="sparkles" />Demo: simulate a matching listing</button>
        )}
      </div>
      <div className="pad col gap-12 mt-16">
        {wishlist.length === 0 && <Empty icon="bell" title="Your wishlist is empty" body="Add a textbook or calculator you need. We'll do the watching." />}
        {wishlist.map((w) => {
          const hit = matches.find((m) => m.w.id === w.id);
          return (
            <div key={w.id} className={`wcard ${hit ? "hit" : ""}`}>
              <div className="row">
                <span className={`icon-tile ${hit ? "green" : ""}`}><Icon name={hit ? "ok" : "search"} /></span>
                <div className="grow">
                  <div className="bold">{w.title}</div>
                  <div className="tiny muted">{w.mode === "ANY" ? "Any mode" : w.mode[0] + w.mode.slice(1).toLowerCase()}{w.maxPrice ? ` · up to ${inr(w.maxPrice)}` : ""}</div>
                </div>
                <div className="col" style={{ alignItems: "center", gap: 4 }}>
                  <Switch on={w.alerts} onChange={() => actions.toggleAlert(w.id)} label={`Alerts for ${w.title}`} />
                  <span className="tiny muted">Alerts</span>
                </div>
              </div>
              {hit ? (
                <button className="wmatch" onClick={() => nav.push("item", { id: hit.r.id })}>
                  <Icon name="sparkles" />
                  <div className="grow" style={{ textAlign: "left" }}><b>Available now</b><div className="small">{hit.r.title} · {priceLabel(hit.r)} · {distance(hit.r.distanceM)}</div></div>
                  <span className="badge solid green">{hit.pct}% match</span>
                </button>
              ) : (
                <div className="row between mt-8"><span className="small muted">Watching campus listings…</span><button className="small bold red-text" onClick={() => actions.removeWishlist(w.id)}>Remove</button></div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export function openWishSheet(ui) {
  ui.openSheet({ title: "Add to wishlist", render: (close) => <WishForm close={close} /> });
}
function WishForm({ close }) {
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState("ANY");
  const [max, setMax] = useState("");
  const [alerts, setAlerts] = useState(true);
  const sugg = ["Operating Systems: Galvin", "Computer Networks: Tanenbaum", "Casio calculator", "Drafter kit", "Guitar"];
  return (
    <div className="col gap-16">
      <label className="field"><span className="lbl">What do you need?</span><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Operating Systems, Galvin" autoFocus /></label>
      <div className="wrap row gap-8">{sugg.map((s) => <button key={s} className="chip sm" onClick={() => setTitle(s)}>{s}</button>)}</div>
      <div className="field"><span className="lbl">Mode</span><div className="row gap-8">{["ANY", "LEND", "SELL", "DONATE"].map((m) => <button key={m} className={`chip ${mode === m ? "on" : ""}`} onClick={() => setMode(m)}>{m === "ANY" ? "Any" : m[0] + m.slice(1).toLowerCase()}</button>)}</div></div>
      <label className="field"><span className="lbl">Max price (optional)</span><input className="input" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} placeholder="₹" /></label>
      <div className="row between"><div><b>Alert me instantly</b><div className="small muted">Push + in-app notification</div></div><Switch on={alerts} onChange={setAlerts} label="Alerts" /></div>
      <button className="btn lg block" disabled={title.trim().length < 3} onClick={() => (actions.addWishlist({ title: title.trim(), mode, maxPrice: max ? +max : null, alerts }), close())}>Add to wishlist</button>
    </div>
  );
}

function openFilterSheet(ui, f, setF) {
  ui.openSheet({ title: "Filters", tall: true, render: (close) => <FilterForm initial={f} apply={(v) => (setF(v), close())} /> });
}
function FilterForm({ initial, apply }) {
  const [v, setV] = useState(initial);
  const up = (k, val) => setV((x) => ({ ...x, [k]: x[k] === val ? null : val }));
  const Chips = ({ k, items }) => <div className="wrap row gap-8">{items.map(([val, label]) => <button key={String(val)} className={`chip ${v[k] === val ? "on" : ""}`} onClick={() => up(k, val)}>{label}</button>)}</div>;
  return (
    <div className="col gap-16">
      <div className="field"><span className="lbl">Mode</span><Chips k="mode" items={[["LEND", "Lend"], ["SELL", "Sell"], ["DONATE", "Donate"]]} /></div>
      <div className="field"><span className="lbl">Category</span><Chips k="cat" items={CATEGORIES.map((c) => [c.id, c.label])} /></div>
      <div className="field"><span className="lbl">Semester</span><Chips k="sem" items={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => [n, String(n)])} /></div>
      <div className="field"><span className="lbl">Branch</span><Chips k="branch" items={["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM"].map((b) => [b, b])} /></div>
      <div className="field"><span className="lbl">Distance</span><Chips k="maxDist" items={[[500, "Under 500 m"], [1000, "Under 1 km"], [3000, "Under 3 km"]]} /></div>
      <div className="field">
        <span className="lbl row between"><span>Max price</span><b className="primary-text">{v.maxPrice != null ? inr(v.maxPrice) : "Any"}</b></span>
        <input type="range" min="0" max="1000" step="50" value={v.maxPrice ?? 1000} onChange={(e) => setV({ ...v, maxPrice: +e.target.value >= 1000 ? null : +e.target.value })} aria-label="Max price" />
      </div>
      <div className="field"><span className="lbl">Sort by</span><div className="wrap row gap-8">{Object.entries(SORTS).map(([id, l]) => <button key={id} className={`chip ${v.sort === id ? "on" : ""}`} onClick={() => setV({ ...v, sort: id })}>{l}</button>)}</div></div>
      <div className="row between"><div><b>Available now only</b><div className="small muted">Hide items on loan or reserved</div></div><Switch on={v.availableOnly} onChange={(x) => setV({ ...v, availableOnly: x })} label="Available only" /></div>
      <div className="row gap-8">
        <button className="btn ghost grow" onClick={() => setV(EMPTY)}>Reset</button>
        <button className="btn grow" style={{ flex: 2 }} onClick={() => apply(v)}>Show results</button>
      </div>
    </div>
  );
}
