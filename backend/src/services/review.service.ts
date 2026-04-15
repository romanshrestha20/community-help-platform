import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import AppError from "../utils/appError.js";
import { createNotification } from "./notification.service.js";

const REVIEW_INCLUDE = {
    user: {
        select: {
            id: true,
            email: true,
            profile: {
                select: {
                    fullName: true,
                    avatarUrl: true,
                },
            },
        },
    },
    targetUser: {
        select: {
            id: true,
            email: true,
            profile: {
                select: {
                    fullName: true,
                    avatarUrl: true,
                    rating: true,
                    helpCount: true,
                    totalReviews: true,
                },
            },
        },
    },
    helpRequest: {
        select: {
            id: true,
            title: true,
            status: true,
            requesterId: true,
            assignedHelperId: true,
        },
    },
} satisfies Prisma.ReviewInclude;

type CreateReviewInput = {
    reviewerId: string;
    helpRequestId: string;
    rating: number;
    title?: string;
    comment: string;
};

type ListUserReviewsInput = {
    userId: string;
    page?: number;
    limit?: number;
};

const REVIEW_SUMMARY_SELECT = {
    rating: true,
    helpCount: true,
    totalReviews: true,
} satisfies Prisma.ProfileSelect;

const formatReview = (review: Prisma.ReviewGetPayload<{ include: typeof REVIEW_INCLUDE }>) => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    createdAt: review.createdAt,
    reviewer: {
        id: review.user.id,
        email: review.user.email,
        fullName: review.user.profile?.fullName ?? null,
        avatarUrl: review.user.profile?.avatarUrl ?? null,
    },
    helper: {
        id: review.targetUser.id,
        email: review.targetUser.email,
        fullName: review.targetUser.profile?.fullName ?? null,
        avatarUrl: review.targetUser.profile?.avatarUrl ?? null,
        rating: review.targetUser.profile?.rating ?? 0,
        helpCount: review.targetUser.profile?.helpCount ?? 0,
        totalReviews: review.targetUser.profile?.totalReviews ?? 0,
    },
    helpRequest: {
        id: review.helpRequest.id,
        title: review.helpRequest.title,
        status: review.helpRequest.status,
    },
});

const syncHelperReviewStats = async (
    tx: Prisma.TransactionClient,
    helperId: string
) => {
    const [stats, profile] = await Promise.all([
        tx.review.aggregate({
            where: {
                targetUserId: helperId,
                isApproved: true,
            },
            _avg: {
                rating: true,
            },
            _count: {
                id: true,
            },
        }),
        tx.profile.findUnique({
            where: { userId: helperId },
            select: { userId: true },
        }),
    ]);

    if (!profile) {
        throw new AppError("Helper profile not found", 404);
    }

    await tx.profile.update({
        where: { userId: helperId },
        data: {
            rating: stats._avg.rating ?? 0,
            totalReviews: stats._count.id,
        },
    });
};

export const createReviewForCompletedRequest = async ({
    reviewerId,
    helpRequestId,
    rating,
    title,
    comment,
}: CreateReviewInput) => {
    const request = await prisma.helpRequest.findUnique({
        where: { id: helpRequestId },
        select: {
            id: true,
            title: true,
            status: true,
            requesterId: true,
            assignedHelperId: true,
        },
    });

    if (!request) {
        throw new AppError("Help request not found", 404);
    }

    if (request.status !== "COMPLETED") {
        throw new AppError("Reviews are only allowed for completed requests", 400);
    }

    if (request.requesterId !== reviewerId) {
        throw new AppError("Only the requester can review this completed request", 403);
    }

    if (!request.assignedHelperId) {
        throw new AppError("This request has no assigned helper to review", 400);
    }

    const existingReview = await prisma.review.findUnique({
        where: {
            userId_helpRequestId: {
                userId: reviewerId,
                helpRequestId,
            },
        },
        select: { id: true },
    });

    if (existingReview) {
        throw new AppError("You have already reviewed this helper for the request", 409);
    }

    const review = await prisma.$transaction(async (tx) => {
        const createdReview = await tx.review.create({
            data: {
                userId: reviewerId,
                targetUserId: request.assignedHelperId!,
                helpRequestId,
                rating,
                title: title?.trim() || null,
                comment: comment.trim(),
            },
            include: REVIEW_INCLUDE,
        });

        await syncHelperReviewStats(tx, request.assignedHelperId!);

        return tx.review.findUnique({
            where: { id: createdReview.id },
            include: REVIEW_INCLUDE,
        });
    });

    if (!review) {
        throw new AppError("Failed to create review", 500);
    }

    await createNotification({
        userId: request.assignedHelperId,
        actorId: reviewerId,
        type: "REVIEW_RECEIVED",
        title: "New review received",
        body: `You received a ${rating}-star review for "${request.title}"`,
        requestId: request.id,
        reviewId: review.id,
        data: {
            helpRequestId: request.id,
            rating,
        },
    });

    return formatReview(review);
};

export const listReviewsForUser = async ({
    userId,
    page = 1,
    limit = 10,
}: ListUserReviewsInput) => {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const skip = (safePage - 1) * safeLimit;

    const [profile, reviews, total] = await Promise.all([
        prisma.profile.findUnique({
            where: { userId },
            select: REVIEW_SUMMARY_SELECT,
        }),
        prisma.review.findMany({
            where: {
                targetUserId: userId,
                isApproved: true,
            },
            include: REVIEW_INCLUDE,
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: safeLimit,
        }),
        prisma.review.count({
            where: {
                targetUserId: userId,
                isApproved: true,
            },
        }),
    ]);

    return {
        summary: {
            rating: profile?.rating ?? 0,
            totalReviews: profile?.totalReviews ?? total,
            completedHelps: profile?.helpCount ?? 0,
        },
        reviews: reviews.map(formatReview),
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: Math.max(Math.ceil(total / safeLimit), 1),
        },
    };
};
