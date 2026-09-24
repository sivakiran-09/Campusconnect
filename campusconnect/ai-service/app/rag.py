"""TF-IDF + cosine-similarity retrieval over knowledge posts — the Python-side twin of
frontend/src/lib/retrieval.js, using scikit-learn instead of a hand-rolled vectorizer.
Returns cited, extractive answers (never a free-form hallucinated one)."""
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

FAQS = [
    {"id": "faq_trust", "q": "How does the Campus Trust Score work?",
     "a": "Your Trust Score out of 100 combines six signals: successful transactions (30 pts), "
          "on-time returns (25), item condition on return (20), peer ratings (15), verified "
          "college email (5) and cancellation history (5)."},
    {"id": "faq_qr", "q": "How does the QR handover work?",
     "a": "The owner generates a handover QR at a Safe Zone. The borrower scans it and the "
          "exchange turns ACTIVE. If the camera fails, a 6-digit backup PIN works instead."},
    {"id": "faq_credits", "q": "How do Campus Credits work?",
     "a": "Teaching a skill for one hour earns +10 credits; learning for one hour costs 10 "
          "credits, so peers can swap skills without money changing hands."},
]

def _sentences(text):
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 24]

class KnowledgeIndex:
    """Fit once per request batch (cheap at this dataset size); chunks posts into paragraphs."""

    def __init__(self, posts):
        self.docs = []
        for p in posts:
            for chunk in re.split(r"\n{2,}", p.get("body", "")):
                chunk = chunk.strip()
                if chunk:
                    self.docs.append({"post": p, "text": f"{p['title']} {p['title']} " + chunk, "raw": chunk})
        for f in FAQS:
            self.docs.append({"faq": f, "text": f["q"] + " " + f["a"], "raw": f["a"]})
        texts = [d["text"] for d in self.docs] or [""]
        self.vec = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        self.matrix = self.vec.fit_transform(texts)

    def search(self, query, k=6):
        if not self.docs:
            return []
        qv = self.vec.transform([query])
        sims = cosine_similarity(qv, self.matrix)[0]
        order = sims.argsort()[::-1][:k]
        return [(self.docs[i], float(sims[i])) for i in order if sims[i] > 0.05]

def best_sentences(text, query, n=2):
    q_terms = set(re.findall(r"[a-z0-9]+", query.lower()))
    scored = []
    for i, s in enumerate(_sentences(text)):
        terms = set(re.findall(r"[a-z0-9]+", s.lower()))
        scored.append((i, s, len(terms & q_terms) / (len(s) ** 0.5)))
    top = sorted(scored, key=lambda x: -x[2])[:n]
    return [s for _, s, _ in sorted(top, key=lambda x: x[0])]

def answer_from_knowledge(index, question):
    hits = index.search(question, k=8)
    if not hits:
        return None
    top_faq = next((d for d, _ in hits if "faq" in d), None)
    if top_faq and hits[0][0] is top_faq:
        return {"kind": "faq", "text": top_faq["faq"]["a"]}
    by_post = {}
    for d, score in hits:
        if "post" in d:
            by_post.setdefault(d["post"]["id"], {"post": d["post"], "chunks": [], "score": score})
            by_post[d["post"]["id"]]["chunks"].append(d["raw"])
    top = sorted(by_post.values(), key=lambda x: -x["score"])[:3]
    points = []
    for t in top:
        sents = best_sentences(" ".join(t["chunks"]), question, 2)
        if sents:
            points.append({"text": " ".join(sents), "postId": t["post"]["id"]})
    if not points:
        return None
    return {"kind": "knowledge", "points": points, "sources": [t["post"]["id"] for t in top]}
