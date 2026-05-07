import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeNext, makeReq, makeRes } from "./test-utils.js";

const { prismaMock } = vi.hoisted(() => ({
    prismaMock: {
        userModel: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
        },
        helpRequest: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        bid: {
            findFirst: vi.fn(),
            create: vi.fn(),
            findUnique: vi.fn(),
            updateMany: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        $transaction: vi.fn(),
        message: {
            findUnique: vi.fn(),
        },
    },
}));

const { notificationServiceMock } = vi.hoisted(() => ({
    notificationServiceMock: {
        createNotification: vi.fn(),
    },
}));

const { conversationServiceMock } = vi.hoisted(() => ({
    conversationServiceMock: {
        ensureConversationForRequestInTransaction: vi.fn(),
    },
}));

vi.mock("../../lib/prisma.js", () => ({
    prisma: prismaMock,
}));

vi.mock("../../services/notification.service.js", () => ({
    createNotification: notificationServiceMock.createNotification,
}));

vi.mock("../../services/conversation.service.js", () => ({
    ensureConversationForRequestInTransaction:
        conversationServiceMock.ensureConversationForRequestInTransaction,
}));

import { deleteBid, placeBid, respondToBid } from "../bid.controller.js";

describe("bid.controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        conversationServiceMock.ensureConversationForRequestInTransaction.mockResolvedValue({
            conversation: { id: "conv-1", members: [] },
            starterNote: "Bid accepted. You can now coordinate through chat.",
            systemMessageCreated: false,
            systemMessageId: null,
        });
        prismaMock.userModel.findUnique.mockResolvedValue({
            id: "requester-1",
            email: "requester@example.com",
        });
        prismaMock.userModel.findMany.mockResolvedValue([]);
        prismaMock.message.findUnique.mockResolvedValue(null);
    });

    it("placeBid: validates amount", async () => {
        const req = makeReq({ user: { userId: "helper-1" }, body: { helpRequestId: "req-1", message: "I can help", amount: 0 } });
        const res = makeRes();
        const next = makeNext();

        await placeBid(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "Bid amount must be greater than 0.", statusCode: 400 }));
    });

    it("placeBid: creates bid successfully", async () => {
        prismaMock.helpRequest.findUnique.mockResolvedValue({ id: "req-1", title: "Need help", status: "OPEN", requesterId: "requester-1" });
        prismaMock.bid.findFirst.mockResolvedValue(null);
        prismaMock.bid.create.mockResolvedValue({
            id: "bid-1",
            message: "I can help",
            amount: 40,
            status: "PENDING",
            helper: {
                id: "helper-1",
                email: "helper@example.com",
                profile: { fullName: "Helper One", dateOfBirth: null },
            },
            createdAt: new Date("2026-03-29T00:00:00.000Z"),
        });

        const req = makeReq({ user: { userId: "helper-1" }, body: { helpRequestId: "req-1", message: "I can help", amount: 40 } });
        const res = makeRes();
        const next = makeNext();

        await placeBid(req, res, next);

        expect(prismaMock.bid.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { message: "I can help", amount: 40, helperId: "helper-1", helpRequestId: "req-1" },
            }),
        );
        expect(notificationServiceMock.createNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: "requester-1",
                actorId: "helper-1",
                type: "BID_RECEIVED",
                title: "New bid received",
                requestId: "req-1",
                bidId: "bid-1",
            }),
        );
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: "Bid placed" }));
        expect(next).not.toHaveBeenCalled();
    });

    it("respondToBid: accepts bid and updates request state", async () => {
        const txHelpRequestUpdate = vi.fn().mockResolvedValue({
            id: "req-1",
            status: "ASSIGNED",
            assignedHelperId: "helper-1",
        });

        prismaMock.bid.findUnique
            .mockResolvedValueOnce({
                id: "bid-1",
                helpRequestId: "req-1",
                status: "PENDING",
                helperId: "helper-1",
                amount: 30,
                request: { requesterId: "requester-1", title: "Need help" },
            })
            .mockResolvedValueOnce({
                id: "bid-1",
                helpRequestId: "req-1",
                status: "ACCEPTED",
                message: "ok",
                amount: 30,
                createdAt: new Date("2026-03-29T00:00:00.000Z"),
                request: { requesterId: "requester-1", title: "Need help" },
                helper: {
                    id: "helper-1",
                    email: "helper@example.com",
                    profile: { fullName: "Helper One", dateOfBirth: null },
                },
            });
        prismaMock.$transaction.mockImplementation(async (fn: any) => {
            const tx = {
                bid: {
                    findMany: vi.fn().mockResolvedValue([
                        { id: "bid-2", helperId: "helper-2" },
                    ]),
                    updateMany: vi.fn(),
                    update: vi.fn().mockResolvedValue({
                        id: "bid-1",
                        status: "ACCEPTED",
                        message: "ok",
                        amount: 30,
                        createdAt: new Date("2026-03-29T00:00:00.000Z"),
                    }),
                },
                helpRequest: {
                    update: txHelpRequestUpdate,
                    findUnique: vi.fn().mockResolvedValue({
                        id: "req-1",
                        requesterId: "requester-1",
                        assignedHelperId: "helper-1",
                    }),
                },
                conversation: {
                    upsert: vi.fn().mockResolvedValue({ id: "conv-1" }),
                    findUnique: vi.fn().mockResolvedValue({
                        id: "conv-1",
                        request: {
                            id: "req-1",
                            title: "Need help",
                            status: "ASSIGNED",
                            requesterId: "requester-1",
                            assignedHelperId: "helper-1",
                        },
                        members: [],
                    }),
                },
                conversationMember: {
                    createMany: vi.fn().mockResolvedValue({ count: 2 }),
                },
            };
            return fn(tx);
        });

        const req = makeReq({
            user: { userId: "requester-1" },
            params: { bidId: "bid-1" },
            body: { status: "ACCEPTED" },
        });
        const res = makeRes();
        const next = makeNext();

        await respondToBid(req, res, next);

        expect(txHelpRequestUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: "req-1" },
                data: expect.objectContaining({
                    status: "ASSIGNED",
                    assignedHelperId: "helper-1",
                }),
            }),
        );

        expect(notificationServiceMock.createNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: "helper-1",
                actorId: "requester-1",
                type: "BID_ACCEPTED",
                title: "Your bid was accepted",
                requestId: "req-1",
                bidId: "bid-1",
            }),
        );
        expect(notificationServiceMock.createNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: "helper-2",
                actorId: "requester-1",
                type: "BID_REJECTED",
                title: "Your bid was rejected",
                requestId: "req-1",
                bidId: "bid-2",
            }),
        );
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, message: "Bid accepted", data: expect.objectContaining({ id: "bid-1" }) }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("respondToBid: rejects a bid and notifies the selected helper", async () => {
        prismaMock.bid.findUnique
            .mockResolvedValueOnce({
                id: "bid-1",
                helpRequestId: "req-1",
                status: "PENDING",
                helperId: "helper-1",
                amount: 25,
                request: { requesterId: "requester-1", title: "Need help" },
                helper: {
                    id: "helper-1",
                    email: "helper@example.com",
                    profile: { fullName: "Helper One", dateOfBirth: null },
                },
            })
            .mockResolvedValueOnce({
                id: "bid-1",
                helpRequestId: "req-1",
                status: "REJECTED",
                message: "ok",
                amount: 25,
                createdAt: new Date("2026-03-29T00:00:00.000Z"),
                request: { requesterId: "requester-1", title: "Need help" },
                helper: {
                    id: "helper-1",
                    email: "helper@example.com",
                    profile: { fullName: "Helper One", dateOfBirth: null },
                },
            });
        prismaMock.$transaction.mockImplementation(async (fn: any) => {
            const tx = {
                bid: {
                    findMany: vi.fn().mockResolvedValue([]),
                    updateMany: vi.fn(),
                    update: vi.fn().mockResolvedValue({
                        id: "bid-1",
                        status: "REJECTED",
                        message: "ok",
                        amount: 25,
                        createdAt: new Date("2026-03-29T00:00:00.000Z"),
                    }),
                },
                helpRequest: {
                    update: vi.fn(),
                    findUnique: vi.fn().mockResolvedValue({
                        id: "req-1",
                        requesterId: "requester-1",
                        assignedHelperId: "helper-1",
                    }),
                },
                conversation: {
                    upsert: vi.fn().mockResolvedValue({ id: "conv-1" }),
                    findUnique: vi.fn().mockResolvedValue({
                        id: "conv-1",
                        request: {
                            id: "req-1",
                            title: "Need help",
                            status: "ASSIGNED",
                            requesterId: "requester-1",
                            assignedHelperId: "helper-1",
                        },
                        members: [],
                    }),
                },
                conversationMember: {
                    createMany: vi.fn().mockResolvedValue({ count: 2 }),
                },
            };
            return fn(tx);
        });

        const req = makeReq({
            user: { userId: "requester-1" },
            params: { bidId: "bid-1" },
            body: { status: "REJECTED" },
        });
        const res = makeRes();
        const next = makeNext();

        await respondToBid(req, res, next);

        expect(notificationServiceMock.createNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: "helper-1",
                actorId: "requester-1",
                type: "BID_REJECTED",
                title: "Your bid was rejected",
                requestId: "req-1",
                bidId: "bid-1",
            }),
        );
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, message: "Bid rejected", data: expect.objectContaining({ id: "bid-1" }) }),
        );
        expect(next).not.toHaveBeenCalled();
    });
});
