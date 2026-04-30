import { NextFunction, Request, Response } from 'express';
import AppError from '../utils/appError.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { prisma } from '../lib/prisma.js';

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Unauthorized: No token provided', 401));
    }

    const token = authHeader.split(' ')[1];

    const decoded = verifyAccessToken(token);
    const user = await prisma.userModel.findUnique({
      where: { id: decoded.userId },
      select: { tokenVersion: true },
    });

    if (!user) {
      return next(new AppError('Unauthorized', 401));
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      return next(new AppError('Session expired. Please login again.', 401));
    }

    //  attach user info to request
    (req as any).user = decoded;

    next();
  } catch (error) {
    return next(new AppError('Unauthorized', 401));
  }
};
