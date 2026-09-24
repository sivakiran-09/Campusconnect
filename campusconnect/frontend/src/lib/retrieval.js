// Campus knowledge retrieval (the in-browser twin of ai-service/app/rag.py).
// Pipeline: documents -> chunking -> tokenising (+aliases, light stemming) -> TF-IDF vectors
//           -> cosine search -> extractive, cited answer.
// In API mode the same question goes to the FastAPI RAG service; this keeps Demo Mode fully offline.

const STOP = new Set(
  "a an the and or of to in on for with at by from is are was were be been i me my we our you your it its this that these those do does did how what which who when where why can could should would will about into as if so than then there their them they he she his her not no yes tell give please need want get find any some more most also just very really like know help share shared".split(" ")
);
const ALIAS = {
  os: "operating systems",
  dbms: "database management systems sql",
  sql: "database sql",
  dsa: "data structures algorithms",
  ds: "data structures",
  ml: "machine learning",
  ai: "artificial intelligence",
  cn: "computer networks",
  oops: "object oriented programming",
  maths: "mathematics",
  math: "mathematics",
  sde: "software engineer",
  oa: "online assessment",
  sih: "smart india hackathon",
  hr: "hr interview",
  cv: "resume",
  aws: "aws cloud",
  dl: "digital logic",
  intern: "internship",
  interviews: "interview",
};

export const stem = (w) => {
  if (w.length > 5 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 4 && w.endsWith("es")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
};

export function tokenize(text = "", { expand = true } = {}) {
  const out = [];
  for (const raw of text.toLowerCase().replace(/[^a-z0-9+#.\s]/g, " ").split(/\s+/)) {
    const w = raw.replace(/^\.+|\.+$/g, "");
    if (!w || STOP.has(w)) continue;
    out.push(stem(w));
    if (expand && ALIAS[w]) for (const a of ALIAS[w].split(" ")) out.push(stem(a));
  }
  return out;
}

/** Split a post into retrievable passages (paragraphs, merged to ~320 chars). */
export function chunk(text, size = 320) {
  const parts = text.split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
  const chunks = [];
  let cur = "";
  for (const p of parts) {
    if ((cur + " " + p).length > size && cur) {
      chunks.push(cur);
      cur = p;
    } else cur = cur ? cur + " " + p : p;
  }
  if (cur) chunks.push(cur);
  return chunks;
}

export function buildIndex(docs) {
  // docs: [{ id, docId, title, text, meta }]
  const df = new Map();
  const items = docs.map((d) => {
    const toks = [...tokenize(d.title), ...tokenize(d.title), ...tokenize(d.title), ...tokenize(d.text)]; // title x3 boost
    const tf = new Map();
    toks.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
    tf.forEach((_, t) => df.set(t, (df.get(t) || 0) + 1));
    return { d, tf };
  });
  const N = items.length || 1;
  const idf = (t) => Math.log(1 + N / (1 + (df.get(t) || 0)));
  items.forEach((it) => {
    let norm = 0;
    it.vec = new Map();
    it.tf.forEach((c, t) => {
      const w = (1 + Math.log(c)) * idf(t);
      it.vec.set(t, w);
      norm += w * w;
    });
    it.norm = Math.sqrt(norm) || 1;
  });
  return { items, idf };
}

export function search(index, query, k = 6, filter) {
  const qt = tokenize(query);
  if (!qt.length) return [];
  const qtf = new Map();
  qt.forEach((t) => qtf.set(t, (qtf.get(t) || 0) + 1));
  const qv = new Map();
  let qn = 0;
  qtf.forEach((c, t) => {
    const w = (1 + Math.log(c)) * index.idf(t);
    qv.set(t, w);
    qn += w * w;
  });
  qn = Math.sqrt(qn) || 1;
  const hits = [];
  for (const it of index.items) {
    if (filter && !filter(it.d)) continue;
    let dot = 0;
    qv.forEach((w, t) => {
      const dv = it.vec.get(t);
      if (dv) dot += w * dv;
    });
    if (dot > 0) hits.push({ doc: it.d, score: dot / (qn * it.norm) });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, k);
}

const sentences = (t) => t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 24);

/** Pick the sentences from a passage that best overlap the question. */
export function bestSentences(text, query, n = 2) {
  const q = new Set(tokenize(query));
  return sentences(text)
    .map((s, i) => ({ s, i, score: tokenize(s).filter((t) => q.has(t)).length / Math.sqrt(s.length) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.s);
}

export function buildKnowledgeIndex(posts, faqs = []) {
  const docs = [];
  posts.forEach((p) => chunk(p.body).forEach((c, i) => docs.push({ id: `${p.id}#${i}`, docId: p.id, kind: "post", title: p.title, text: c + " " + (p.tags || []).join(" "), raw: c, post: p })));
  faqs.forEach((f) => docs.push({ id: f.id, docId: f.id, kind: "faq", title: f.q, text: f.a, raw: f.a, faq: f }));
  return buildIndex(docs);
}

export const FAQS = [
  { id: "faq_trust", q: "How does the Campus Trust Score work?", a: "Your Trust Score out of 100 combines six signals: successful transactions (30 points), on-time returns (25), item condition on return (20), peer ratings (15), verified college email (5) and cancellation history (5). It updates automatically after every completed exchange." },
  { id: "faq_qr", q: "How does the QR handover work?", a: "The owner generates a handover QR at a designated Safe Zone. The borrower scans it and the exchange turns ACTIVE. If the camera fails, enter the 6 digit backup PIN. On return, the QR is scanned again and the exchange closes as RETURNED." },
  { id: "faq_credits", q: "How do Campus Credits work?", a: "Teaching a skill for one hour earns +10 credits and learning for one hour costs 10 credits, so peers can exchange skills without money. Credits are held while a session is booked and released when it completes." },
  { id: "faq_damage", q: "What happens if an item comes back damaged?", a: "On return you upload a photo. Campus AI compares it with the before-borrow condition record. Minor differences are flagged for the owner to review, and condition history feeds both people's Trust Scores." },
  { id: "faq_wishlist", q: "How do wishlist alerts work?", a: "Add an item to your wishlist with a maximum price. When a student lists a matching resource you get an instant alert with the price and distance." },
];

/** Compose an extractive, cited answer from the top passages. */
export function answerFromKnowledge(index, question) {
  const hits = search(index, question, 8);
  if (!hits.length || hits[0].score < 0.08) return null;
  const byDoc = new Map();
  hits.forEach((h) => {
    if (!byDoc.has(h.doc.docId)) byDoc.set(h.doc.docId, { ...h, chunks: [h.doc.raw] });
    else byDoc.get(h.doc.docId).chunks.push(h.doc.raw);
  });
  const top = [...byDoc.values()].slice(0, 3);
  const faq = top.find((t) => t.doc.kind === "faq");
  if (faq && top[0].doc.kind === "faq") return { kind: "faq", text: faq.doc.faq.a, sources: [] };
  const posts = top.filter((t) => t.doc.kind === "post");
  const points = posts.map((t) => ({ text: bestSentences(t.chunks.join(" "), question, 2).join(" "), post: t.doc.post, score: t.score })).filter((p) => p.text);
  return { kind: "knowledge", points, sources: posts.map((t) => t.doc.post) };
}
