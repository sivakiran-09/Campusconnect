import { get } from "../router.js";
import { subscribe } from "../services/sse.js";

get("/stream", async (req, res, { require }) => {
  const uid_ = require();
  subscribe(uid_, res);
});
