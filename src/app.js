const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const logger = require("./utils/logger");

const authRoutes = require("./routes/authRoutes");
const routes = require("./routes");
const handleTokenExpiration = require("./middlewares/handleTokenExpiration");
const { apiRateLimiter } = require("./middlewares/rateLimiter");
const requestLogger = require("./middlewares/requestLogger");
const sanitizeRequest = require("./middlewares/sanitizeRequest");
const notFoundMiddleware = require("./middlewares/notFoundMiddleware");
const errorHandlerMiddleware = require("./middlewares/errorHandlerMiddleware");
const { logEmailProviderStatus } = require("./services/mailService");

const app = express();
const allowedOriginConfig = process.env.CLIENT_URL || "";
const isDevelopment = (process.env.NODE_ENV || "development") !== "production";

const parseAllowedOrigins = (originsConfig) =>
  originsConfig
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const buildWildcardOriginRegex = (origin) => {
  if (!origin.includes("*")) {
    return null;
  }

  try {
    const parsed = new URL(origin);
    const escapedHost = parsed.hostname.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    const wildcardHost = escapedHost.replace(/\\\*/g, ".*");
    const portPart = parsed.port ? `:${parsed.port}` : "";
    return new RegExp(`^${parsed.protocol}//${wildcardHost}${portPart}$`, "i");
  } catch {
    return null;
  }
};

const buildAllowedOrigins = (originsList) => {
  const origins = new Set();
  const wildcardOrigins = [];

  if (!originsList.length) {
    return { origins, wildcardOrigins };
  }

  originsList.forEach((origin) => {
    const wildcardRegex = buildWildcardOriginRegex(origin);
    if (wildcardRegex) {
      wildcardOrigins.push(wildcardRegex);
      return;
    }

    origins.add(origin);

    try {
      const parsed = new URL(origin);
      const isLocalHost =
        parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

      if (isLocalHost) {
        const alternateHost =
          parsed.hostname === "localhost" ? "127.0.0.1" : "localhost";
        origins.add(`${parsed.protocol}//${alternateHost}${parsed.port ? `:${parsed.port}` : ""}`);
      }
    } catch {
      // Ignore invalid CLIENT_URL format and keep the original value only.
    }
  });

  return { origins, wildcardOrigins };
};

const configuredOrigins = parseAllowedOrigins(allowedOriginConfig);
const { origins: allowedOrigins, wildcardOrigins } = buildAllowedOrigins(configuredOrigins);
const isLocalDevOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
const isWildcardAllowedOrigin = (origin) =>
  wildcardOrigins.some((originRegex) => originRegex.test(origin));

logEmailProviderStatus();
logger.info("cors.allowed_origins_configured", {
  configuredOrigins,
  wildcardOrigins: configuredOrigins.filter((origin) => origin.includes("*")),
});

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || !configuredOrigins.length || allowedOrigins.has(origin) || isWildcardAllowedOrigin(origin)) {
      return callback(null, true);
    }

    if (isDevelopment && isLocalDevOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS origin not allowed."));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(sanitizeRequest);
app.use("/api", apiRateLimiter);

app.use("/api/auth", authRoutes);
app.use("/api", routes);

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "TaskForce API is running",
    docs: "/api/health",
  });
});

app.use(notFoundMiddleware);
app.use(handleTokenExpiration);
app.use(errorHandlerMiddleware);

module.exports = app;
