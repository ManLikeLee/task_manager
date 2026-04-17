const prisma = require("../prisma/client");

const asyncHandler = require("../utils/asyncHandler");
const logger = require("../utils/logger");
const { sendError } = require("../utils/errorResponse");
const { sendSuccess } = require("../utils/response");

const getHealthStatus = (_req, res) => {
  sendSuccess(res, {
    data: {
      status: "healthy",
    },
    message: "API is healthy.",
  });
};

const getHealthLiveStatus = (_req, res) => {
  sendSuccess(res, {
    data: {
      status: "live",
    },
    message: "API liveness check passed.",
  });
};

const getHealthReadyStatus = asyncHandler(async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    sendSuccess(res, {
      data: {
        status: "ready",
      },
      message: "API readiness check passed.",
    });
  } catch (error) {
    logger.error("Readiness check failed.", {
      requestId: req.requestId,
      path: req.originalUrl,
      error: error.message,
    });

    return sendError(res, {
      statusCode: 503,
      message: "API readiness check failed.",
      code: "READINESS_CHECK_FAILED",
      requestId: req.requestId,
    });
  }
});

module.exports = {
  getHealthStatus,
  getHealthLiveStatus,
  getHealthReadyStatus,
};
