import { Icon } from "../lib/icons.jsx";
import booksPhoto from "../assets/books.jpg";

const PHOTOS = { books: booksPhoto };
const KIND_ICON = { coat: "coat", kit: "micro", bike: "bike", guitar: "guitar", pi: "cpu", drafter: "ruler", notes: "notes", book: "book", calc: "calc", gadget: "cpu" };

/** Designed placeholder cover: shows the real uploaded photo when there is one. */
export function CoverArt({ r, art, src, className = "" }) {
  const a = art || r?.art || { kind: "book", hue: 240, label: r?.title?.slice(0, 8) };
  const img = src || r?.images?.[0] || (r?.photo && PHOTOS[r.photo] && r.photo === "books" && !r.art ? PHOTOS[r.photo] : null);
  if (img) return <div className={`cover ${className}`}><img src={img} alt={r?.title || ""} loading="lazy" /></div>;
  const h = a.hue;
  const c1 = `hsl(${h} 68% 34%)`;
  const c2 = `hsl(${(h + 42) % 360} 74% 56%)`;
  const paper = `hsl(${h} 90% 96%)`;
  return (
    <div className={`cover ${className}`} style={{ background: `linear-gradient(140deg, ${c1}, ${c2})` }} role="img" aria-label={r?.title || a.label}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <circle cx="330" cy="40" r="120" fill="#fff" opacity=".08" />
        <circle cx="40" cy="290" r="110" fill="#fff" opacity=".07" />
        <g opacity=".12" fill="#fff">{Array.from({ length: 18 }, (_, i) => <circle key={i} cx={30 + (i % 6) * 68} cy={40 + Math.floor(i / 6) * 110} r="3" />)}</g>
        {a.kind === "book" && (
          <g transform="translate(200 150) rotate(-6)">
            <rect x="-62" y="-104" width="132" height="190" rx="9" fill="#000" opacity=".22" transform="translate(9 12)" />
            <rect x="-70" y="-108" width="132" height="190" rx="9" fill={paper} />
            <rect x="-70" y="-108" width="18" height="190" rx="6" fill={c1} opacity=".92" />
            <rect x="-40" y="-84" width="80" height="9" rx="4.5" fill={c1} />
            <rect x="-40" y="-66" width="56" height="7" rx="3.5" fill={c2} />
            <circle cx="10" cy="4" r="30" fill="none" stroke={c2} strokeWidth="9" />
            <circle cx="10" cy="4" r="12" fill={c1} />
            <text x="-4" y="66" textAnchor="middle" fontSize="19" fontWeight="800" fill={c1} fontFamily="inherit">{(a.label || "").slice(0, 9)}</text>
          </g>
        )}
        {a.kind === "calc" && (
          <g transform="translate(200 152) rotate(5)">
            <rect x="-62" y="-104" width="132" height="196" rx="18" fill="#000" opacity=".22" transform="translate(9 12)" />
            <rect x="-70" y="-108" width="132" height="196" rx="18" fill={`hsl(${h} 30% 16%)`} />
            <rect x="-56" y="-94" width="104" height="44" rx="8" fill="#c9f2d7" />
            <rect x="-48" y="-84" width="60" height="7" rx="3" fill="#0b6b3f" opacity=".7" />
            <rect x="-48" y="-70" width="86" height="12" rx="3" fill="#0b6b3f" />
            {Array.from({ length: 20 }, (_, i) => <rect key={i} x={-56 + (i % 4) * 27} y={-36 + Math.floor(i / 4) * 24} width="22" height="16" rx="6" fill={i > 15 ? c2 : "#fff"} opacity={i > 15 ? 1 : 0.88} />)}
          </g>
        )}
        {a.kind !== "book" && a.kind !== "calc" && (
          <g transform="translate(200 150)">
            <rect x="-74" y="-86" width="148" height="148" rx="34" fill="#000" opacity=".2" transform="translate(8 10)" />
            <rect x="-74" y="-92" width="148" height="148" rx="34" fill={paper} />
          </g>
        )}
      </svg>
      {a.kind !== "book" && a.kind !== "calc" && (
        <span className="cover-ic" style={{ color: c1 }}>
          <Icon name={KIND_ICON[a.kind] || "package"} />
        </span>
      )}
      {a.label && a.kind !== "book" && a.kind !== "calc" && <span className="cover-label">{a.label}</span>}
    </div>
  );
}
