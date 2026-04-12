import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeNext, makeReq, makeRes } from "./test-utils.js";

const { conversationServiceMock } = vi.hoisted(() => ({
    conversationServiceMock: {
        createConversation: vi.fn(),
        getConversationByIdForUser: vi.fn(),
        getConversationByRequestIdForUser: vi.fn(),
        listConversationMessages: vi.fn(),
        listUserConversations: vi.fn(),
        markConversationMessagesAsRead: vi.fn(),
        sendConversationMessage: vi.fn(),
        softDeleteConversationMessage: vi.fn(),
    },
}));

vi.mock("../../services/conversation.service.js", () => ({
    createConversation: conversationServiceMock.createConversation,
    getConversationByIdForUser: conversationServiceMock.getConversationByIdForUser,
    getConversationByRequestIdForUser:
        conversationServiceMock.getConversationByRequestIdForUser,
    listConversationMessages: conversationServiceMock.listConversationMessages,
    listUserConversations: conversationServiceMock.listUserConversations,
    markConversationMessagesAsRead:
        conversationServiceMock.markConversationMessagesAsRead,
    sendConversationMessage: conversationServiceMock.sendConversationMessage,
    softDeleteConversationMessage: conversationServiceMock.softDeleteConversationMessage,
}));

import {
    ensureConversation,
    getConversationMessages,
    getMyConversations,
    postConversationMessage,
    removeConversationMessage,
} from "../conversation.controller.js";

describe("conversation.controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("postConversationMessage: returns unauthorized when user missing", async () => {
        const req = makeReq({ params: { conversationId: "conv-1" }, body: { content: "hi" } });
        const res = makeRes();
        const next = makeNext();

        await postConversationMessage(req, res, next);

        expect(conversationServiceMock.sendConversationMessage).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Unauthorized", statusCode: 401 })
        );
    });

    it("postConversationMessage: rejects whitespace-only message via zod", async () => {
        const req = makeReq({
            user: { userId: "user-1" },
            params: { conversationId: "conv-1" },
            body: { content: "   " },
        });
        const res = makeRes();
        const next = makeNext();

        await postConversationMessage(req, res, next);

        expect(conversationServiceMock.sendConversationMessage).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ statusCode: 400 })
        );
    });

    it("postConversationMessage: sends validated message", async () => {
        conversationServiceMock.sendConversationMessage.mockResolvedValue({ id: "msg-1" });

        const req = makeReq({
            user: { userId: "user-1" },
            params: { conversationId: "conv-1" },
            body: { content: "hello" },
        });
        const res = makeRes();
        const next = makeNext();

        await postConversationMessage(req, res, next);

        expect(conversationServiceMock.sendConversationMessage).toHaveBeenCalledWith({
            conversationId: "conv-1",
            senderId: "user-1",
            content: "hello",
        });
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Message sent",
                data: expect.objectContaining({ id: "msg-1" }),
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("getConversationMessages: rejects invalid pagination from query", async () => {
        const req = makeReq({
            user: { userId: "user-1" },
            params: { conversationId: "conv-1" },
            query: { page: "1", limit: "500" },
        });
        const res = makeRes();
        const next = makeNext();

        await getConversationMessages(req, res, next);

        expect(conversationServiceMock.listConversationMessages).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ statusCode: 400 })
        );
    });

    it("getMyConversations: returns paginated conversations", async () => {
        conversationServiceMock.listUserConversations.mockResolvedValue({
            conversations: [{ id: "conv-1" }],
            meta: { total: 1, page: 1, totalPages: 1, limit: 20 },
        });

        const req = makeReq({
            user: { userId: "user-1" },
            query: { page: "1", limit: "20" },
        });
        const res = makeRes();
        const next = makeNext();

        await getMyConversations(req, res, next);

        expect(conversationServiceMock.listUserConversations).toHaveBeenCalledWith({
            userId: "user-1",
            page: 1,
            limit: 20,
        });
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: [expect.objectContaining({ id: "conv-1" })],
                meta: expect.objectContaining({ total: 1 }),
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("removeConversationMessage: rejects missing messageId", async () => {
        const req = makeReq({
            user: { userId: "user-1" },
            params: { conversationId: "conv-1", messageId: "" },
        });
        const res = makeRes();
        const next = makeNext();

        await removeConversationMessage(req, res, next);

        expect(conversationServiceMock.softDeleteConversationMessage).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ statusCode: 400 })
        );
    });

    it("ensureConversation: creates or returns existing conversation", async () => {
        conversationServiceMock.createConversation.mockResolvedValue({ id: "conv-1" });

        const req = makeReq({
            user: { userId: "user-1" },
            params: { requestId: "req-1" },
        });
        const res = makeRes();
        const next = makeNext();

        await ensureConversation(req, res, next);

        expect(conversationServiceMock.createConversation).toHaveBeenCalledWith("req-1", "user-1");
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Conversation ready",
                data: expect.objectContaining({ id: "conv-1" }),
            })
        );
        expect(next).not.toHaveBeenCalled();
    });
});
