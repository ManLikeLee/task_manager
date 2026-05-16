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

  // Handle Prisma client initialization errors (e.g., missing DATABASE_URL)
  if (err.code === "P1011" || err.message?.includes("Environment variable")) {
    return sendError(res, {
      statusCode: 503,
      message: isDevelopment
        ? `Database connection error: ${err.message}`
        : "Database service unavailable. Please try again later.",
      code: "DATABASE_CONNECTION_ERROR",
      requestId: req.requestId,
    });
  }

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

  if (err.name === "PrismaClientRustPanicError" || err.name === "PrismaClientInitializationError") {
    return sendError(res, {
      statusCode: 503,
      message: isDevelopment ? err.message : "Database service error. Please try again later.",
      code: "DATABASE_SERVICE_ERROR",
      requestId: req.requestId,
    });
  }

  const statusCode = err.statusCode || 500;

  return sendError(res, {
    statusCode,
    message: isDevelopment ? (err.message || "Internal server error.") : "Internal server error.",
    code: err.code,
    errors: isDevelopment ? err.errors : undefined,
    requestId: req.requestId,
  });
};

module.exports = errorHandlerMiddleware;
