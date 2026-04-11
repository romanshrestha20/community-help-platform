import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { jwtMock, notificationServiceMock, pushTokenServiceMock } = vi.hoisted(() => ({
    jwtMock: {
        verifyAccessToken: vi.fn(),
    },
    notificationServiceMock: {
        getUserNotifications: vi.fn(),
        getUnreadNotificationCount: vi.fn(),
        markAllNotificationsAsRead: vi.fn(),
        markNotificationAsRead: vi.fn(),
        deleteNotification: vi.fn(),
    },
    pushTokenServiceMock: {
        upsertPushTokenForUser: vi.fn(),
        deletePushTokenForUser: vi.fn(),
    },
}));

vi.mock("../../utils/jwt.js", () => ({
    verifyAccessToken: jwtMock.verifyAccessToken,
}));

vi.mock("../../services/notification.service.js", () => ({
    getUserNotifications: notificationServiceMock.getUserNotifications,
    getUnreadNotificationCount: notificationServiceMock.getUnreadNotificationCount,
    markAllNotificationsAsRead: notificationServiceMock.markAllNotificationsAsRead,
    markNotificationAsRead: notificationServiceMock.markNotificationAsRead,
    deleteNotification: notificationServiceMock.deleteNotification,
}));

vi.mock("../../services/push-token.service.js", () => ({
    upsertPushTokenForUser: pushTokenServiceMock.upsertPushTokenForUser,
    deletePushTokenForUser: pushTokenServiceMock.deletePushTokenForUser,
}));

import app from "../../app.js";

describe("notification routes integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        jwtMock.verifyAccessToken.mockReturnValue({ userId: "user-1" });
    });

    it("GET /api/notifications returns 401 without auth header", async () => {
        const res = await request(app).get("/api/notifications");

        expect(res.status).toBe(401);
        expect(res.body).toEqual(
            expect.objectContaining({
                success: false,
                error: expect.objectContaining({ statusCode: 401 }),
            })
        );
        expect(notificationServiceMock.getUserNotifications).not.toHaveBeenCalled();
    });

    it("GET /api/notifications returns user notifications for valid token", async () => {
        notificationServiceMock.getUserNotifications.mockResolvedValue([
            { id: "notif-1", title: "Bid accepted" },
        ]);

        const res = await request(app)
            .get("/api/notifications")
            .set("Authorization", "Bearer valid-token");

        expect(jwtMock.verifyAccessToken).toHaveBeenCalledWith("valid-token");
        expect(notificationServiceMock.getUserNotifications).toHaveBeenCalledWith("user-1");
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({
                success: true,
                data: [expect.objectContaining({ id: "notif-1" })],
            })
        );
    });

    it("GET /api/notifications/unread-count returns unread count", async () => {
        notificationServiceMock.getUnreadNotificationCount.mockResolvedValue(4);

        const res = await request(app)
            .get("/api/notifications/unread-count")
            .set("Authorization", "Bearer valid-token");

        expect(notificationServiceMock.getUnreadNotificationCount).toHaveBeenCalledWith("user-1");
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({
                success: true,
                data: { count: 4 },
            })
        );
    });

    it("PATCH /api/notifications/read-all marks all as read", async () => {
        notificationServiceMock.markAllNotificationsAsRead.mockResolvedValue({ count: 2 });

        const res = await request(app)
            .patch("/api/notifications/read-all")
            .set("Authorization", "Bearer valid-token");

        expect(notificationServiceMock.markAllNotificationsAsRead).toHaveBeenCalledWith("user-1");
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({
                success: true,
                message: "All notifications marked as read",
            })
        );
    });

    it("PATCH /api/notifications/:id/read marks one notification as read", async () => {
        notificationServiceMock.markNotificationAsRead.mockResolvedValue({ count: 1 });

        const res = await request(app)
            .patch("/api/notifications/notif-1/read")
            .set("Authorization", "Bearer valid-token");

        expect(notificationServiceMock.markNotificationAsRead).toHaveBeenCalledWith(
            "notif-1",
            "user-1"
        );
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({
                success: true,
                message: "Notification marked as read",
            })
        );
    });

    it("DELETE /api/notifications/:id deletes a notification", async () => {
        notificationServiceMock.deleteNotification.mockResolvedValue({ count: 1 });

        const res = await request(app)
            .delete("/api/notifications/notif-1")
            .set("Authorization", "Bearer valid-token");

        expect(notificationServiceMock.deleteNotification).toHaveBeenCalledWith(
            "notif-1",
            "user-1"
        );
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({
                success: true,
                message: "Notification deleted",
            })
        );
    });

    it("POST /api/notifications/push-token registers a device token", async () => {
        pushTokenServiceMock.upsertPushTokenForUser.mockResolvedValue({
            id: "push-token-1",
            token: "ExponentPushToken[abc]",
        });

        const res = await request(app)
            .post("/api/notifications/push-token")
            .set("Authorization", "Bearer valid-token")
            .send({ token: "ExponentPushToken[abc]", platform: "ios" });

        expect(pushTokenServiceMock.upsertPushTokenForUser).toHaveBeenCalledWith({
            userId: "user-1",
            token: "ExponentPushToken[abc]",
            platform: "ios",
        });
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({
                success: true,
                message: "Push token registered",
            })
        );
    });

    it("DELETE /api/notifications/push-token unregisters a device token", async () => {
        pushTokenServiceMock.deletePushTokenForUser.mockResolvedValue({ count: 1 });

        const res = await request(app)
            .delete("/api/notifications/push-token")
            .set("Authorization", "Bearer valid-token")
            .send({ token: "ExponentPushToken[abc]" });

        expect(pushTokenServiceMock.deletePushTokenForUser).toHaveBeenCalledWith(
            "user-1",
            "ExponentPushToken[abc]"
        );
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({
                success: true,
                message: "Push token removed",
            })
        );
    });
});
