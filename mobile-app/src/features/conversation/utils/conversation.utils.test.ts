import { describe, it, expect } from "vitest";
import { getOtherParticipant, getLastMessagePreview, isValidConversation } from "./conversation.utils";
import type { Conversation } from "../types/conversation.type";

const baseConversation: Conversation = {
    id: "conv-1",
    request: {
        id: "req-1",
        title: "Help needed",
        status: "ASSIGNED",
        description: "desc",
        requesterId: "user-1",
        assignedHelperId: "user-2",
    },
    members: [
        { id: "user-1", email: "a@a.com", fullName: "A", avatarUrl: null, joinedAt: "2024-01-01T00:00:00Z" },
        { id: "user-2", email: "b@b.com", fullName: "B", avatarUrl: null, joinedAt: "2024-01-01T00:00:00Z" },
    ],
    lastMessage: {
        id: "msg-1",
        content: "Hello!",
        type: "TEXT",
        isRead: false,
        createdAt: "2024-01-01T00:00:00Z",
        sender: { id: "user-2", email: "b@b.com", fullName: "B", avatarUrl: null },
        images: [],
    },
    unreadCount: 2,
    starterNote: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
};

describe("conversation.utils", () => {
    it("getOtherParticipant returns the other user", () => {
        expect(getOtherParticipant(baseConversation, "user-1")?.id).toBe("user-2");
        expect(getOtherParticipant(baseConversation, "user-2")?.id).toBe("user-1");
    });

    it("getLastMessagePreview returns correct preview", () => {
        expect(getLastMessagePreview(baseConversation, "user-1")).toBe("Hello!");
        expect(getLastMessagePreview(baseConversation, "user-2")).toBe("You: Hello!");
    });

    it("getLastMessagePreview falls back to starterNote", () => {
        const conv: Conversation = { ...baseConversation, lastMessage: null, starterNote: "Start chatting!" };
        expect(getLastMessagePreview(conv, "user-1")).toBe("Start chatting!");
    });

    it("getLastMessagePreview falls back to default", () => {
        const conv: Conversation = { ...baseConversation, lastMessage: null, starterNote: null };
        expect(getLastMessagePreview(conv, "user-1")).toBe("No messages yet");
    });

    it("isValidConversation returns true for valid shape", () => {
        expect(isValidConversation(baseConversation)).toBe(true);
    });

    it("isValidConversation returns false for invalid shape", () => {
        expect(isValidConversation({})).toBe(false);
        expect(isValidConversation({ id: 1 })).toBe(false);
        expect(isValidConversation({ id: "x", members: [], unreadCount: 0, request: {} })).toBe(false);
    });
});
