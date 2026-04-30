import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";
import { prisma } from "../lib/prisma.js";
import { Role } from "../../generated/prisma/enums.js";

export const requireVerifiedUser = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const user = await prisma.userModel.findUnique({
      where: { id: userId },
      select: {
        isEmailVerified: true,
        isVerified: true,
      },
    });

    if (!user) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!user.isEmailVerified || !user.isVerified) {
      return next(new AppError("Account verification required", 403));
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

export const requireRole = (allowedRoles: Role[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return next(new AppError("Unauthorized", 401));
      }

      const user = await prisma.userModel.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        return next(new AppError("Unauthorized", 401));
      }

      if (!allowedRoles.includes(user.role)) {
        return next(new AppError("Forbidden", 403));
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};
