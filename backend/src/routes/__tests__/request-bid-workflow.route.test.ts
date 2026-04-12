import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_TOKENS = {
    requester: "requester-token",
    helperOne: "helper-one-token",
    helperTwo: "helper-two-token",
} as const;

const USERS = {
    requester: {
        id: "requester-1",
        email: "requester@example.com",
        profile: { fullName: "Requester One", dateOfBirth: null },
    },
    helperOne: {
        id: "helper-1",
        email: "helper1@example.com",
        profile: { fullName: "Helper One", dateOfBirth: null },
    },
    helperTwo: {
        id: "helper-2",
        email: "helper2@example.com",
        profile: { fullName: "Helper Two", dateOfBirth: null },
    },
} as const;

const state = {
    requestCounter: 0,
    bidCounter: 0,
    notifCounter: 0,
    requests: new Map<string, any>(),
    bids: new Map<string, any>(),
    notifications: [] as Array<any>,
};

const resetState = () => {
    state.requestCounter = 0;
    state.bidCounter = 0;
    state.notifCounter = 0;
    state.requests = new Map();
    state.bids = new Map();
    state.notifications = [];
};

const tokenToUser = (token: string) => {
    switch (token) {
        case TEST_TOKENS.requester:
            return { userId: USERS.requester.id };
        case TEST_TOKENS.helperOne:
            return { userId: USERS.helperOne.id };
        case TEST_TOKENS.helperTwo:
            return { userId: USERS.helperTwo.id };
        default:
            throw new Error("Invalid token");
    }
};

const buildRequestResponse = (record: any) => {
    if (!record) return null;

    const requester = USERS.requester;
    const bidsForRequest = Array.from(state.bids.values()).filter(
        (bid) => bid.helpRequestId === record.id,
    );

    return {
        id: record.id,
        requesterId: record.requesterId,
        title: record.title,
        description: record.description,
        category: record.category,
        budget: record.budget,
        isPaid: record.isPaid,
        status: record.status,
        assignedHelperId: record.assignedHelperId ?? null,
        serviceRadiusMeters: record.serviceRadiusMeters ?? null,
        locationId: record.locationId ?? null,
        location: record.location ?? null,
        images: record.images ?? [],
        requester: {
            id: requester.id,
            profile: {
                fullName: requester.profile.fullName,
                address: null,
            },
        },
        _count: {
            bids: bidsForRequest.length,
        },
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    };
};

const buildBidResponse = (record: any) => {
    if (!record) return null;

    const helper =
        record.helperId === USERS.helperOne.id
            ? USERS.helperOne
            : record.helperId === USERS.helperTwo.id
                ? USERS.helperTwo
                : USERS.requester;
    const requestRecord = state.requests.get(record.helpRequestId);

    return {
        id: record.id,
        helpRequestId: record.helpRequestId,
        helperId: record.helperId,
        message: record.message,
        amount: record.amount,
        status: record.status,
        helper: {
            id: helper.id,
            email: helper.email,
            profile: {
                fullName: helper.profile.fullName,
                dateOfBirth: helper.profile.dateOfBirth,
            },
        },
        request: requestRecord
            ? {
                requesterId: requestRecord.requesterId,
                title: requestRecord.title,
            }
            : { requesterId: undefined, title: undefined },
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    };
};

const { prismaMock } = vi.hoisted(() => ({
    prismaMock: {
        userModel: {
            findUnique: vi.fn(),
        },
        helpRequest: {
            create: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
            findMany: vi.fn(),
        },
        bid: {
            findFirst: vi.fn(),
            create: vi.fn(),
            findUnique: vi.fn(),
            updateMany: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            findMany: vi.fn(),
        },
        image: {
            create: vi.fn(),
            findFirst: vi.fn(),
            delete: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

const { notificationServiceMock } = vi.hoisted(() => ({
    notificationServiceMock: {
        createNotification: vi.fn(),
        getUserNotifications: vi.fn(),
        getUnreadNotificationCount: vi.fn(),
        markNotificationAsRead: vi.fn(),
        markAllNotificationsAsRead: vi.fn(),
        deleteNotification: vi.fn(),
    },
}));

const { conversationServiceMock } = vi.hoisted(() => ({
    conversationServiceMock: {
        ensureConversationForRequestInTransaction: vi.fn(),
    },
}));

const { jwtMock } = vi.hoisted(() => ({
    jwtMock: {
        verifyAccessToken: vi.fn(),
    },
}));

const { cloudinaryUtilsMock } = vi.hoisted(() => ({
    cloudinaryUtilsMock: {
        uploadImageToCloudinary: vi.fn(),
        deleteImageFromCloudinary: vi.fn(),
    },
}));

vi.mock("../../lib/prisma.js", () => ({
    prisma: prismaMock,
}));

vi.mock("../../services/notification.service.js", () => ({
    createNotification: notificationServiceMock.createNotification,
    getUserNotifications: notificationServiceMock.getUserNotifications,
    getUnreadNotificationCount: notificationServiceMock.getUnreadNotificationCount,
    markNotificationAsRead: notificationServiceMock.markNotificationAsRead,
    markAllNotificationsAsRead: notificationServiceMock.markAllNotificationsAsRead,
    deleteNotification: notificationServiceMock.deleteNotification,
}));

vi.mock("../../services/conversation.service.js", () => ({
    ensureConversationForRequestInTransaction:
        conversationServiceMock.ensureConversationForRequestInTransaction,
}));

vi.mock("../../utils/jwt.js", () => ({
    verifyAccessToken: jwtMock.verifyAccessToken,
}));

vi.mock("../../utils/cloudinary.js", () => ({
    uploadImageToCloudinary: cloudinaryUtilsMock.uploadImageToCloudinary,
    deleteImageFromCloudinary: cloudinaryUtilsMock.deleteImageFromCloudinary,
}));

import app from "../../app.js";

describe("request/bid notification workflow routes", () => {
    beforeEach(() => {
        resetState();
        vi.clearAllMocks();

        jwtMock.verifyAccessToken.mockImplementation((token: string) => tokenToUser(token));

        notificationServiceMock.createNotification.mockImplementation(async (input: any) => {
            const record = {
                id: `notif-${++state.notifCounter}`,
                userId: input.userId,
                actorId: input.actorId ?? null,
                type: input.type,
                title: input.title,
                body: input.body,
                requestId: input.requestId ?? null,
                bidId: input.bidId ?? null,
                conversationId: input.conversationId ?? null,
                messageId: input.messageId ?? null,
                reviewId: input.reviewId ?? null,
                data: input.data ?? null,
                isRead: false,
                readAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            state.notifications.push(record);
            return record;
        });

        conversationServiceMock.ensureConversationForRequestInTransaction.mockImplementation(
            async (_tx: any, requestId: string) => ({
                conversation: {
                    id: `conv-${requestId}`,
                    requestId,
                },
                starterNote: "Bid accepted. You can now coordinate through chat.",
            })
        );

        notificationServiceMock.getUserNotifications.mockImplementation(async (userId: string) => {
            return state.notifications
                .filter((notification) => notification.userId === userId)
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        });

        notificationServiceMock.getUnreadNotificationCount.mockImplementation(async (userId: string) => {
            return state.notifications.filter(
                (notification) => notification.userId === userId && !notification.isRead,
            ).length;
        });

        notificationServiceMock.markNotificationAsRead.mockImplementation(async (notificationId: string, userId: string) => {
            const notification = state.notifications.find(
                (item) => item.id === notificationId && item.userId === userId,
            );
            if (notification) {
                notification.isRead = true;
                notification.readAt = new Date();
            }
            return { count: notification ? 1 : 0 };
        });

        notificationServiceMock.markAllNotificationsAsRead.mockImplementation(async (userId: string) => {
            let count = 0;
            for (const notification of state.notifications) {
                if (notification.userId === userId && !notification.isRead) {
                    notification.isRead = true;
                    notification.readAt = new Date();
                    count += 1;
                }
            }
            return { count };
        });

        notificationServiceMock.deleteNotification.mockImplementation(async (notificationId: string, userId: string) => {
            const before = state.notifications.length;
            state.notifications = state.notifications.filter(
                (notification) => !(notification.id === notificationId && notification.userId === userId),
            );
            return { count: before - state.notifications.length };
        });

        prismaMock.userModel.findUnique.mockImplementation(async ({ where }: any) => {
            if (where?.id === USERS.requester.id) return { id: USERS.requester.id };
            if (where?.id === USERS.helperOne.id) return { id: USERS.helperOne.id };
            if (where?.id === USERS.helperTwo.id) return { id: USERS.helperTwo.id };
            return null;
        });

        prismaMock.helpRequest.create.mockImplementation(async ({ data }: any) => {
            const id = `req-${++state.requestCounter}`;
            const createdAt = new Date();
            const location = data.location?.create
                ? {
                    id: `loc-${state.requestCounter}`,
                    ...data.location.create,
                    createdAt,
                    updatedAt: createdAt,
                }
                : null;

            const record = {
                id,
                requesterId: data.requester.connect.id,
                title: data.title,
                description: data.description,
                category: data.category,
                budget: data.budget ?? null,
                isPaid: Boolean(data.isPaid),
                status: "OPEN",
                assignedHelperId: null,
                serviceRadiusMeters: data.serviceRadiusMeters ?? 800,
                locationId: location?.id ?? null,
                location,
                images: [],
                createdAt,
                updatedAt: createdAt,
            };

            state.requests.set(id, record);
            return { id, title: record.title };
        });

        prismaMock.helpRequest.findUnique.mockImplementation(async ({ where }: any) => {
            const record = state.requests.get(where?.id);
            return record ? buildRequestResponse(record) : null;
        });

        prismaMock.helpRequest.update.mockImplementation(async ({ where, data }: any) => {
            const record = state.requests.get(where?.id);
            if (!record) return null;

            if (data?.status) {
                record.status = data.status;
            }
            if (data?.assignedHelperId !== undefined) {
                record.assignedHelperId = data.assignedHelperId;
            }
            if (data?.title !== undefined) record.title = data.title;
            if (data?.description !== undefined) record.description = data.description;
            if (data?.category !== undefined) record.category = data.category;
            if (data?.budget !== undefined) record.budget = data.budget;
            if (data?.isPaid !== undefined) record.isPaid = data.isPaid;
            if (data?.serviceRadiusMeters !== undefined) record.serviceRadiusMeters = data.serviceRadiusMeters;
            if (data?.location?.update) {
                record.location = {
                    ...(record.location ?? {}),
                    ...data.location.update,
                };
            }
            if (data?.location?.create) {
                record.location = {
                    id: `loc-${state.requestCounter}-${Date.now()}`,
                    ...data.location.create,
                };
                record.locationId = record.location.id;
            }

            record.updatedAt = new Date();
            return buildRequestResponse(record);
        });

        prismaMock.helpRequest.delete.mockImplementation(async ({ where }: any) => {
            const existed = state.requests.delete(where?.id);
            return existed ? { id: where.id } : null;
        });

        prismaMock.helpRequest.count.mockResolvedValue(0);
        prismaMock.helpRequest.findMany.mockResolvedValue([]);

        prismaMock.bid.findFirst.mockImplementation(async ({ where }: any) => {
            for (const bid of state.bids.values()) {
                if (bid.helpRequestId === where?.helpRequestId && bid.helperId === where?.helperId) {
                    return buildBidResponse(bid);
                }
            }
            return null;
        });

        prismaMock.bid.create.mockImplementation(async ({ data }: any) => {
            const id = `bid-${++state.bidCounter}`;
            const createdAt = new Date();
            const record = {
                id,
                helpRequestId: data.helpRequestId,
                helperId: data.helperId,
                message: data.message,
                amount: data.amount,
                status: "PENDING",
                createdAt,
                updatedAt: createdAt,
            };
            state.bids.set(id, record);
            return buildBidResponse(record);
        });

        prismaMock.bid.findUnique.mockImplementation(async ({ where }: any) => {
            const record = state.bids.get(where?.id);
            return record ? buildBidResponse(record) : null;
        });

        prismaMock.bid.updateMany.mockImplementation(async ({ where, data }: any) => {
            let count = 0;
            for (const bid of state.bids.values()) {
                if (
                    bid.helpRequestId === where?.helpRequestId &&
                    bid.status === where?.status &&
                    bid.id !== where?.id?.not
                ) {
                    bid.status = data.status;
                    bid.updatedAt = new Date();
                    count += 1;
                }
            }
            return { count };
        });

        prismaMock.bid.update.mockImplementation(async ({ where, data }: any) => {
            const record = state.bids.get(where?.id);
            if (!record) return null;

            if (data?.status !== undefined) {
                record.status = data.status;
            }
            if (data?.message !== undefined) record.message = data.message;
            if (data?.amount !== undefined) record.amount = data.amount;
            record.updatedAt = new Date();
            return buildBidResponse(record);
        });

        prismaMock.bid.delete.mockImplementation(async ({ where }: any) => {
            const existed = state.bids.delete(where?.id);
            return existed ? { id: where.id } : null;
        });

        prismaMock.bid.findMany.mockImplementation(async ({ where }: any) => {
            return Array.from(state.bids.values())
                .filter((bid) => {
                    if (where?.helpRequestId && bid.helpRequestId !== where.helpRequestId) {
                        return false;
                    }
                    if (where?.status && bid.status !== where.status) {
                        return false;
                    }
                    if (where?.id?.not && bid.id === where.id.not) {
                        return false;
                    }
                    return true;
                })
                .map(buildBidResponse);
        });

        prismaMock.$transaction.mockImplementation(async (fn: any) => {
            const tx = {
                bid: {
                    findMany: prismaMock.bid.findMany,
                    updateMany: prismaMock.bid.updateMany,
                    update: prismaMock.bid.update,
                },
                helpRequest: {
                    update: prismaMock.helpRequest.update,
                },
            };

            return fn(tx);
        });
    });

    const createRequest = async (token: string, title: string) => {
        const response = await request(app)
            .post("/api/requests")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title,
                description: `${title} description`,
                category: "FOOD",
                budget: 20,
                location: {
                    latitude: 27.7,
                    longitude: 85.3,
                    addressLine1: "2 Jalsitie",
                    city: "Helsinki",
                    country: "Finland",
                },
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        return response.body.data;
    };

    const placeBid = async (token: string, helpRequestId: string, amount: number, message: string) => {
        const response = await request(app)
            .post("/api/bids")
            .set("Authorization", `Bearer ${token}`)
            .send({ helpRequestId, amount, message });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        return response.body.data;
    };

    const acceptBid = async (token: string, bidId: string) => {
        const response = await request(app)
            .patch(`/api/bids/${bidId}/respond`)
            .set("Authorization", `Bearer ${token}`)
            .send({ status: "ACCEPTED" });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe("ACCEPTED");
        return response.body.data;
    };

    const getRequest = async (id: string) => {
        const response = await request(app).get(`/api/requests/${id}`);
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        return response.body.data;
    };

    const changeRequestStatus = async (token: string, id: string, status: string) => {
        const response = await request(app)
            .patch(`/api/requests/${id}/status`)
            .set("Authorization", `Bearer ${token}`)
            .send({ status });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe(status);
        return response.body.data;
    };

    const getNotifications = async (token: string) => {
        const response = await request(app)
            .get("/api/notifications")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        return response.body.data;
    };

    it("accepts a bid, assigns the request, completes it, and notifies the helper", async () => {
        const helpRequest = await createRequest(TEST_TOKENS.requester, "Need groceries");
        const bid = await placeBid(TEST_TOKENS.helperOne, helpRequest.id, 40, "I can help");

        await acceptBid(TEST_TOKENS.requester, bid.id);

        expect(conversationServiceMock.ensureConversationForRequestInTransaction).toHaveBeenCalled();

        const assignedRequest = await getRequest(helpRequest.id);
        expect(assignedRequest.status).toBe("ASSIGNED");
        expect(state.requests.get(helpRequest.id)?.assignedHelperId).toBe(USERS.helperOne.id);

        await changeRequestStatus(TEST_TOKENS.requester, helpRequest.id, "COMPLETED");

        const helperNotifications = await getNotifications(TEST_TOKENS.helperOne);
        expect(helperNotifications).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: "REQUEST_COMPLETED",
                    title: "Request marked as completed",
                    requestId: helpRequest.id,
                    userId: USERS.helperOne.id,
                }),
            ]),
        );
    });

    it("accepts another bid, cancels the assigned request, and notifies the helper", async () => {
        const helpRequest = await createRequest(TEST_TOKENS.requester, "Need medicine");
        const bid = await placeBid(TEST_TOKENS.helperTwo, helpRequest.id, 55, "I can do this");

        await acceptBid(TEST_TOKENS.requester, bid.id);

        const assignedRequest = await getRequest(helpRequest.id);
        expect(assignedRequest.status).toBe("ASSIGNED");
        expect(state.requests.get(helpRequest.id)?.assignedHelperId).toBe(USERS.helperTwo.id);

        await changeRequestStatus(TEST_TOKENS.requester, helpRequest.id, "CANCELLED");

        const helperNotifications = await getNotifications(TEST_TOKENS.helperTwo);
        expect(helperNotifications).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: "REQUEST_CANCELLED",
                    title: "Request was cancelled",
                    requestId: helpRequest.id,
                    userId: USERS.helperTwo.id,
                }),
            ]),
        );
    });
});
