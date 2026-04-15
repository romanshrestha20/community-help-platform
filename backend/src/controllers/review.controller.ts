import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";
import { getZodErrorMessage } from "../utils/zod.js";
import {
    createReviewBodySchema,
    reviewIdParamSchema,
    reviewsPaginationQuerySchema,
    updateReviewBodySchema,
    userIdParamSchema,
} from "../utils/validation-schemas.js";
import {
    createReviewForCompletedRequest,
    deleteReviewById,
    getReviewById,
    listReviewsForUser,
    updateReviewById,
} from "../services/review.service.js";

const sendResponse = (
    res: Response,
    data: unknown = null,
    message = "",
    meta?: Record<string, unknown>
) => {
    res.json({
        success: true,
        data,
        message,
        ...(meta ? { meta } : {}),
    });
};

export const createReview = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const reviewerId = req.user?.userId;
        if (!reviewerId) {
            return next(new AppError("Unauthorized", 401));
        }

        const parsedBody = createReviewBodySchema.safeParse(req.body);
        if (!parsedBody.success) {
            return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
        }

        const review = await createReviewForCompletedRequest({
            reviewerId,
            ...parsedBody.data,
        });

        sendResponse(res, review, "Review created successfully");
    } catch (error) {
        next(error);
    }
};

export const getUserReviews = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const parsedParams = userIdParamSchema.safeParse(req.params);
        if (!parsedParams.success) {
            return next(new AppError(getZodErrorMessage(parsedParams.error), 400));
        }

        const parsedQuery = reviewsPaginationQuerySchema.safeParse(req.query);
        if (!parsedQuery.success) {
            return next(new AppError(getZodErrorMessage(parsedQuery.error), 400));
        }

        const result = await listReviewsForUser({
            userId: parsedParams.data.userId,
            ...parsedQuery.data,
        });

        sendResponse(res, {
            summary: result.summary,
            reviews: result.reviews,
        }, "", {
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
};

export const getReview = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const parsedParams = reviewIdParamSchema.safeParse(req.params);
        if (!parsedParams.success) {
            return next(new AppError(getZodErrorMessage(parsedParams.error), 400));
        }

        const review = await getReviewById(parsedParams.data.reviewId);
        sendResponse(res, review);
    } catch (error) {
        next(error);
    }
};

export const updateReview = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const reviewerId = req.user?.userId;
        if (!reviewerId) {
            return next(new AppError("Unauthorized", 401));
        }

        const parsedParams = reviewIdParamSchema.safeParse(req.params);
        if (!parsedParams.success) {
            return next(new AppError(getZodErrorMessage(parsedParams.error), 400));
        }

        const parsedBody = updateReviewBodySchema.safeParse(req.body);
        if (!parsedBody.success) {
            return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
        }

        const review = await updateReviewById({
            reviewId: parsedParams.data.reviewId,
            reviewerId,
            ...parsedBody.data,
        });

        sendResponse(res, review, "Review updated successfully");
    } catch (error) {
        next(error);
    }
};

export const deleteReview = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const reviewerId = req.user?.userId;
        if (!reviewerId) {
            return next(new AppError("Unauthorized", 401));
        }

        const parsedParams = reviewIdParamSchema.safeParse(req.params);
        if (!parsedParams.success) {
            return next(new AppError(getZodErrorMessage(parsedParams.error), 400));
        }

        await deleteReviewById({
            reviewId: parsedParams.data.reviewId,
            reviewerId,
        });

        sendResponse(res, null, "Review deleted successfully");
    } catch (error) {
        next(error);
    }
};
