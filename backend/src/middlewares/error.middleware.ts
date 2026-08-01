import { NextFunction, Request, Response } from 'express';
import AppError from '../utils/appError.js';
import { logger } from '../lib/logger.js';

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const isOperational = err instanceof AppError;
  const statusCode = isOperational ? err.statusCode : 500;
  const message = isOperational ? err.message : 'Internal server error';

  if (statusCode >= 500) {
    logger.error("http_request_error", {
      requestId: res.locals.requestId,
      method: req.method,
      path: req.path,
      statusCode,
      message: err.message,
      stack: err.stack,
      isOperational,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      requestId: res.locals.requestId,
    },
  });
};
