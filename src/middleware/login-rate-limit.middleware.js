import rateLimit from "express-rate-limit";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;

const loginRateLimit = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_LOGIN_ATTEMPTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Try again in 15 minutes.",
  },
});

export default loginRateLimit;
