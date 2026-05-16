/**
 * Validates that required environment variables are set.
 * Throws an error if any critical variables are missing in production.
 */

const logger = require("./logger");

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
];

const REQUIRED_ENV_VARS_PRODUCTION = [
  ...REQUIRED_ENV_VARS,
  "CLIENT_URL",
];

const validateEnvironment = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const requiredVars = isProduction
    ? REQUIRED_ENV_VARS_PRODUCTION
    : REQUIRED_ENV_VARS;

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    const message = `Missing required environment variables: ${missingVars.join(", ")}`;
    logger.error("environment.validation_failed", {
      missingVars,
      nodeEnv: process.env.NODE_ENV,
    });
    throw new Error(message);
  }

  logger.info("environment.validation_passed", {
    nodeEnv: process.env.NODE_ENV,
  });
};

module.exports = validateEnvironment;
