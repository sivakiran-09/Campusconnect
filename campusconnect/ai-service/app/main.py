"""CampusConnect AI microservice — Campus AI's brain.

The Node backend (backend/) proxies POST /ai/chat to this service (see
backend/src/services/ai.js), sending the campus's current resources + knowledge posts on
every call so this stays stateless and always answers from live data, never a stale index.

Built with Flask + scikit-learn because this sandbox has no network access to install
FastAPI/uvicorn; the route shapes below are 1:1 with what a FastAPI app would expose, so
swapping the framework later is purely mechanical (see README.md).
"""
import re
from flask import Flask, request, jsonify
from app.rag import KnowledgeIndex, answer_from_knowledge
from app.matching import match_resources

app = Flask(__name__)

ITEM_RE = re.compile(r"\b(book|textbook|calculator|guitar|cycle|bike|kit|coat|notes|drafter|arduino|raspberry|pi)\b")
NEED_RE = re.compile(r"\b(need|borrow|rent|buy|looking for|find|lend|want|available)\b")


@app.get("/health")
def health():
    return jsonify({"ok": True, "service": "campusconnect-ai"})


@app.post("/match")
def match():
    """Standalone resource-matching endpoint (also usable directly from the frontend or backend)."""
    body = request.get_json(force=True) or {}
    query = body.get("query", "")
    resources = body.get("resources", [])
    users = {u["id"]: u for u in body.get("users", [])} if isinstance(body.get("users"), list) else body.get("users", {})
    return jsonify(match_resources(query, resources, users, limit=int(body.get("limit", 8))))


@app.post("/chat")
def chat():
    """Campus AI's main entrypoint: routes a question to resource matching or knowledge RAG."""
    body = request.get_json(force=True) or {}
    message = (body.get("message") or "").strip()
    ql = message.lower()
    resources = body.get("resources", [])
    knowledge = body.get("knowledge", [])
    users = {u["id"]: u for u in body.get("users", [])} if isinstance(body.get("users"), list) else {}

    if not message:
        return jsonify({"text": "Ask me to find a resource, or ask about interviews, internships and notes from seniors."})

    if ITEM_RE.search(ql) and NEED_RE.search(ql):
        m = match_resources(message, resources, users, limit=3)
        if m["results"]:
            dur = f" for {m['parsed']['days']} days" if m["parsed"]["days"] else ""
            return jsonify({
                "text": f"I found {len(m['results'])} match{'es' if len(m['results']) > 1 else ''} on campus{dur}.",
                "cards": [{"id": x["r"]["id"], "pct": x["pct"]} for x in m["results"]],
                "followups": ["Add this to my wishlist"],
            })
        return jsonify({"text": "Nothing matches that on campus right now. Add it to your wishlist and I'll alert you.", "followups": ["Add this to my wishlist"]})

    index = KnowledgeIndex(knowledge)
    ans = answer_from_knowledge(index, message)
    if ans and ans["kind"] == "faq":
        return jsonify({"text": ans["text"], "followups": ["How do Campus Credits work?"]})
    if ans and ans["kind"] == "knowledge":
        n = len(ans["sources"])
        return jsonify({
            "text": f"Based on {n} campus experience{'s' if n > 1 else ''}, here's what stands out:",
            "points": ans["points"],
            "sources": ans["sources"],
            "followups": ["Find a mentor for this"],
        })
    return jsonify({"text": "I couldn't find that in the campus knowledge base yet. Ask a senior directly, or share what you learn once you know.", "followups": ["How does the Trust Score work?"]})


if __name__ == "__main__":
    import os
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
