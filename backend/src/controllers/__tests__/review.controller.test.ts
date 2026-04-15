import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeNext, makeReq, makeRes } from "./test-utils.js";

const { reviewServiceMock } = vi.hoisted(() => ({
    reviewServiceMock: {
        createReviewForCompletedRequest: vi.fn(),
        deleteReviewById: vi.fn(),
        getReviewById: vi.fn(),
        listReviewsForUser: vi.fn(),
        updateReviewById: vi.fn(),
    },
}));

vi.mock("../../services/review.service.js", () => ({
    createReviewForCompletedRequest: reviewServiceMock.createReviewForCompletedRequest,
    deleteReviewById: reviewServiceMock.deleteReviewById,
    getReviewById: reviewServiceMock.getReviewById,
    listReviewsForUser: reviewServiceMock.listReviewsForUser,
    updateReviewById: reviewServiceMock.updateReviewById,
}));

import {
    createReview,
    deleteReview,
    getReview,
    getUserReviews,
    updateReview,
} from "../review.controller.js";

describe("review.controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("createReview: rejects unauthenticated callers", async () => {
        const req = makeReq({ body: {} });
        const res = makeRes();
        const next = makeNext();

        await createReview(req, res, next);

        expect(reviewServiceMock.createReviewForCompletedRequest).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Unauthorized",
                statusCode: 401,
            })
        );
    });

    it("createReview: validates request body", async () => {
        const req = makeReq({
            user: { userId: "user-1" },
            body: {
                helpRequestId: "not-a-uuid",
                rating: 8,
                comment: "",
            },
        });
        const res = makeRes();
        const next = makeNext();

        await createReview(req, res, next);

        expect(reviewServiceMock.createReviewForCompletedRequest).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: 400,
            })
        );
    });

    it("createReview: creates a review successfully", async () => {
        reviewServiceMock.createReviewForCompletedRequest.mockResolvedValue({
            id: "review-1",
            rating: 5,
        });

        const req = makeReq({
            user: { userId: "user-1" },
            body: {
                helpRequestId: "550e8400-e29b-41d4-a716-446655440000",
                rating: 5,
                title: "Great help",
                comment: "Arrived on time",
            },
        });
        const res = makeRes();
        const next = makeNext();

        await createReview(req, res, next);

        expect(reviewServiceMock.createReviewForCompletedRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                reviewerId: "user-1",
                rating: 5,
            })
        );
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Review created successfully",
                data: expect.objectContaining({ id: "review-1" }),
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("getUserReviews: returns summary and review list", async () => {
        reviewServiceMock.listReviewsForUser.mockResolvedValue({
            summary: {
                rating: 4.9,
                totalReviews: 6,
                completedHelps: 11,
            },
            reviews: [{ id: "review-1" }],
            pagination: {
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1,
            },
        });

        const req = makeReq({
            params: {
                userId: "550e8400-e29b-41d4-a716-446655440001",
            },
            query: {
                page: "1",
                limit: "10",
            },
        });
        const res = makeRes();
        const next = makeNext();

        await getUserReviews(req, res, next);

        expect(reviewServiceMock.listReviewsForUser).toHaveBeenCalledWith({
            userId: "550e8400-e29b-41d4-a716-446655440001",
            page: 1,
            limit: 10,
        });
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    summary: expect.objectContaining({ rating: 4.9 }),
                    reviews: [expect.objectContaining({ id: "review-1" })],
                }),
                meta: expect.objectContaining({
                    pagination: expect.objectContaining({ total: 1 }),
                }),
            })
        );
    });

    it("getReview: returns a single review", async () => {
        reviewServiceMock.getReviewById.mockResolvedValue({ id: "review-1" });

        const req = makeReq({
            params: { reviewId: "review-1" },
        });
        const res = makeRes();
        const next = makeNext();

        await getReview(req, res, next);

        expect(reviewServiceMock.getReviewById).toHaveBeenCalledWith("review-1");
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({ id: "review-1" }),
            })
        );
    });

    it("updateReview: updates a review successfully", async () => {
        reviewServiceMock.updateReviewById.mockResolvedValue({
            id: "review-1",
            rating: 4,
        });

        const req = makeReq({
            user: { userId: "user-1" },
            params: { reviewId: "review-1" },
            body: { rating: 4 },
        });
        const res = makeRes();
        const next = makeNext();

        await updateReview(req, res, next);

        expect(reviewServiceMock.updateReviewById).toHaveBeenCalledWith({
            reviewId: "review-1",
            reviewerId: "user-1",
            rating: 4,
        });
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Review updated successfully",
            })
        );
    });

    it("deleteReview: deletes a review successfully", async () => {
        reviewServiceMock.deleteReviewById.mockResolvedValue(undefined);

        const req = makeReq({
            user: { userId: "user-1" },
            params: { reviewId: "review-1" },
        });
        const res = makeRes();
        const next = makeNext();

        await deleteReview(req, res, next);

        expect(reviewServiceMock.deleteReviewById).toHaveBeenCalledWith({
            reviewId: "review-1",
            reviewerId: "user-1",
        });
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Review deleted successfully",
                data: null,
            })
        );
    });
});
