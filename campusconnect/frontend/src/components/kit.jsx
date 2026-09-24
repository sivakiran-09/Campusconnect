import { useEffect, useState } from "react";
import { Icon } from "../lib/icons.jsx";
import { gradFor, initials } from "../lib/format.js";
import { useNav } from "../lib/nav.jsx";
import { tierOf } from "../lib/trust.js";

export function Avatar({ u, name, hue, size = "", online, tick, className = "", style }) {
  const n = u?.name || name || "?";
  const h = u?.hue ?? hue;
  return (
    <span className={`avatar ${size} ${className}`} style={{ background: h != null ? `linear-gradient(135deg, hsl(${h} 62% 44%), hsl(${(h + 40) % 360} 70% 58%))` : gradFor(n), ...style }} aria-label={n}>
      {initials(n)}
      {online && <i className="online" />}
      {tick && (
        <i className="tick">
          <Icon name="check" />
        </i>
      )}
    </span>
  );
}

export function StoryAvatar({ u, size = "lg", seen, onClick, label, add }) {
  return (
    <button className="story-item" onClick={onClick} aria-label={`${label} story`}>
      <span className={`ring ${seen ? "seen" : ""}`}>
        <span className="inner">
          {add ? (
            <span className="avatar lg add" style={{ background: "var(--surface-2)", color: "var(--primary-text)" }}>
              <Icon name="plus" size={26} />
            </span>
          ) : (
            <Avatar u={u} size={size} />
          )}
        </span>
      </span>
      <span className="story-label truncate">{label}</span>
    </button>
  );
}

export function TrustRing({ score, size = 180, stroke = 14, label = true, sub, animate = true }) {
  const [v, setV] = useState(animate ? 0 : score);
  useEffect(() => {
    if (!animate) return setV(score);
    const t = setTimeout(() => setV(score), 80);
    return () => clearTimeout(t);
  }, [score, animate]);
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const tier = tierOf(score);
  const good = score >= 85;
  const id = `tg${size}${stroke}`;
  return (
    <div className="trust-ring" style={{ width: size, height: size }} role="img" aria-label={`Campus Trust Score ${score} out of 100`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={good ? "#0fa56b" : "#5a4cf0"} />
            <stop offset="1" stopColor={good ? "#f2a93b" : "#f2a93b"} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - v / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(.22,.8,.24,1)" }} />
      </svg>
      <div className="tr-center">
        {label && <span className="tr-cap">Campus Trust Score</span>}
        <span className="tr-num num" style={{ fontSize: size * 0.25 }}>
          {score}
          <small>/100</small>
        </span>
        {sub !== false && <span className={`badge ${tier.tone}`}>{sub || tier.name}</span>}
      </div>
    </div>
  );
}

export function Stars({ value = 0, size = 14, onChange }) {
  return (
    <span className="stars" role={onChange ? "radiogroup" : "img"} aria-label={`${value.toFixed?.(1) ?? value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const on = value >= i - 0.25;
        const El = onChange ? "button" : "span";
        return (
          <El key={i} onClick={onChange ? () => onChange(i) : undefined} aria-label={onChange ? `${i} stars` : undefined} className={on ? "on" : ""}>
            <Icon name="star" size={size} style={{ fill: on ? "var(--gold)" : "none", color: on ? "var(--gold)" : "var(--ink-3)" }} />
          </El>
        );
      })}
    </span>
  );
}

export function Empty({ icon = "search", title, body, action }) {
  return (
    <div className="empty">
      <span className="ic"><Icon name={icon} /></span>
      <h3>{title}</h3>
      {body && <p className="small">{body}</p>}
      {action}
    </div>
  );
}

export function BackBar({ title, right, onBack, line = true, sub }) {
  const nav = useNav();
  return (
    <header className={`appbar ${line ? "line" : ""}`}>
      <button className="icon-btn" onClick={onBack || nav.pop} aria-label="Back"><Icon name="back" /></button>
      <div className="grow">
        <div className="title truncate">{title}</div>
        {sub && <div className="tiny muted truncate">{sub}</div>}
      </div>
      {right}
    </header>
  );
}

export function Seg({ value, onChange, items, style }) {
  return (
    <div className="seg" role="tablist" style={style}>
      {items.map((it) => (
        <button key={it.id} role="tab" aria-selected={value === it.id} onClick={() => onChange(it.id)}>
          {it.icon && <Icon name={it.icon} size={16} />}
          {it.label}
          {it.count ? <span className="cnt">{it.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export const Switch = ({ on, onChange, label }) => <button className="switch" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />;

export function SectionHead({ title, more, onMore, sub }) {
  return (
    <div className="section-h">
      <div>
        <h2>{title}</h2>
        {sub && <div className="small muted">{sub}</div>}
      </div>
      {more && (
        <button className="more" onClick={onMore}>
          {more}
          <Icon name="next" />
        </button>
      )}
    </div>
  );
}

export const Verified = () => (
  <span className="badge green" title="Verified with college email">
    <Icon name="shield" />
    Campus verified
  </span>
);
