// Direct endpoint used by the frontend store's askAi() when running against a real backend
// (frontend/src/lib/store.jsx calls POST /ai/chat and expects the {text, points, cards, ...}
// shape straight back, same as services/ai.js returns).
import { post } from "../router.js";
import db from "../db.js";
import { askCampusAi } from "../services/ai.js";

post("/ai/chat", async (req, res, { require, body, json }) => {
  require();
  const reply = await askCampusAi(String(body.message || ""), db);
  json(200, reply);
});
