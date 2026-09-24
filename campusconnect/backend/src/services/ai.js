// Routes a question to the Python RAG microservice (ai-service/). If it's unreachable
// (e.g. not started, or AI_SERVICE_URL unset) this falls back to a small local implementation
// so the Node backend never hard-fails just because the Python side is down — it degrades.
import { matchOne } from "./matching.js";

const AI_URL = (process.env.AI_SERVICE_URL || "").replace(/\/$/, "");
const ITEM_RE = /\b(book|textbook|calculator|guitar|cycle|bike|kit|coat|notes|drafter|arduino|raspberry|pi)\b/;
const NEED_RE = /\b(need|borrow|rent|buy|looking for|find|lend|want|available)\b/;

export async function askCampusAi(text, db) {
  if (AI_URL) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${AI_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          knowledge: db.knowledge.map((k) => ({ id: k.id, title: k.title, body: k.body, tags: k.tags })),
          resources: db.resources.filter((r) => !r.status || r.status === "available").map((r) => ({ id: r.id, title: r.title, subtitle: r.subtitle, subject: r.subject, category: r.category, mode: r.mode, price: r.price, maxDays: r.maxDays, sem: r.sem, branch: r.branch, ownerId: r.ownerId })),
        }),
      });
      clearTimeout(t);
      if (res.ok) return await res.json();
    } catch {
      // fall through to the local fallback below
    }
  }
  return localFallback(text, db);
}

function localFallback(text, db) {
  const q = text.trim();
  const ql = q.toLowerCase();
  if (ITEM_RE.test(ql) && NEED_RE.test(ql)) {
    const { results, parsed } = matchOne(q, db.resources, db.users, 3);
    if (results.length) {
      const dur = parsed.days ? ` for ${parsed.days} days` : "";
      return { text: `I found ${results.length} match${results.length > 1 ? "es" : ""} on campus${dur}.`, cards: results.map((x) => ({ id: x.r.id, pct: x.pct })), followups: ["Add this to my wishlist"] };
    }
    return { text: "Nothing matches that right now. Add it to your wishlist and I'll alert you.", followups: ["Add this to my wishlist"] };
  }
  const terms = ql.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2);
  const hits = db.knowledge
    .map((p) => ({ p, score: terms.filter((t) => (p.title + " " + p.body + " " + p.tags.join(" ")).toLowerCase().includes(t)).length }))
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  if (hits.length) {
    return {
      text: `Based on ${hits.length} campus experience${hits.length > 1 ? "s" : ""}, here's what stands out:`,
      points: hits.map((h) => ({ text: h.p.body.split("\n\n")[0].slice(0, 220), postId: h.p.id })),
      sources: hits.map((h) => h.p.id),
      followups: ["Find a mentor for this"],
    };
  }
  return { text: "I couldn't find that in the campus knowledge base yet. Ask a senior directly, or share what you learn once you know.", followups: ["How does the Trust Score work?"] };
}
