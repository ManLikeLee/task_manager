const handleTokenExpiration = (err, _req, res, next) => {
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token has expired.",
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }

  return next(err);
};

module.exports = handleTokenExpiration;
