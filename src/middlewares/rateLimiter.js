const rateLimit = require("express-rate-limit");

const createLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
  });

const apiRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests. Please try again later.",
});

const authRateLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 25,
  message: "Too many authentication attempts. Please try again later.",
});

module.exports = {
  apiRateLimiter,
  authRateLimiter,
};
