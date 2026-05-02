import { NextFunction, Request, Response } from 'express';
import AppError from '../utils/appError.js';

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
    console.error("Request failed with server error", {
      method: req.method,
      path: req.originalUrl,
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
    },
  });
};
