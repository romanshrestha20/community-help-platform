import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { jwtMock, reviewServiceMock } = vi.hoisted(() => ({
    jwtMock: {
        verifyAccessToken: vi.fn(),
    },
    reviewServiceMock: {
        createReviewForCompletedRequest: vi.fn(),
        listReviewsForUser: vi.fn(),
    },
}));

vi.mock("../../utils/jwt.js", () => ({
    verifyAccessToken: jwtMock.verifyAccessToken,
}));

vi.mock("../../services/review.service.js", () => ({
    createReviewForCompletedRequest: reviewServiceMock.createReviewForCompletedRequest,
    listReviewsForUser: reviewServiceMock.listReviewsForUser,
}));

import app from "../../app.js";

describe("review routes integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        jwtMock.verifyAccessToken.mockReturnValue({ userId: "user-1" });
    });

    it("POST /api/reviews requires authentication", async () => {
        const res = await request(app).post("/api/reviews").send({
            helpRequestId: "11111111-1111-1111-1111-111111111111",
            rating: 5,
            comment: "Great help",
        });

        expect(res.status).toBe(401);
        expect(reviewServiceMock.createReviewForCompletedRequest).not.toHaveBeenCalled();
    });

    it("POST /api/reviews creates a review", async () => {
        reviewServiceMock.createReviewForCompletedRequest.mockResolvedValue({
            id: "review-1",
            rating: 5,
        });

        const res = await request(app)
            .post("/api/reviews")
            .set("Authorization", "Bearer valid-token")
            .send({
                helpRequestId: "11111111-1111-1111-1111-111111111111",
                rating: 5,
                title: "Great help",
                comment: "Arrived on time",
            });

        expect(reviewServiceMock.createReviewForCompletedRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                reviewerId: "user-1",
                rating: 5,
            })
        );
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({
                success: true,
                message: "Review created successfully",
            })
        );
    });

    it("GET /api/users/:userId/reviews returns helper reviews", async () => {
        reviewServiceMock.listReviewsForUser.mockResolvedValue({
            summary: {
                rating: 4.8,
                totalReviews: 4,
                completedHelps: 9,
            },
            reviews: [{ id: "review-1" }],
            pagination: {
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1,
            },
        });

        const res = await request(app).get(
            "/api/users/11111111-1111-1111-1111-111111111111/reviews?page=1&limit=10"
        );

        expect(reviewServiceMock.listReviewsForUser).toHaveBeenCalledWith({
            userId: "11111111-1111-1111-1111-111111111111",
            page: 1,
            limit: 10,
        });
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    summary: expect.objectContaining({ rating: 4.8 }),
                    reviews: [expect.objectContaining({ id: "review-1" })],
                }),
            })
        );
    });
});
