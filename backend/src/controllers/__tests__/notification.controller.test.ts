import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeNext, makeReq, makeRes } from "./test-utils.js";

const { notificationServiceMock } = vi.hoisted(() => ({
    notificationServiceMock: {
        getUserNotifications: vi.fn(),
        getUnreadNotificationCount: vi.fn(),
        markNotificationAsRead: vi.fn(),
        markNotificationAsUnread: vi.fn(),
        markAllNotificationsAsRead: vi.fn(),
        deleteNotification: vi.fn(),
        broadcastNotificationRead: vi.fn(),
        broadcastNotificationUnread: vi.fn(),
        broadcastNotificationReadAll: vi.fn(),
        broadcastNotificationDeleted: vi.fn(),
    },
}));

const { notificationPreferenceServiceMock } = vi.hoisted(() => ({
    notificationPreferenceServiceMock: {
        getNotificationPreferencesForUser: vi.fn(),
        updateNotificationPreferencesForUser: vi.fn(),
    },
}));

const { pushTokenServiceMock } = vi.hoisted(() => ({
    pushTokenServiceMock: {
        upsertPushTokenForUser: vi.fn(),
        deletePushTokenForUser: vi.fn(),
    },
}));

vi.mock("../../services/notification.service.js", () => ({
    getUserNotifications: notificationServiceMock.getUserNotifications,
    getUnreadNotificationCount: notificationServiceMock.getUnreadNotificationCount,
    markNotificationAsRead: notificationServiceMock.markNotificationAsRead,
    markNotificationAsUnread: notificationServiceMock.markNotificationAsUnread,
    markAllNotificationsAsRead: notificationServiceMock.markAllNotificationsAsRead,
    deleteNotification: notificationServiceMock.deleteNotification,
    broadcastNotificationRead: notificationServiceMock.broadcastNotificationRead,
    broadcastNotificationUnread: notificationServiceMock.broadcastNotificationUnread,
    broadcastNotificationReadAll: notificationServiceMock.broadcastNotificationReadAll,
    broadcastNotificationDeleted: notificationServiceMock.broadcastNotificationDeleted,
}));

vi.mock("../../services/notification-preference.service.js", () => ({
    getNotificationPreferencesForUser:
        notificationPreferenceServiceMock.getNotificationPreferencesForUser,
    updateNotificationPreferencesForUser:
        notificationPreferenceServiceMock.updateNotificationPreferencesForUser,
}));

vi.mock("../../services/push-token.service.js", () => ({
    upsertPushTokenForUser: pushTokenServiceMock.upsertPushTokenForUser,
    deletePushTokenForUser: pushTokenServiceMock.deletePushTokenForUser,
}));

import {
    getNotificationPreferences,
    listNotifications,
    readAllNotifications,
    readNotification,
    removeNotification,
    registerPushToken,
    unreadNotification,
    unregisterPushToken,
    unreadNotificationCount,
    updateNotificationPreferences,
} from "../notification.controller.js";

describe("notification.controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("listNotifications: returns unauthorized when user is missing", async () => {
        const req = makeReq();
        const res = makeRes();
        const next = makeNext();

        await listNotifications(req, res, next);

        expect(notificationServiceMock.getUserNotifications).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Unauthorized", statusCode: 401 })
        );
    });

    it("listNotifications: returns notifications for authenticated user", async () => {
        notificationServiceMock.getUserNotifications.mockResolvedValue([
            { id: "notif-1", title: "Bid accepted" },
        ]);

        const req = makeReq({ user: { userId: "user-1" } });
        const res = makeRes();
        const next = makeNext();

        await listNotifications(req, res, next);

        expect(notificationServiceMock.getUserNotifications).toHaveBeenCalledWith("user-1");
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: [expect.objectContaining({ id: "notif-1" })],
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("unreadNotificationCount: returns unread count", async () => {
        notificationServiceMock.getUnreadNotificationCount.mockResolvedValue(3);

        const req = makeReq({ user: { userId: "user-1" } });
        const res = makeRes();
        const next = makeNext();

        await unreadNotificationCount(req, res, next);

        expect(notificationServiceMock.getUnreadNotificationCount).toHaveBeenCalledWith("user-1");
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, data: { count: 3 } })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("getNotificationPreferences: returns preferences for authenticated user", async () => {
        notificationPreferenceServiceMock.getNotificationPreferencesForUser.mockResolvedValue({
            pushEnabled: true,
            messagesEnabled: true,
            bidsEnabled: true,
            requestUpdatesEnabled: true,
            savedRequestsEnabled: false,
            nearbyAlertsEnabled: false,
            nearbyAlertRadiusKm: 5,
            nearbyAlertsUrgentOnly: false,
            nearbyAlertCategorySlugs: [],
        });

        const req = makeReq({ user: { userId: "user-1" } });
        const res = makeRes();
        const next = makeNext();

        await getNotificationPreferences(req, res, next);

        expect(
            notificationPreferenceServiceMock.getNotificationPreferencesForUser
        ).toHaveBeenCalledWith("user-1");
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({ pushEnabled: true }),
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("updateNotificationPreferences: persists preference changes", async () => {
        notificationPreferenceServiceMock.updateNotificationPreferencesForUser.mockResolvedValue({
            pushEnabled: true,
            messagesEnabled: false,
            bidsEnabled: true,
            requestUpdatesEnabled: true,
            savedRequestsEnabled: false,
            nearbyAlertsEnabled: false,
            nearbyAlertRadiusKm: 5,
            nearbyAlertsUrgentOnly: false,
            nearbyAlertCategorySlugs: [],
        });

        const req = makeReq({
            user: { userId: "user-1" },
            body: { messagesEnabled: false },
        });
        const res = makeRes();
        const next = makeNext();

        await updateNotificationPreferences(req, res, next);

        expect(
            notificationPreferenceServiceMock.updateNotificationPreferencesForUser
        ).toHaveBeenCalledWith("user-1", { messagesEnabled: false });
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Notification preferences updated",
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("readNotification: rejects missing notification id", async () => {
        const req = makeReq({ user: { userId: "user-1" }, params: {} });
        const res = makeRes();
        const next = makeNext();

        await readNotification(req, res, next);

        expect(notificationServiceMock.markNotificationAsRead).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Notification ID is required",
                statusCode: 400,
            })
        );
    });

    it("readNotification: marks target notification as read", async () => {
        notificationServiceMock.markNotificationAsRead.mockResolvedValue({ count: 1 });

        const req = makeReq({
            user: { userId: "user-1" },
            params: { id: "notif-1" },
        });
        const res = makeRes();
        const next = makeNext();

        await readNotification(req, res, next);

        expect(notificationServiceMock.markNotificationAsRead).toHaveBeenCalledWith(
            "notif-1",
            "user-1"
        );
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Notification marked as read",
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("unreadNotification: marks target notification as unread", async () => {
        notificationServiceMock.markNotificationAsUnread.mockResolvedValue({ count: 1 });

        const req = makeReq({
            user: { userId: "user-1" },
            params: { id: "notif-1" },
        });
        const res = makeRes();
        const next = makeNext();

        await unreadNotification(req, res, next);

        expect(notificationServiceMock.markNotificationAsUnread).toHaveBeenCalledWith(
            "notif-1",
            "user-1"
        );
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Notification marked as unread",
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("readAllNotifications: marks all as read for current user", async () => {
        notificationServiceMock.markAllNotificationsAsRead.mockResolvedValue({ count: 2 });

        const req = makeReq({ user: { userId: "user-1" } });
        const res = makeRes();
        const next = makeNext();

        await readAllNotifications(req, res, next);

        expect(notificationServiceMock.markAllNotificationsAsRead).toHaveBeenCalledWith("user-1");
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "All notifications marked as read",
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("removeNotification: rejects array param with empty first value", async () => {
        const req = makeReq({ user: { userId: "user-1" } });
        (req.params as unknown as { id: string[] }).id = [""];

        const res = makeRes();
        const next = makeNext();

        await removeNotification(req, res, next);

        expect(notificationServiceMock.deleteNotification).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Notification ID is required",
                statusCode: 400,
            })
        );
    });

    it("removeNotification: deletes notification for user", async () => {
        notificationServiceMock.deleteNotification.mockResolvedValue({ count: 1 });

        const req = makeReq({
            user: { userId: "user-1" },
            params: { id: "notif-1" },
        });
        const res = makeRes();
        const next = makeNext();

        await removeNotification(req, res, next);

        expect(notificationServiceMock.deleteNotification).toHaveBeenCalledWith(
            "notif-1",
            "user-1"
        );
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, message: "Notification deleted" })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("registerPushToken: stores push token for authenticated user", async () => {
        pushTokenServiceMock.upsertPushTokenForUser.mockResolvedValue({
            id: "push-token-1",
            token: "ExponentPushToken[abc]",
        });

        const req = makeReq({
            user: { userId: "user-1" },
            body: { token: "ExponentPushToken[abc]", platform: "ios" },
        });
        const res = makeRes();
        const next = makeNext();

        await registerPushToken(req, res, next);

        expect(pushTokenServiceMock.upsertPushTokenForUser).toHaveBeenCalledWith({
            userId: "user-1",
            token: "ExponentPushToken[abc]",
            platform: "ios",
        });
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, message: "Push token registered" })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("unregisterPushToken: removes push token for authenticated user", async () => {
        pushTokenServiceMock.deletePushTokenForUser.mockResolvedValue({ count: 1 });

        const req = makeReq({
            user: { userId: "user-1" },
            body: { token: "ExponentPushToken[abc]" },
        });
        const res = makeRes();
        const next = makeNext();

        await unregisterPushToken(req, res, next);

        expect(pushTokenServiceMock.deletePushTokenForUser).toHaveBeenCalledWith(
            "user-1",
            "ExponentPushToken[abc]"
        );
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, message: "Push token removed" })
        );
        expect(next).not.toHaveBeenCalled();
    });
});
