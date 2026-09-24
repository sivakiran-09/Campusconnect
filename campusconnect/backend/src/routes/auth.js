import { post } from "../router.js";
import { requestOtp, verifyOtp } from "../services/auth.js";

post("/auth/request-otp", async (req, res, { body, json }) => {
  const r = requestOtp(String(body.email || "").trim().toLowerCase());
  json(200, r);
});

post("/auth/verify-otp", async (req, res, { body, json }) => {
  const r = verifyOtp(String(body.email || "").trim().toLowerCase(), body.otp);
  json(200, r);
});
