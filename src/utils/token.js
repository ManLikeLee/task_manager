const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const getRequiredEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
};

const accessSecret = () => getRequiredEnv("JWT_ACCESS_SECRET");
const refreshSecret = () => getRequiredEnv("JWT_REFRESH_SECRET");
const accessExpiry = () => process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const refreshExpiry = () => process.env.JWT_REFRESH_EXPIRES_IN || "7d";

const generateAccessToken = (payload) =>
  jwt.sign(payload, accessSecret(), {
    expiresIn: accessExpiry(),
  });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, refreshSecret(), {
    expiresIn: refreshExpiry(),
  });

const verifyAccessToken = (token) => jwt.verify(token, accessSecret());

const verifyRefreshToken = (token) => jwt.verify(token, refreshSecret());

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyAccessToken,
  verifyRefreshToken,
};
