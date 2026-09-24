"""Natural-language resource matching — Python twin of frontend/src/lib/matching.js and the
Node backend's services/matching.js, so all three layers agree on "DBMS book for 10 days"."""
import re

NUMWORDS = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "ten": 10, "fourteen": 14}
STOP = {"a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "with", "at", "by", "from",
        "is", "are", "need", "want", "get", "find", "any", "borrow", "rent", "buy", "lend", "book", "donate", "free"}

def parse_query(q: str):
    t = q.lower()
    for w, n in NUMWORDS.items():
        t = re.sub(rf"\b{w}\b", str(n), t)
    out = {"raw": q, "days": None, "mode": None, "maxPrice": None, "sem": None, "branch": None, "terms": []}
    if m := re.search(r"(\d+)\s*(?:day|days|d)\b", t):
        out["days"] = int(m.group(1))
    elif m := re.search(r"(\d+)\s*(?:week|weeks|wk|wks)\b", t):
        out["days"] = int(m.group(1)) * 7
    if re.search(r"\b(buy|purchase|for sale)\b", t):
        out["mode"] = "SELL"
    elif re.search(r"\b(free|donat\w*|giveaway)\b", t):
        out["mode"] = "DONATE"
    elif re.search(r"\b(borrow|rent|lend|loan)\b", t) or out["days"]:
        out["mode"] = "LEND"
    if m := re.search(r"(?:under|below|less than|within|max|upto|up to|<)\s*(?:₹|rs\.?|inr)?\s*(\d+)", t):
        out["maxPrice"] = int(m.group(1))
    if m := re.search(r"(\d)(?:st|nd|rd|th)?\s*sem", t):
        out["sem"] = int(m.group(1))
    if m := re.search(r"\b(cse|ece|eee|mech|civil|it|chem)\b", t):
        out["branch"] = m.group(1).upper()
    out["terms"] = [w for w in re.sub(r"[^a-z0-9\s]", " ", t).split() if w and w not in STOP and not w.isdigit()]
    return out

def match_resources(query, resources, users, limit=8):
    p = parse_query(query)
    results = []
    for r in resources:
        if r.get("status") not in (None, "available"):
            continue
        hay = f"{r.get('title','')} {r.get('subtitle','')} {r.get('subject','')} {' '.join(r.get('tags', []))}".lower()
        hits = sum(1 for term in p["terms"] if term in hay)
        if p["terms"] and hits == 0:
            continue
        score = 0.5 * (hits / len(p["terms"]) if p["terms"] else 0.4)
        if p["sem"] and r.get("sem") == p["sem"]:
            score += 0.14
        if p["branch"] and r.get("branch") == p["branch"]:
            score += 0.08
        if p["days"] and r.get("mode") == "LEND":
            score += 0.12 if (r.get("maxDays") or 14) >= p["days"] else 0.04
        if p["mode"] and r.get("mode") == p["mode"]:
            score += 0.06
        if p["maxPrice"]:
            score += 0.05 if (r.get("price") or 0) <= p["maxPrice"] else -0.12
        owner = users.get(r.get("ownerId"), {})
        score += 0.04 * (owner.get("trust", 70) / 100)
        pct = max(12, min(99, round(score * 100 + 4)))
        results.append({"r": r, "pct": pct, "score": score})
    results.sort(key=lambda x: -x["score"])
    return {"parsed": p, "results": results[:limit]}
