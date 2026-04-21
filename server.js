require("dotenv").config();

const app = require("./src/app");
const prisma = require("./src/prisma/client");
const logger = require("./src/utils/logger");

const requestedPort = Number(process.env.PORT) || 4050;
const candidatePorts = process.env.PORT ? [requestedPort] : [4050, 5050];
const SHUTDOWN_TIMEOUT_MS = 10000;

let server = null;
let activePort = null;

const startServer = (index = 0) => {
  const port = candidatePorts[index];
  const nextServer = app.listen(port);

  nextServer.once("listening", () => {
    server = nextServer;
    activePort = port;

    logger.info("server.started", {
      port: activePort,
      environment: process.env.NODE_ENV || "development",
    });
  });

  nextServer.once("error", (error) => {
    if (error.code === "EADDRINUSE" && index < candidatePorts.length - 1) {
      logger.error("server.port_in_use", {
        port,
        retryPort: candidatePorts[index + 1],
      });
      startServer(index + 1);
      return;
    }

    logger.error("server.start_failed", {
      port,
      error: error.message,
    });

    process.exit(1);
  });
};

startServer();

let isShuttingDown = false;

const shutdown = (signal) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  logger.info("server.shutdown.initiated", {
    signal,
    port: activePort,
  });

  if (!server) {
    process.exit();
    return;
  }

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
