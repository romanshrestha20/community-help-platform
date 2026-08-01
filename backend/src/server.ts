import app from './app.js';
import { prisma } from './lib/prisma.js';
import http from "http";
import { initSocketServer } from "./lib/socket.js";
import { registerSocketHandlers } from "./sockets/registerSocketHandlers.js";
import { getEmailServiceStatus } from "./services/email.service.js";
import { getSmsServiceStatus } from "./services/sms.service.js";
import { assertRedisReady, closeRedisClient } from "./lib/redis.js";
import { logger } from "./lib/logger.js";
const httpServer = http.createServer(app);
const io = initSocketServer(httpServer);
registerSocketHandlers(io);

const PORT = Number(process.env.PORT) || 5001;
const HOST = process.env.HOST || '0.0.0.0';
let shutdownStarted = false;

const verifyStartupDependencies = async () => {
  try {
    await prisma.$connect();
    logger.info("startup_database_ready");

    try {
      const redis = await assertRedisReady();
      if (redis) {
        logger.info("startup_redis_ready");
      } else {
        logger.info("startup_redis_disabled");
      }
    } catch (redisError) {
      const strictRedisStartup =
        process.env.NODE_ENV === "production" ||
        process.env.STRICT_REDIS_STARTUP?.trim().toLowerCase() === "true";
      logger.warn("startup_redis_degraded", {
        message: redisError instanceof Error ? redisError.message : String(redisError),
      });
      if (strictRedisStartup) {
        throw redisError;
      }
    }
  } catch (error) {
    logger.error("startup_dependency_failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

const emailStatus = getEmailServiceStatus();
if (!emailStatus.configured) {
  logger.warn("startup_email_degraded", {
    mode: emailStatus.mode,
    missing: emailStatus.missing,
  });
}

const smsStatus = getSmsServiceStatus();
if (!smsStatus.configured) {
  logger.warn("startup_sms_degraded", {
    mode: smsStatus.mode,
    missing: smsStatus.missing,
  });
}

const closeHttpServer = () =>
  new Promise<void>((resolve, reject) => {
    if (!httpServer.listening) {
      resolve();
      return;
    }

    httpServer.close((error) => (error ? reject(error) : resolve()));
  });

const shutdown = async (signal: NodeJS.Signals | "startup_failure") => {
  if (shutdownStarted) return;
  shutdownStarted = true;
  logger.info("shutdown_started", { signal });

  const forceExitTimer = setTimeout(() => {
    logger.error("shutdown_timeout", { timeoutMs: 10_000 });
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  try {
    io.disconnectSockets(true);
    await closeHttpServer();
    await Promise.all([closeRedisClient(), prisma.$disconnect()]);
    logger.info("shutdown_complete", { signal });
  } catch (error) {
    process.exitCode = 1;
    logger.error("shutdown_failed", {
      signal,
      message: error instanceof Error ? error.message : String(error),
    });
  } finally {
    clearTimeout(forceExitTimer);
  }
};

const startServer = async () => {
  await verifyStartupDependencies();

  await new Promise<void>((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(PORT, HOST, () => {
      httpServer.off("error", reject);
      resolve();
    });
  });

  const publicHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  logger.info("server_listening", { host: publicHost, port: PORT });
};

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));

void startServer().catch(async () => {
  process.exitCode = 1;
  await shutdown("startup_failure");
});
