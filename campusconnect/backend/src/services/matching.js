// Server-side mirror of frontend/src/lib/matching.js — same regex intent parser and scoring,
// so /resources/search and the AI microservice proxy agree with the client's own matcher.
import { trustScore } from "./trust.js";

const NUMWORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, ten: 10, fourteen: 14 };
const STOP = new Set("a an the and or of to in on for with at by from is are was were do does did how what which who need want get find any some more most also just very really like know help borrow rent buy lend book donate free".split(" "));

export function parseQuery(q = "") {
  const t = q.toLowerCase().replace(/\b(one|two|three|four|five|six|seven|ten|fourteen)\b/g, (w) => NUMWORDS[w]);
  const out = { raw: q, days: null, mode: null, maxPrice: null, sem: null, branch: null, terms: [] };
  let m;
  if ((m = t.match(/(\d+)\s*(?:day|days|d)\b/))) out.days = +m[1];
  else if ((m = t.match(/(\d+)\s*(?:week|weeks|wk|wks)\b/))) out.days = +m[1] * 7;
  if (/\b(buy|purchase|for sale)\b/.test(t)) out.mode = "SELL";
  else if (/\b(free|donat\w*|giveaway)\b/.test(t)) out.mode = "DONATE";
  else if (/\b(borrow|rent|lend|loan)\b/.test(t) || out.days) out.mode = "LEND";
  if ((m = t.match(/(?:under|below|less than|within|max|upto|up to|<)\s*(?:₹|rs\.?|inr)?\s*(\d+)/))) out.maxPrice = +m[1];
  if ((m = t.match(/(\d)(?:st|nd|rd|th)?\s*sem/))) out.sem = +m[1];
  if ((m = t.match(/\b(cse|ece|eee|mech|civil|it|chem)\b/))) out.branch = m[1].toUpperCase();
  out.terms = t
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w) && !/^\d+$/.test(w));
  return out;
}

export function matchOne(query, resources, users, limit = 8) {
  const p = parseQuery(query);
  const results = [];
  for (const r of resources) {
    if (r.status && r.status !== "available") continue;
    const hay = `${r.title} ${r.subtitle} ${r.subject} ${r.code} ${(r.tags || []).join(" ")}`.toLowerCase();
    const hits = p.terms.filter((t) => hay.includes(t)).length;
    if (p.terms.length && hits === 0) continue;
    let score = 0.5 * (p.terms.length ? hits / p.terms.length : 0.4);
    if (p.sem && r.sem === p.sem) score += 0.14;
    if (p.branch && r.branch === p.branch) score += 0.08;
    if (p.days && r.mode === "LEND") score += r.maxDays >= p.days ? 0.12 : 0.04;
    if (p.mode && r.mode === p.mode) score += 0.06;
    if (p.maxPrice) score += r.price <= p.maxPrice ? 0.05 : -0.12;
    const owner = users[r.ownerId];
    score += 0.04 * (owner ? trustScore(owner.stats) / 100 : 0.7);
    results.push({ r, pct: Math.max(12, Math.min(99, Math.round(score * 100 + 4))) });
  }
  results.sort((a, b) => b.pct - a.pct);
  return { parsed: p, results: results.slice(0, limit) };
}
