require("dotenv").config();

const app = require("./src/app");
const prisma = require("./src/prisma/client");
const logger = require("./src/utils/logger");

const PORT = process.env.PORT || 5000;
const SHUTDOWN_TIMEOUT_MS = 10000;

const server = app.listen(PORT, () => {
  logger.info("server.started", {
    port: PORT,
    environment: process.env.NODE_ENV || "development",
  });
});

let isShuttingDown = false;

const shutdown = (signal) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  logger.info("server.shutdown.initiated", {
    signal,
  });

  const forceShutdownTimer = setTimeout(() => {
    logger.error("server.shutdown.timeout", {
      timeoutMs: SHUTDOWN_TIMEOUT_MS,
    });
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  forceShutdownTimer.unref();

  server.close(async (serverCloseError) => {
    if (serverCloseError) {
      logger.error("server.shutdown.http_close_failed", {
        error: serverCloseError.message,
      });
      process.exitCode = 1;
    } else {
      logger.info("server.shutdown.http_closed");
    }

    try {
      await prisma.$disconnect();
      logger.info("server.shutdown.prisma_disconnected");
    } catch (prismaDisconnectError) {
      logger.error("server.shutdown.prisma_disconnect_failed", {
        error: prismaDisconnectError.message,
      });
      process.exitCode = 1;
    }

    process.exit();
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
