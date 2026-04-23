const logger = require("../utils/logger");
const { sendError } = require("../utils/errorResponse");

const errorHandlerMiddleware = (err, req, res, _next) => {
  const isDevelopment = process.env.NODE_ENV !== "production";

  const requestPayloadContext = isDevelopment
    ? {
        body: req.body,
        params: req.params,
        query: req.query,
      }
    : undefined;

  logger.error(err.message || "Unhandled error.", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode: err.statusCode || 500,
    code: err.code,
    stack: isDevelopment ? err.stack : undefined,
    ...(requestPayloadContext ? { request: requestPayloadContext } : {}),
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
    if (isDevelopment) {
      logger.error("prisma.validation_error.details", {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        message: err.message,
        request: requestPayloadContext,
      });
    }

    return sendError(res, {
      statusCode: 400,
      message: isDevelopment
        ? "Invalid database operation. Check server logs for Prisma validation details."
        : "Invalid database operation.",
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
