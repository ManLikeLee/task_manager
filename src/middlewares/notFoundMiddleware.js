const logger = require("../utils/logger");
const { sendError } = require("../utils/errorResponse");

const notFoundMiddleware = (req, res) => {
  logger.warn("Route not found", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
  });

  return sendError(res, {
    statusCode: 404,
    message: `Route not found: ${req.originalUrl}`,
    code: "ROUTE_NOT_FOUND",
    requestId: req.requestId,
  });
};

module.exports = notFoundMiddleware;
