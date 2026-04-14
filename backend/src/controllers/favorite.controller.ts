import { Request, Response, NextFunction } from "express";

import {
  addFavoriteHelpRequest,
  removeFavoriteHelpRequest,
  getFavoriteHelpRequests,
  getMyFavoriteRequestIds,
  isRequestFavorited,
} from "../services/favorite.service.js";
import AppError from "../utils/appError.js";

const requireAuthenticatedUser = (
  req: Request,
  next: NextFunction
): string | null => {
  const userId = req.user?.userId ?? null;

  if (!userId) {
    next(new AppError("Unauthorized", 401));
    return null;
  }

  return userId;
};

const requireRequestId = (req: Request) => {
  const { requestId } = req.params;

  if (!requestId || typeof requestId !== "string") {
    throw new AppError("requestId is required", 400);
  }

  return requestId;
};

const sendResponse = <T>(
  res: Response,
  data: T,
  options?: {
    message?: string;
    statusCode?: number;
    meta?: Record<string, unknown>;
  }
) => {
  const { message, statusCode = 200, meta } = options || {};

  res.status(statusCode).json({
    success: true,
    data,
    ...(message ? { message } : {}),
    ...(meta ? { meta } : {}),
  });
};

export const addToFavorites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireAuthenticatedUser(req, next);
    if (!userId) return;

    const requestId = requireRequestId(req);

    const result = await addFavoriteHelpRequest({
      userId,
      requestId,
    });

    return sendResponse(res, result.favorite, {
      statusCode: result.created ? 201 : 200,
      message: result.created
        ? "Request added to favorites successfully"
        : "Request is already in favorites",
      meta: { created: result.created },
    });
  } catch (error) {
    next(error);
  }
};
export const removeFromFavorites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireAuthenticatedUser(req, next);
    if (!userId) return;

    const requestId = requireRequestId(req);

    const result = await removeFavoriteHelpRequest({
      userId,
      requestId,
    });

    return sendResponse(
      res,
      result,
      {
        message: result.removed
          ? "Request removed from favorites successfully"
          : "Request was not in favorites",
      }
    );
  } catch (error) {
    next(error);
  }
};

export const listFavorites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireAuthenticatedUser(req, next);
    if (!userId) return;

    const result = await getFavoriteHelpRequests(userId, req.query);

    return sendResponse(res, result.requests, {
      message: "Favorite requests fetched successfully",
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

export const listMyFavoriteRequestIds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireAuthenticatedUser(req, next);
    if (!userId) return;

    const requestIds = await getMyFavoriteRequestIds(userId);

    return sendResponse(
      res,
      requestIds,
      {
        message: "Favorite request IDs fetched successfully",
      }
    );
  } catch (error) {
    next(error);
  }
};

export const checkFavoriteStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireAuthenticatedUser(req, next);
    if (!userId) return;

    const requestId = requireRequestId(req);

    const favorited = await isRequestFavorited(userId, requestId);

    return sendResponse(
      res,
      {
        requestId,
        favorited,
      },
      {
        message: "Favorite status fetched successfully",
      }
    );
  } catch (error) {
    next(error);
  }
};