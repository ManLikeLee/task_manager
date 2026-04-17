const { sendError } = require("../utils/errorResponse");

const handleTokenExpiration = (err, req, res, next) => {
  if (err.name === "TokenExpiredError") {
    return sendError(res, {
      statusCode: 401,
      message: "Token has expired.",
      code: "TOKEN_EXPIRED",
      requestId: req.requestId,
    });
  }

  if (err.name === "JsonWebTokenError") {
    return sendError(res, {
      statusCode: 401,
      message: "Invalid token.",
      code: "INVALID_TOKEN",
      requestId: req.requestId,
    });
  }

  return next(err);
};

module.exports = handleTokenExpiration;
