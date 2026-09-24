# CampusConnect — complete full-stack build

Frontend (React, fully designed & wired) + Backend (Node, zero-dep REST/SSE) + AI microservice
(Flask + scikit-learn RAG), all tested working together end-to-end.

## Run everything
```
# Terminal 1 — AI microservice
cd ai-service && pip install -r requirements.txt && python -m app.main

# Terminal 2 — backend
cd backend && AI_SERVICE_URL=http://localhost:8000 node src/server.js

# Terminal 3 — frontend
cd frontend && npm install
echo "VITE_API_URL=http://localhost:4000" > .env
npm run dev
```
Or just run the frontend alone with no `.env` file — it works fully in **Demo Mode** (all
data local, no backend needed): `cd frontend && npm install && npm run dev`.

## Frontend — every screen built and wired
Onboarding, Hub, Resources (browse/exchanges/wishlist), Item Detail, Create Listing (real
image pipeline), Handoff (QR generation + scan + AI condition check), Scanner, Skills
(swap + knowledge hub + sessions), Messages + Chat (incl. Campus AI thread), Profile,
Post Detail/compose, Impact dashboard, Settings/Trust/Wallet. See git history / earlier
notes for the full screen-by-screen breakdown.

## Backend — real REST API + SSE, tested end to end via curl
- Auth: college-email OTP → signed session tokens
- Full transaction lifecycle with **server-side** Trust Score recalculation (never trusted
  from the client): REQUESTED → ACCEPTED → ACTIVE → RETURN_PENDING → RETURNED
- Resources (CRUD, like/save/comment, NL search), Wishlist, Knowledge, Skills+Sessions,
  image upload (real multipart parsing, no library), AI chat proxy
- Zero npm dependencies (no network access in this sandbox to install Express/Mongo) —
  same route shapes throughout, so migrating to Express + MongoDB is mechanical (see
  `backend/README.md`)

## AI microservice — real RAG, not a mock
- TF-IDF + cosine similarity (scikit-learn) over knowledge posts → cited, extractive answers
- Regex-based NL intent parsing for resource queries ("DBMS book for 10 days")
- Flask instead of FastAPI only because this sandbox has no network access to install it —
  route-for-route identical, see `ai-service/README.md` for the swap

## What was actually tested (not just written)
- Started all three services for real and hit them with curl/requests in this conversation
- Full borrow-to-return lifecycle across two real user tokens (Rahul ↔ Priya), confirming
  Trust Score changes from 94 as returns complete
- Node → Python AI proxy confirmed live (not the fallback) via server logs
- Found and fixed 4 real bugs during testing (a React conditional-hook crash, a stuck
  "Continue" button in Create Listing, a demo dead-end waiting for a QR, and a route-order
  bug that made image uploads 404)
