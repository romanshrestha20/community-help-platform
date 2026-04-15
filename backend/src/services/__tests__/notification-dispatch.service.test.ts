import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
    prismaMock: {
        notification: {
            findMany: vi.fn(),
        },
    },
}));

const { pushTokenServiceMock } = vi.hoisted(() => ({
    pushTokenServiceMock: {
        getPushTokensForUser: vi.fn(),
    },
}));

const { preferenceServiceMock } = vi.hoisted(() => ({
    preferenceServiceMock: {
        getNotificationPreferencesForUser: vi.fn(),
        isNotificationTypeEnabled: vi.fn(),
        filterNotificationTypesByPreferences: vi.fn(),
    },
}));

const { expoPushServiceMock } = vi.hoisted(() => ({
    expoPushServiceMock: {
        sendExpoPushMessages: vi.fn(),
    },
}));

vi.mock("../../lib/prisma.js", () => ({
    prisma: prismaMock,
}));

vi.mock("../push-token.service.js", () => ({
    getPushTokensForUser: pushTokenServiceMock.getPushTokensForUser,
}));

vi.mock("../notification-preference.service.js", () => ({
    getNotificationPreferencesForUser:
        preferenceServiceMock.getNotificationPreferencesForUser,
    isNotificationTypeEnabled: preferenceServiceMock.isNotificationTypeEnabled,
    filterNotificationTypesByPreferences:
        preferenceServiceMock.filterNotificationTypesByPreferences,
}));

vi.mock("../expo-push.service.js", () => ({
    sendExpoPushMessages: expoPushServiceMock.sendExpoPushMessages,
}));

import {
    dispatchNotificationPush,
    resolveNotificationRoute,
} from "../notification-dispatch.service.js";

describe("notification-dispatch.service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("resolveNotificationRoute: maps message notifications to the conversation route", () => {
        const route = resolveNotificationRoute({
            id: "notif-1",
            userId: "user-1",
            type: "MESSAGE_RECEIVED",
            title: "New message",
            body: "Hello",
            conversationId: "conv-1",
        });

        expect(route).toBe("/messages/chat?conversationId=conv-1");
    });

    it("dispatchNotificationPush: does not send when category is disabled", async () => {
        preferenceServiceMock.getNotificationPreferencesForUser.mockResolvedValue({
            pushEnabled: true,
            messagesEnabled: false,
            bidsEnabled: true,
            requestUpdatesEnabled: true,
            savedRequestsEnabled: false,
        });
        preferenceServiceMock.isNotificationTypeEnabled.mockReturnValue(false);

        await dispatchNotificationPush({
            id: "notif-1",
            userId: "user-1",
            type: "MESSAGE_RECEIVED",
            title: "New message",
            body: "Hello",
            conversationId: "conv-1",
        });

        expect(pushTokenServiceMock.getPushTokensForUser).not.toHaveBeenCalled();
        expect(expoPushServiceMock.sendExpoPushMessages).not.toHaveBeenCalled();
    });

    it("dispatchNotificationPush: sends Expo messages with filtered unread badge count", async () => {
        preferenceServiceMock.getNotificationPreferencesForUser.mockResolvedValue({
            pushEnabled: true,
            messagesEnabled: true,
            bidsEnabled: true,
            requestUpdatesEnabled: true,
            savedRequestsEnabled: false,
        });
        preferenceServiceMock.isNotificationTypeEnabled.mockReturnValue(true);
        pushTokenServiceMock.getPushTokensForUser.mockResolvedValue([
            { token: "ExponentPushToken[abc]" },
        ]);
        prismaMock.notification.findMany.mockResolvedValue([
            { type: "MESSAGE_RECEIVED" },
            { type: "REVIEW_RECEIVED" },
            { type: "BID_RECEIVED" },
        ]);
        preferenceServiceMock.filterNotificationTypesByPreferences.mockReturnValue([
            "MESSAGE_RECEIVED",
            "BID_RECEIVED",
        ]);

        await dispatchNotificationPush({
            id: "notif-1",
            userId: "user-1",
            type: "MESSAGE_RECEIVED",
            title: "New message",
            body: "Hello",
            conversationId: "conv-1",
        });

        expect(expoPushServiceMock.sendExpoPushMessages).toHaveBeenCalledWith([
            expect.objectContaining({
                to: "ExponentPushToken[abc]",
                title: "New message",
                badge: 2,
                data: expect.objectContaining({
                    notificationId: "notif-1",
                    type: "MESSAGE_RECEIVED",
                    route: "/messages/chat?conversationId=conv-1",
                }),
            }),
        ]);
    });
});
