const rateLimit = require("express-rate-limit");
const { formatErrorResponse } = require("../utils/errorResponse");

const createLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const statusCode = 429;
      return res.status(statusCode).json(
        formatErrorResponse({
          statusCode,
          message,
          code: "RATE_LIMIT_EXCEEDED",
          requestId: req.requestId,
        }),
      );
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
