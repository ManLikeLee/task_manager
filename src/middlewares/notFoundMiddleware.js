const logger = require("../utils/logger");

const notFoundMiddleware = (req, res) => {
  logger.warn("Route not found", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
  });

  res.status(404).json({
    success: false,
    data: null,
    message: `Route not found: ${req.originalUrl}`,
  });
};

module.exports = notFoundMiddleware;
