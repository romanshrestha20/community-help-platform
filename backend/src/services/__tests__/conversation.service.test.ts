import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
    prismaMock: {
        $transaction: vi.fn(),
        helpRequest: {
            findUnique: vi.fn(),
        },
        conversation: {
            upsert: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        conversationMember: {
            createMany: vi.fn(),
            findUnique: vi.fn(),
            count: vi.fn(),
            findMany: vi.fn(),
        },
        message: {
            create: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn(),
            updateMany: vi.fn(),
            groupBy: vi.fn(),
            update: vi.fn(),
        },
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
    ensureConversationForRequest,
    listConversationMessages,
    markConversationMessagesAsRead,
    sendConversationMessage,
    softDeleteConversationMessage,
} from "../conversation.service.js";

describe("conversation.service", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        prismaMock.$transaction.mockImplementation(async (arg: any) => {
            if (typeof arg === "function") {
                return arg(prismaMock);
            }

            return Promise.all(arg);
        });
    });

    it("ensureConversationForRequest: rejects when request does not exist", async () => {
        prismaMock.helpRequest.findUnique.mockResolvedValue(null);

        await expect(
            ensureConversationForRequest({ requestId: "req-1" })
        ).rejects.toMatchObject({
            message: "Help request not found",
            statusCode: 404,
        });
    });

    it("ensureConversationForRequest: rejects when helper not assigned", async () => {
        prismaMock.helpRequest.findUnique.mockResolvedValue({
            id: "req-1",
            requesterId: "requester-1",
            assignedHelperId: null,
        });

        await expect(
            ensureConversationForRequest({ requestId: "req-1" })
        ).rejects.toMatchObject({
            message: "Cannot create conversation until a helper is assigned",
            statusCode: 400,
        });
    });

    it("ensureConversationForRequest: upserts conversation and members", async () => {
        prismaMock.helpRequest.findUnique.mockResolvedValue({
            id: "req-1",
            requesterId: "requester-1",
            assignedHelperId: "helper-1",
        });

        prismaMock.conversation.upsert.mockResolvedValue({
            id: "conv-1",
            requestId: "req-1",
            request: { id: "req-1" },
            members: [],
        });

        prismaMock.conversation.findUnique.mockResolvedValue({
            id: "conv-1",
            requestId: "req-1",
            request: { id: "req-1", title: "Need help", status: "ASSIGNED" },
            members: [],
        });

        const result = await ensureConversationForRequest({ requestId: "req-1" });

        expect(prismaMock.conversation.upsert).toHaveBeenCalledWith(
            expect.objectContaining({ where: { requestId: "req-1" } })
        );
        expect(prismaMock.conversationMember.createMany).toHaveBeenCalledWith({
            data: [
                { conversationId: "conv-1", userId: "requester-1" },
                { conversationId: "conv-1", userId: "helper-1" },
            ],
            skipDuplicates: true,
        });
        expect(result).toEqual(expect.objectContaining({ id: "conv-1" }));
    });

    it("sendConversationMessage: rejects empty or whitespace content", async () => {
        await expect(
            sendConversationMessage({
                conversationId: "conv-1",
                senderId: "user-1",
                content: "   ",
            })
        ).rejects.toMatchObject({
            message: "Message content is required",
            statusCode: 400,
        });
    });

    it("sendConversationMessage: rejects overly long content", async () => {
        await expect(
            sendConversationMessage({
                conversationId: "conv-1",
                senderId: "user-1",
                content: "a".repeat(1001),
            })
        ).rejects.toMatchObject({
            message: "Message cannot exceed 1000 characters",
            statusCode: 400,
        });
    });

    it("sendConversationMessage: rejects when conversation does not exist", async () => {
        prismaMock.conversation.findUnique.mockResolvedValue(null);

        await expect(
            sendConversationMessage({
                conversationId: "conv-1",
                senderId: "user-1",
                content: "hello",
            })
        ).rejects.toMatchObject({
            message: "Conversation not found",
            statusCode: 404,
        });
    });

    it("sendConversationMessage: rejects non-member sender", async () => {
        prismaMock.conversation.findUnique.mockResolvedValue({
            id: "conv-1",
            request: { id: "req-1", title: "Need help", status: "ASSIGNED" },
            members: [{ userId: "user-2" }, { userId: "user-3" }],
        });

        await expect(
            sendConversationMessage({
                conversationId: "conv-1",
                senderId: "user-1",
                content: "hello",
            })
        ).rejects.toMatchObject({
            message: "Forbidden",
            statusCode: 403,
        });
    });

    it("sendConversationMessage: rejects when request is not ASSIGNED", async () => {
        prismaMock.conversation.findUnique.mockResolvedValue({
            id: "conv-1",
            request: { id: "req-1", title: "Need help", status: "OPEN" },
            members: [{ userId: "user-1" }, { userId: "user-2" }],
        });

        await expect(
            sendConversationMessage({
                conversationId: "conv-1",
                senderId: "user-1",
                content: "hello",
            })
        ).rejects.toMatchObject({
            message: "Messages are only allowed while request is ASSIGNED",
            statusCode: 400,
        });
    });

    it("sendConversationMessage: creates unread TEXT message, bumps conversation activity, and notifies recipient", async () => {
        prismaMock.conversation.findUnique.mockResolvedValue({
            id: "conv-1",
            request: { id: "req-1", title: "Need help", status: "ASSIGNED" },
            members: [{ userId: "user-1" }, { userId: "user-2" }],
        });

        prismaMock.message.create.mockResolvedValue({ id: "msg-1" });
        prismaMock.message.findUnique.mockResolvedValue({ id: "msg-1", content: "hello" });
        prismaMock.conversation.update.mockResolvedValue({ id: "conv-1" });

        const result = await sendConversationMessage({
            conversationId: "conv-1",
            senderId: "user-1",
            content: " hello ",
        });

        expect(prismaMock.message.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    conversationId: "conv-1",
                    senderId: "user-1",
                    content: "hello",
                    type: "TEXT",
                    isRead: false,
                }),
            })
        );
        expect(prismaMock.conversation.update).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: "conv-1" } })
        );
        expect(notificationServiceMock.createNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: "user-2",
                actorId: "user-1",
                type: "MESSAGE_RECEIVED",
                conversationId: "conv-1",
                messageId: "msg-1",
            })
        );
        expect(result).toEqual(expect.objectContaining({ id: "msg-1" }));
    });

    it("listConversationMessages: enforces membership", async () => {
        prismaMock.conversationMember.findUnique.mockResolvedValue(null);

        await expect(
            listConversationMessages({
                conversationId: "conv-1",
                userId: "user-1",
            })
        ).rejects.toMatchObject({
            message: "Conversation not found",
            statusCode: 404,
        });
    });

    it("listConversationMessages: returns ascending paginated messages", async () => {
        prismaMock.conversationMember.findUnique.mockResolvedValue({ id: "member-1" });
        prismaMock.message.count.mockResolvedValue(25);
        prismaMock.message.findMany.mockResolvedValue([{ id: "msg-1" }, { id: "msg-2" }]);

        const result = await listConversationMessages({
            conversationId: "conv-1",
            userId: "user-1",
            page: 2,
            limit: 10,
        });

        expect(prismaMock.message.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { conversationId: "conv-1", deletedAt: null },
                orderBy: { createdAt: "asc" },
                skip: 10,
                take: 10,
            })
        );
        expect(result.meta).toEqual({ total: 25, page: 2, totalPages: 3, limit: 10 });
    });

    it("markConversationMessagesAsRead: marks only incoming unread messages", async () => {
        prismaMock.conversationMember.findUnique.mockResolvedValue({ id: "member-1" });
        prismaMock.message.updateMany.mockResolvedValue({ count: 2 });

        await markConversationMessagesAsRead("conv-1", "user-1");

        expect(prismaMock.message.updateMany).toHaveBeenCalledWith({
            where: {
                conversationId: "conv-1",
                deletedAt: null,
                isRead: false,
                senderId: { not: "user-1" },
            },
            data: { isRead: true },
        });
    });

    it("softDeleteConversationMessage: rejects deleting another user's message", async () => {
        prismaMock.conversationMember.findUnique.mockResolvedValue({ id: "member-1" });
        prismaMock.message.findUnique.mockResolvedValue({
            id: "msg-1",
            conversationId: "conv-1",
            senderId: "user-2",
            deletedAt: null,
        });

        await expect(
            softDeleteConversationMessage("conv-1", "msg-1", "user-1")
        ).rejects.toMatchObject({
            message: "Forbidden",
            statusCode: 403,
        });
    });

    it("softDeleteConversationMessage: sets deletedAt for sender-owned message", async () => {
        prismaMock.conversationMember.findUnique.mockResolvedValue({ id: "member-1" });
        prismaMock.message.findUnique.mockResolvedValue({
            id: "msg-1",
            conversationId: "conv-1",
            senderId: "user-1",
            deletedAt: null,
        });
        prismaMock.message.update.mockResolvedValue({ id: "msg-1" });

        await softDeleteConversationMessage("conv-1", "msg-1", "user-1");

        expect(prismaMock.message.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: "msg-1" },
                data: { deletedAt: expect.any(Date) },
            })
        );
    });
});
