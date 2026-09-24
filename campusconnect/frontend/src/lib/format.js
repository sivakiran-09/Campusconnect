// Small formatting + id helpers used across the app.
export const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
export const compact = (n) => (n >= 1e7 ? (n / 1e7).toFixed(1) + " Cr" : n >= 1e5 ? (n / 1e5).toFixed(1) + " L" : n >= 1e3 ? n.toLocaleString("en-IN") : String(n));
export const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const plural = (n, w, pl) => `${n} ${n === 1 ? w : pl || w + "s"}`;
export const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase();

export function hueOf(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}
export const gradFor = (str) => {
  const h = hueOf(str);
  return `linear-gradient(135deg, hsl(${h} 62% 46%), hsl(${(h + 38) % 360} 68% 58%))`;
};

export function distance(m) {
  if (m == null) return "";
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}

const MIN = 60e3;
const HR = 60 * MIN;
const DAY = 24 * HR;
export const now = () => Date.now();
export const ago = (h) => Date.now() - h * HR;
export const inDays = (d) => Date.now() + d * DAY;

export function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < MIN) return "now";
  if (d < HR) return `${Math.floor(d / MIN)}m`;
  if (d < DAY) return `${Math.floor(d / HR)}h`;
  if (d < 7 * DAY) return `${Math.floor(d / DAY)}d`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
export function timeAgoLong(ts) {
  const d = Date.now() - ts;
  if (d < MIN) return "just now";
  if (d < HR) return `${Math.floor(d / MIN)} min ago`;
  if (d < DAY) return `${Math.floor(d / HR)} h ago`;
  if (d < 2 * DAY) return "yesterday";
  if (d < 7 * DAY) return `${Math.floor(d / DAY)} days ago`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
export const clock = (ts) => new Date(ts).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
export function dayLabel(ts) {
  const d = new Date(ts);
  const t = new Date();
  const s = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((s(t) - s(d)) / DAY);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}
export const dueIn = (ts) => {
  const d = ts - Date.now();
  if (d < 0) return { late: true, text: `${Math.ceil(-d / DAY)}d overdue` };
  if (d < DAY) return { late: false, text: `${Math.max(1, Math.ceil(d / HR))}h left` };
  return { late: false, text: `${Math.ceil(d / DAY)} days left` };
};
export const fmtDate = (ts) => new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export const MODE = {
  LEND: { label: "Lend", tone: "", icon: "repeat", cta: "Request lend", hint: "Rent by week/day" },
  SELL: { label: "Sell", tone: "amber", icon: "tag", cta: "Reserve", hint: "Price-capped" },
  DONATE: { label: "Donate", tone: "green", icon: "gift", cta: "Claim free", hint: "Free dorm drop" },
};
export const priceLabel = (r) => (r.mode === "LEND" ? `${inr(r.price)}/wk` : r.mode === "SELL" ? inr(r.price) : "Free");

export function download(name, text, type = "text/csv") {
  try {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
