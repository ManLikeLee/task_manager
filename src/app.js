const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/authRoutes");
const routes = require("./routes");
const handleTokenExpiration = require("./middlewares/handleTokenExpiration");
const { apiRateLimiter } = require("./middlewares/rateLimiter");
const requestLogger = require("./middlewares/requestLogger");
const sanitizeRequest = require("./middlewares/sanitizeRequest");
const notFoundMiddleware = require("./middlewares/notFoundMiddleware");
const errorHandlerMiddleware = require("./middlewares/errorHandlerMiddleware");

const app = express();
const allowedOrigin = process.env.CLIENT_URL;

const buildAllowedOrigins = (origin) => {
  const origins = new Set();

  if (!origin) {
    return origins;
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

  return origins;
};

const allowedOrigins = buildAllowedOrigins(allowedOrigin);

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || !allowedOrigin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed."));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(requestLogger);
app.use(sanitizeRequest);
app.use("/api", apiRateLimiter);

app.use("/api/auth", authRoutes);
app.use("/api", routes);

app.get(/^\/(?!api(?:\/|$)).*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.use(notFoundMiddleware);
app.use(handleTokenExpiration);
app.use(errorHandlerMiddleware);

module.exports = app;
