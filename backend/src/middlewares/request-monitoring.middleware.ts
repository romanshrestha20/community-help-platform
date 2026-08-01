import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

import { logger } from "../lib/logger.js";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;

export const requestMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const incomingRequestId = req.header("x-request-id")?.trim();
  const requestId =
    incomingRequestId && REQUEST_ID_PATTERN.test(incomingRequestId)
      ? incomingRequestId
      : randomUUID();
  const startedAt = process.hrtime.bigint();

  res.locals.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  res.once("finish", () => {
    if (req.path === "/health/live") return;

    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger.info("http_request", {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    });
  });

  next();
};
