const logger = require("../utils/logger");

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
    return res.status(404).json({
      success: false,
      data: null,
      message: "Requested resource was not found.",
    });
  }

  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      data: null,
      message: "A record with this value already exists.",
    });
  }

  if (err.name === "PrismaClientValidationError") {
    return res.status(400).json({
      success: false,
      data: null,
      message: "Invalid database operation.",
    });
  }

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    data: null,
    message: err.message || "Internal server error.",
    errors: err.errors || undefined,
  });
};

module.exports = errorHandlerMiddleware;
