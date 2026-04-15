import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
    prismaMock: {
        helpRequest: {
            findUnique: vi.fn(),
        },
        review: {
            findUnique: vi.fn(),
            create: vi.fn(),
            aggregate: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn(),
        },
        profile: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

const { notificationServiceMock } = vi.hoisted(() => ({
    notificationServiceMock: {
        createNotification: vi.fn(),
    },
}));

vi.mock("../../lib/prisma.js", () => ({
    prisma: prismaMock,
}));

vi.mock("../notification.service.js", () => ({
    createNotification: notificationServiceMock.createNotification,
}));

import {
    createReviewForCompletedRequest,
    listReviewsForUser,
} from "../review.service.js";

describe("review.service", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        prismaMock.$transaction.mockImplementation(async (callback: any) => {
            if (typeof callback === "function") {
                return callback({
                    review: prismaMock.review,
                    profile: prismaMock.profile,
                });
            }

            return Promise.all(callback);
        });
    });

    it("createReviewForCompletedRequest: rejects non-completed requests", async () => {
        prismaMock.helpRequest.findUnique.mockResolvedValue({
            id: "req-1",
            title: "Need groceries",
            status: "ASSIGNED",
            requesterId: "user-1",
            assignedHelperId: "helper-1",
        });

        await expect(
            createReviewForCompletedRequest({
                reviewerId: "user-1",
                helpRequestId: "req-1",
                rating: 5,
                comment: "Great help",
            })
        ).rejects.toMatchObject({
            message: "Reviews are only allowed for completed requests",
            statusCode: 400,
        });
    });

    it("createReviewForCompletedRequest: rejects reviewers who are not the requester", async () => {
        prismaMock.helpRequest.findUnique.mockResolvedValue({
            id: "req-1",
            title: "Need groceries",
            status: "COMPLETED",
            requesterId: "user-1",
            assignedHelperId: "helper-1",
        });

        await expect(
            createReviewForCompletedRequest({
                reviewerId: "outsider-1",
                helpRequestId: "req-1",
                rating: 5,
                comment: "Great help",
            })
        ).rejects.toMatchObject({
            message: "Only the requester can review this completed request",
            statusCode: 403,
        });
    });

    it("createReviewForCompletedRequest: rejects duplicate reviews per request", async () => {
        prismaMock.helpRequest.findUnique.mockResolvedValue({
            id: "req-1",
            title: "Need groceries",
            status: "COMPLETED",
            requesterId: "user-1",
            assignedHelperId: "helper-1",
        });
        prismaMock.review.findUnique.mockResolvedValue({ id: "review-1" });

        await expect(
            createReviewForCompletedRequest({
                reviewerId: "user-1",
                helpRequestId: "req-1",
                rating: 5,
                comment: "Great help",
            })
        ).rejects.toMatchObject({
            message: "You have already reviewed this helper for the request",
            statusCode: 409,
        });
    });

    it("createReviewForCompletedRequest: creates a review, updates stats, and notifies helper", async () => {
        prismaMock.helpRequest.findUnique.mockResolvedValue({
            id: "req-1",
            title: "Need groceries",
            status: "COMPLETED",
            requesterId: "user-1",
            assignedHelperId: "helper-1",
        });
        prismaMock.review.findUnique
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                id: "review-1",
                rating: 5,
                title: "Very helpful",
                comment: "Arrived on time",
                createdAt: new Date("2026-04-15T09:00:00.000Z"),
                user: {
                    id: "user-1",
                    email: "requester@example.com",
                    profile: {
                        fullName: "Requester One",
                        avatarUrl: null,
                    },
                },
                targetUser: {
                    id: "helper-1",
                    email: "helper@example.com",
                    profile: {
                        fullName: "Helper One",
                        avatarUrl: null,
                        rating: 4.8,
                        helpCount: 7,
                        totalReviews: 3,
                    },
                },
                helpRequest: {
                    id: "req-1",
                    title: "Need groceries",
                    status: "COMPLETED",
                    requesterId: "user-1",
                    assignedHelperId: "helper-1",
                },
            });
        prismaMock.review.create.mockResolvedValue({ id: "review-1" });
        prismaMock.review.aggregate.mockResolvedValue({
            _avg: { rating: 4.8 },
            _count: { id: 3 },
        });
        prismaMock.profile.findUnique.mockResolvedValue({ userId: "helper-1" });
        prismaMock.profile.update.mockResolvedValue({});

        const result = await createReviewForCompletedRequest({
            reviewerId: "user-1",
            helpRequestId: "req-1",
            rating: 5,
            title: "Very helpful",
            comment: "Arrived on time",
        });

        expect(prismaMock.review.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    userId: "user-1",
                    targetUserId: "helper-1",
                    helpRequestId: "req-1",
                    rating: 5,
                }),
            })
        );
        expect(prismaMock.profile.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { userId: "helper-1" },
                data: {
                    rating: 4.8,
                    totalReviews: 3,
                },
            })
        );
        expect(notificationServiceMock.createNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: "helper-1",
                actorId: "user-1",
                type: "REVIEW_RECEIVED",
                requestId: "req-1",
                reviewId: "review-1",
            })
        );
        expect(result).toEqual(
            expect.objectContaining({
                id: "review-1",
                rating: 5,
                helper: expect.objectContaining({
                    totalReviews: 3,
                }),
            })
        );
    });

    it("listReviewsForUser: returns helper summary and paginated reviews", async () => {
        prismaMock.profile.findUnique.mockResolvedValue({
            rating: 4.9,
            helpCount: 11,
            totalReviews: 6,
        });
        prismaMock.review.findMany.mockResolvedValue([
            {
                id: "review-1",
                rating: 5,
                title: null,
                comment: "Great support",
                createdAt: new Date("2026-04-15T09:00:00.000Z"),
                user: {
                    id: "user-1",
                    email: "requester@example.com",
                    profile: {
                        fullName: "Requester One",
                        avatarUrl: null,
                    },
                },
                targetUser: {
                    id: "helper-1",
                    email: "helper@example.com",
                    profile: {
                        fullName: "Helper One",
                        avatarUrl: null,
                        rating: 4.9,
                        helpCount: 11,
                        totalReviews: 6,
                    },
                },
                helpRequest: {
                    id: "req-1",
                    title: "Need groceries",
                    status: "COMPLETED",
                    requesterId: "user-1",
                    assignedHelperId: "helper-1",
                },
            },
        ]);
        prismaMock.review.count.mockResolvedValue(1);

        const result = await listReviewsForUser({
            userId: "helper-1",
            page: 1,
            limit: 10,
        });

        expect(result.summary).toEqual({
            rating: 4.9,
            totalReviews: 6,
            completedHelps: 11,
        });
        expect(result.pagination).toEqual({
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
        });
        expect(result.reviews).toHaveLength(1);
    });
});
