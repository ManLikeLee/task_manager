const AppError = require("../utils/AppError");
const { verifyAccessToken } = require("../utils/token");

const verifyAccessTokenMiddleware = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      new AppError("Access token is required.", 401, null, "ACCESS_TOKEN_REQUIRED"),
    );
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyAccessToken(token);

  if (decoded.emailVerified === false) {
    return next(
      new AppError(
        "Please verify your email to continue.",
        403,
        null,
        "EMAIL_NOT_VERIFIED",
      ),
    );
  }

  req.user = decoded;

  return next();
};

module.exports = verifyAccessTokenMiddleware;
