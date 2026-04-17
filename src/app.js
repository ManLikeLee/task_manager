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
      if (!origin || !allowedOrigin || origin === allowedOrigin) {
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

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.use(notFoundMiddleware);
app.use(handleTokenExpiration);
app.use(errorHandlerMiddleware);

module.exports = app;
