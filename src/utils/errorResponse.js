const DEFAULT_ERROR_CODE_BY_STATUS = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  429: "TOO_MANY_REQUESTS",
  500: "INTERNAL_SERVER_ERROR",
};

const resolveErrorCode = (statusCode, code) => {
  if (code) {
    return code;
  }

  return DEFAULT_ERROR_CODE_BY_STATUS[statusCode] || "INTERNAL_SERVER_ERROR";
};

const formatErrorResponse = ({
  message,
  statusCode = 500,
  code,
  errors,
  requestId,
}) => {
  const payload = {
    success: false,
    message: message || "Internal server error.",
    code: resolveErrorCode(statusCode, code),
  };

  if (Array.isArray(errors) && errors.length > 0) {
    payload.errors = errors;
  }

  if (requestId) {
    payload.requestId = requestId;
  }

  return payload;
};

const sendError = (res, options) => {
  const statusCode = options.statusCode || 500;
  const payload = formatErrorResponse({
    ...options,
    statusCode,
  });

  return res.status(statusCode).json(payload);
};

module.exports = {
  formatErrorResponse,
  sendError,
};
