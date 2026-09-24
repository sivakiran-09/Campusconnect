import { useMemo, useState } from "react";
import { Icon } from "../lib/icons.jsx";
import { Empty } from "../components/kit.jsx";
import { ListingCard } from "../components/cards.jsx";
import { useStore, useMe } from "../lib/store.jsx";
import { useNav } from "../lib/nav.jsx";
import { matchResources, describeIntent } from "../lib/matching.js";
import { SUGGESTIONS } from "../lib/campusAi.js";

export default function Search() {
  const nav = useNav();
  const me = useMe();
  const resources = useStore((s) => s.resources);
  const users = useStore((s) => s.users);
  const [q, setQ] = useState("");
  const pool = resources.filter((r) => r.ownerId !== me.id);
  const { parsed, results } = useMemo(() => matchResources(q, pool, users, { limit: 12 }), [q, pool, users]);
  const chips = describeIntent(parsed);
  return (
    <div className="screen">
      <header className="appbar line">
        <button className="icon-btn" onClick={nav.pop} aria-label="Back"><Icon name="back" /></button>
        <label className="search grow" style={{ boxShadow: "none" }}>
          <Icon name="sparkles" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder='Try "DBMS book for 10 days"' aria-label="Smart search" />
        </label>
      </header>
      <div className="scroll pb-safe pad">
        {!q && (
          <div className="col gap-8 mt-8">
            <div className="small bold muted">Try asking</div>
            {SUGGESTIONS.filter((s) => !/tips|trust|internship/i.test(s)).map((s) => <button key={s} className="chip" style={{ justifyContent: "flex-start" }} onClick={() => setQ(s)}>{s}</button>)}
          </div>
        )}
        {q && (
          <>
            {chips.length > 0 && <div className="wrap row gap-6 mt-8">{chips.map((c) => <span key={c.k} className="badge">{c.k}: {c.v}</span>)}</div>}
            <div className="listing-list mt-16" style={{ padding: 0 }}>
              {results.map(({ r, pct }) => (
                <div key={r.id} style={{ position: "relative" }}>
                  <span className="badge solid" style={{ position: "absolute", top: 12, right: 12, zIndex: 1 }}>{pct}% match</span>
                  <ListingCard r={r} onOpen={(x) => nav.push("item", { id: x.id })} />
                </div>
              ))}
              {!results.length && <Empty icon="search" title="No matches yet" body="Try different words, or add it to your wishlist from Resources." />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
