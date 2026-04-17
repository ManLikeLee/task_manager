const AppError = require("../utils/AppError");
const { verifyAccessToken } = require("../utils/token");

const verifyAccessTokenMiddleware = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Access token is required.", 401));
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyAccessToken(token);

  req.user = decoded;

  return next();
};

module.exports = verifyAccessTokenMiddleware;
