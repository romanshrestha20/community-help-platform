import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { jwtMock, conversationServiceMock, prismaMock } = vi.hoisted(() => ({
    jwtMock: {
        verifyAccessToken: vi.fn(),
    },
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
    prismaMock: {
        userModel: {
            findUnique: vi.fn(),
        },
    },
}));

vi.mock("../../utils/jwt.js", () => ({
    verifyAccessToken: jwtMock.verifyAccessToken,
}));

vi.mock("../../lib/prisma.js", () => ({
    prisma: prismaMock,
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

import AppError from "../../utils/appError.js";
import app from "../../app.js";

describe("conversation routes integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        jwtMock.verifyAccessToken.mockReturnValue({ userId: "user-1", tokenVersion: 0 });
        prismaMock.userModel.findUnique.mockImplementation(async ({ select }: any) => {
            if (select?.tokenVersion) {
                return { tokenVersion: 0 };
            }
            if (select?.isEmailVerified || select?.isVerified) {
                return { isEmailVerified: true, isVerified: true };
            }
            return { id: "user-1" };
        });
    });

    it("GET /api/conversations returns 401 without auth header", async () => {
        const res = await request(app).get("/api/conversations");

        expect(res.status).toBe(401);
        expect(res.body).toEqual(
            expect.objectContaining({
                success: false,
                error: expect.objectContaining({ statusCode: 401 }),
            })
        );
    });

    it("GET /api/conversations returns paginated list", async () => {
        conversationServiceMock.listUserConversations.mockResolvedValue({
            conversations: [{ id: "conv-1" }],
            meta: { total: 1, page: 1, totalPages: 1, limit: 20 },
        });

        const res = await request(app)
            .get("/api/conversations?page=1&limit=20")
            .set("Authorization", "Bearer valid-token");

        expect(jwtMock.verifyAccessToken).toHaveBeenCalledWith("valid-token");
        expect(conversationServiceMock.listUserConversations).toHaveBeenCalledWith({
            userId: "user-1",
            page: 1,
            limit: 20,
        });
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({
                success: true,
                data: [expect.objectContaining({ id: "conv-1" })],
                meta: expect.objectContaining({ total: 1 }),
            })
        );
    });

    it("GET /api/conversations/:id/messages rejects invalid limit via zod", async () => {
        const res = await request(app)
            .get("/api/conversations/conv-1/messages?limit=100")
            .set("Authorization", "Bearer valid-token");

        expect(conversationServiceMock.listConversationMessages).not.toHaveBeenCalled();
        expect(res.status).toBe(400);
        expect(res.body).toEqual(
            expect.objectContaining({
                success: false,
                error: expect.objectContaining({ statusCode: 400 }),
            })
        );
    });

    it("POST /api/conversations/:id/messages rejects whitespace-only content via zod", async () => {
        const res = await request(app)
            .post("/api/conversations/conv-1/messages")
            .set("Authorization", "Bearer valid-token")
            .send({ content: "   " });

        expect(conversationServiceMock.sendConversationMessage).not.toHaveBeenCalled();
        expect(res.status).toBe(400);
        expect(res.body).toEqual(
            expect.objectContaining({
                success: false,
                error: expect.objectContaining({ statusCode: 400 }),
            })
        );
    });

    it("POST /api/conversations/:id/messages sends message on valid payload", async () => {
        conversationServiceMock.sendConversationMessage.mockResolvedValue({ id: "msg-1" });

        const res = await request(app)
            .post("/api/conversations/conv-1/messages")
            .set("Authorization", "Bearer valid-token")
            .send({ content: "hello" });

        expect(conversationServiceMock.sendConversationMessage).toHaveBeenCalledWith({
            conversationId: "conv-1",
            senderId: "user-1",
            content: "hello",
        });
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({
                success: true,
                message: "Message sent",
            })
        );
    });

    it("POST /api/conversations/:id/messages returns policy error from service", async () => {
        conversationServiceMock.sendConversationMessage.mockRejectedValue(
            new AppError("Messages are only allowed while request is ASSIGNED", 400)
        );

        const res = await request(app)
            .post("/api/conversations/conv-1/messages")
            .set("Authorization", "Bearer valid-token")
            .send({ content: "hello" });

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
            expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    statusCode: 400,
                    message: "Messages are only allowed while request is ASSIGNED",
                }),
            })
        );
    });
});
