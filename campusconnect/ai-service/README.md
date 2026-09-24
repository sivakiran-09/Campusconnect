# CampusConnect AI microservice

Campus AI's brain: resource matching from natural language, and RAG-style retrieval over
senior knowledge posts with cited, extractive answers (never a free-form hallucination).

Built with **Flask + scikit-learn** because this sandbox has no network access to install
FastAPI/uvicorn. Every route below is 1:1 with what a FastAPI app would expose — swapping
frameworks is mechanical: replace `@app.get/post` with `@app.get/post` (same decorator name),
`request.get_json()` with a Pydantic body model, and `flask run` with `uvicorn app.main:app`.

## Run it
```
pip install -r requirements.txt
python -m app.main
# or: PORT=8000 python -m app.main
```

## Endpoints
- `GET /health`
- `POST /match` — `{ query, resources, users }` → ranked, explainable matches
- `POST /chat` — `{ message, knowledge, resources, users }` → routes to matching or RAG,
  returns `{ text, points?, sources?, cards?, followups? }`

The Node backend proxies to this service (`AI_SERVICE_URL` env var, see `backend/src/services/ai.js`)
and falls back to a small local implementation if this service is unreachable, so the whole
stack degrades gracefully instead of hard-failing.

## Verified working
`/health`, `/chat` for both a knowledge question (TCS Digital interview → cited answer from
2 posts) and a resource question ("DBMS book for 10 days" → matched listing with 42% score),
and the full Node → Python proxy path end to end.
