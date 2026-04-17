const logger = require("../utils/logger");
const { sendError } = require("../utils/errorResponse");

const errorHandlerMiddleware = (err, req, res, _next) => {
  logger.error(err.message || "Unhandled error.", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode: err.statusCode || 500,
    code: err.code,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });

  if (err.code === "P2025") {
    return sendError(res, {
      statusCode: 404,
      message: "Requested resource was not found.",
      code: "RESOURCE_NOT_FOUND",
      requestId: req.requestId,
    });
  }

  if (err.code === "P2002") {
    return sendError(res, {
      statusCode: 409,
      message: "A record with this value already exists.",
      code: "DUPLICATE_RECORD",
      requestId: req.requestId,
    });
  }

  if (err.name === "PrismaClientValidationError") {
    return sendError(res, {
      statusCode: 400,
      message: "Invalid database operation.",
      code: "INVALID_DATABASE_OPERATION",
      requestId: req.requestId,
    });
  }

  const statusCode = err.statusCode || 500;

  return sendError(res, {
    statusCode,
    message: err.message || "Internal server error.",
    code: err.code,
    errors: err.errors,
    requestId: req.requestId,
  });
};

module.exports = errorHandlerMiddleware;
