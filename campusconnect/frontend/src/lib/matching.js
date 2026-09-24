// Smart resource matching (twin of ai-service/app/matching.py).
// "I need a DBMS book for 10 days" -> structured intent -> ranked, explainable matches.
import { buildIndex, search, tokenize } from "./retrieval.js";
import { distance } from "./format.js";
import { trustOf } from "./trust.js";

const NUMWORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, ten: 10, fourteen: 14 };
const UNITS = new Set(["day", "days", "week", "weeks", "wk", "wks", "month", "months", "sem", "semester", "year", "under", "below", "max", "rs", "inr", "weekend", "weekly", "fortnight", "free", "temporary", "temporar", "short", "term", "one", "two", "three", "four", "five", "six", "seven", "ten", "fourteen", "first", "second", "third", "fourth", "less", "than", "upto", "within"]);

export function parseQuery(q = "") {
  const t = q.toLowerCase().replace(/(\d)\s*[-–]\s*(\d)/g, "$1 $2");
  const text = t.replace(/\b(one|two|three|four|five|six|seven|ten|fourteen)\b/g, (w) => NUMWORDS[w]);
  const out = { raw: q, days: null, mode: null, maxPrice: null, sem: null, branch: null, terms: [] };
  let m;
  if ((m = text.match(/(\d+)\s*(?:day|days|d)\b/))) out.days = +m[1];
  else if ((m = text.match(/(\d+)\s*(?:week|weeks|wk|wks)\b/))) out.days = +m[1] * 7;
  else if ((m = text.match(/(\d+)\s*months?\b/))) out.days = +m[1] * 30;
  else if (/\b(a|1) ?week\b|\bweekly\b/.test(text)) out.days = 7;
  else if (/weekend/.test(text)) out.days = 3;
  else if (/fortnight/.test(text)) out.days = 14;
  if (/\b(buy|purchase|own|for sale)\b/.test(text)) out.mode = "SELL";
  else if (/\b(free|donat\w*|giveaway|pass ?down)\b/.test(text)) out.mode = "DONATE";
  else if (/\b(borrow|rent|lend|loan|temporar\w*|short ?term)\b/.test(text) || out.days) out.mode = "LEND";
  if ((m = text.match(/(?:under|below|less than|within|max|upto|up to|<)\s*(?:₹|rs\.?|inr)?\s*(\d+)/))) out.maxPrice = +m[1];
  else if ((m = text.match(/(?:₹|rs\.?)\s*(\d+)/))) out.maxPrice = +m[1];
  if ((m = text.match(/(\d)(?:st|nd|rd|th)?\s*sem/))) out.sem = +m[1];
  else if ((m = text.match(/(\d)(?:st|nd|rd|th)?\s*year/))) out.sem = +m[1] * 2 - 1;
  if ((m = text.match(/\b(cse|ece|eee|mech|civil|it|aids|chem)\b/))) out.branch = m[1].toUpperCase();
  out.terms = tokenize(t).filter((w) => !UNITS.has(w) && !/^\d+(st|nd|rd|th)?$/.test(w) && !["cse", "ece", "eee", "mech", "civil", "borrow", "rent", "buy", "lend", "book", "purchase", "loan", "donat", "giveaway"].includes(w));
  if (/\bbook\b/.test(text)) out.terms.push("textbook");
  return out;
}

export function buildResourceIndex(resources) {
  return buildIndex(
    resources.map((r) => ({
      id: r.id,
      title: r.title,
      text: [r.subtitle, r.subject, r.code, r.category, r.desc, (r.tags || []).join(" "), r.category === "books" ? "book textbook" : ""].join(" "),
      r,
    }))
  );
}

export function matchResources(query, resources, users, { limit = 8 } = {}) {
  const p = parseQuery(query);
  const index = buildResourceIndex(resources);
  const hits = search(index, p.terms.join(" ") || query, 30);
  const rel = new Map(hits.map((h) => [h.doc.id, h.score]));
  const maxRel = hits[0]?.score || 1;
  const results = [];
  for (const r of resources) {
    if (r.status && r.status !== "available") continue;
    const relScore = (rel.get(r.id) || 0) / maxRel;
    if (p.terms.length && relScore < 0.12) continue;
    let s = 0.5 * relScore;
    const reasons = [];
    if (relScore > 0.35) reasons.push({ k: "subject", t: `Subject: ${r.subject || r.title.split(" ")[0]}` });
    if (p.sem && r.sem) {
      if (r.sem === p.sem) {
        s += 0.14;
        reasons.push({ k: "sem", t: `Semester ${r.sem}` });
      } else if (Math.abs(r.sem - p.sem) <= 1) s += 0.05;
    } else if (r.sem) reasons.push({ k: "sem", t: `Sem ${r.sem}${r.branch ? " · " + r.branch : ""}`, weak: true });
    if (p.branch && r.branch === p.branch) {
      s += 0.08;
      reasons.push({ k: "branch", t: p.branch });
    }
    if (p.days && r.mode === "LEND") {
      const fit = r.maxDays >= p.days ? 1 : r.maxDays / p.days;
      s += 0.12 * fit;
      reasons.push({ k: "days", t: r.maxDays >= p.days ? `Free for ${r.maxDays} days` : `Only ${r.maxDays} days`, bad: r.maxDays < p.days });
    }
    if (r.distanceM != null) {
      s += 0.1 * Math.max(0, 1 - r.distanceM / 3000);
      reasons.push({ k: "dist", t: `${distance(r.distanceM)} away` });
    }
    if (p.mode && r.mode === p.mode) s += 0.06;
    if (p.maxPrice) {
      if (r.price <= p.maxPrice) s += 0.05;
      else s -= 0.12;
    }
    const owner = users[r.ownerId];
    const trust = owner ? trustOf(owner) : 70;
    s += 0.04 * (trust / 100);
    if (trust >= 90) reasons.push({ k: "trust", t: `Owner trust ${trust}` });
    const pct = Math.max(12, Math.min(99, Math.round(s * 100 + 4)));
    results.push({ r, pct, reasons: reasons.filter((x) => !x.weak || reasons.length < 3), score: s });
  }
  return { parsed: p, results: results.sort((a, b) => b.score - a.score).slice(0, limit) };
}

export function describeIntent(p) {
  const chips = [];
  if (p.terms.length) chips.push({ k: "Looking for", v: p.terms.filter((t) => t !== "textbook").slice(0, 3).join(" ") || "resources" });
  if (p.mode) chips.push({ k: "Mode", v: p.mode === "LEND" ? "Borrow" : p.mode === "SELL" ? "Buy" : "Free" });
  if (p.days) chips.push({ k: "For", v: `${p.days} days` });
  if (p.sem) chips.push({ k: "Semester", v: String(p.sem) });
  if (p.branch) chips.push({ k: "Branch", v: p.branch });
  if (p.maxPrice) chips.push({ k: "Budget", v: `≤ ₹${p.maxPrice}` });
  return chips;
}
