// Campus AI: routes a question to (a) resource matching, (b) the RAG knowledge base, or (c) app help.
// Everything it says is grounded in campus data and cited. It never invents an answer.
import { answerFromKnowledge } from "./retrieval.js";
import { matchResources } from "./matching.js";

const ITEM_WORDS = "book|textbook|calculator|guitar|cycle|bike|kit|coat|goggles|drafter|arduino|raspberry|pi|notes|laptop|headphones|instrument";
const ITEM_RE = new RegExp(`\\b(${ITEM_WORDS})\\b`);
const NEED_RE = /\b(need|borrow|rent|buy|looking for|find|any|lend|want|available)\b/;

export const SUGGESTIONS = [
  "How should I prepare for the TCS Digital interview?",
  "I need a DBMS book for 10 days",
  "How do I get an internship through cold emails?",
  "How does the Trust Score work?",
  "Tips for a hackathon pitch",
];

export function askCampusAi(question, { resources, users, knowledgeIndex, meId }) {
  const q = question.trim();
  const ql = q.toLowerCase();
  if (/^(hi|hello|hey|yo|hola)\b/.test(ql) && ql.length < 20)
    return { text: "Hi! I'm Campus AI. I know what your seniors shared about interviews, internships, hackathons and notes, and I can find resources on campus. What do you need?", followups: SUGGESTIONS.slice(0, 3) };

  if (ITEM_RE.test(ql) && NEED_RE.test(ql)) {
    const pool = resources.filter((r) => r.ownerId !== meId);
    const { results, parsed } = matchResources(q, pool, users, { limit: 3 });
    if (results.length) {
      const dur = parsed.days ? ` for ${parsed.days} days` : "";
      return {
        text: `I found ${results.length} match${results.length > 1 ? "es" : ""} on campus${dur}. The top one is ${results[0].pct}% relevant to what you asked.`,
        cards: results.map((x) => ({ id: x.r.id, pct: x.pct })),
        followups: ["Add this to my wishlist", "Show only free items"],
      };
    }
    return { text: "Nothing matches that right now. Add it to your wishlist and I'll alert you the moment someone lists it.", followups: ["Add this to my wishlist"], wishlist: q };
  }

  const k = answerFromKnowledge(knowledgeIndex, q);
  if (k?.kind === "faq") return { text: k.text, followups: ["How do Campus Credits work?", "How does the QR handover work?"] };
  if (k?.kind === "knowledge" && k.points.length) {
    const n = k.sources.length;
    return {
      text: `Based on ${n} campus experience${n > 1 ? "s" : ""}, here's what stands out:`,
      points: k.points.map((p) => ({ text: p.text, postId: p.post.id })),
      sources: k.sources.map((s) => s.id),
      followups: ["Find a mentor for this", "Show related notes"],
    };
  }
  return {
    text: "I couldn't find that in the campus knowledge base yet. You could ask seniors directly, or share what you learn once you know. Every experience you post makes me smarter for the next batch.",
    followups: SUGGESTIONS.slice(0, 3),
  };
}
