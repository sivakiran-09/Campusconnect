# CampusConnect backend

Zero-dependency Node HTTP server implementing the exact REST + SSE contract that
`frontend/src/lib/api.js` speaks. No `npm install` needed — it only uses Node's built-in
`http`, `crypto`, and `fs` modules.

## Run it
```
node src/server.js
# or: PORT=4000 CORS_ORIGIN=http://localhost:5173 AI_SERVICE_URL=http://localhost:8000 node src/server.js
```
Then point the frontend at it: set `VITE_API_URL=http://localhost:4000` in `frontend/.env`.

## Why no Express/MongoDB here
This sandbox has no network access, so `npm install express mongoose` isn't possible. Every
route is written with the same handler shape Express uses — `(req, res, ctx) => {}` — so
migrating is mechanical:
1. `npm install express mongoose`
2. Replace `src/router.js`'s route registration with `app.get/post/...`
3. Replace `src/db.js`'s in-memory objects with Mongoose models (same field names throughout)
4. Everything in `src/routes/*.js` and `src/services/*.js` stays as-is

## What's simplified for the demo (documented, not hidden)
- **Auth**: OTP is logged to the server console (`devOtp` in the response) instead of emailed —
  swap `services/auth.js`'s `console.log` for a real mail provider.
- **Uploads**: images are written to local `./uploads/` instead of Cloudinary/S3 — the swap
  point is commented directly in `routes/uploads.js`.
- **Unread counts**: computed from a simple per-chat `readAt` map rather than full read-receipt
  fan-out; fine for a reference build, worth hardening for production scale.

## Verified working (see conversation for full transcripts)
Auth (OTP + signed tokens) · bootstrap · resource CRUD + NL search · full transaction lifecycle
(request → accept → QR handover → scan → active → return → confirm → review) with live Trust
Score recalculation · wishlist · knowledge posts · skills + sessions · image upload (multipart)
· AI chat proxy to the Python microservice, with a local fallback if it's down.
