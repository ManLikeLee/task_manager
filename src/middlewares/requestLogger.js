const crypto = require("crypto");

const logger = require("../utils/logger");

const requestLogger = (req, res, next) => {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  req.requestId = requestId;
  res.locals.requestId = requestId;

  logger.info("request.start", {
    requestId,
    method: req.method,
    path: req.originalUrl,
  });

  res.on("finish", () => {
    logger.info("request.complete", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      latencyMs: Date.now() - startedAt,
    });
  });

  next();
};

module.exports = requestLogger;
