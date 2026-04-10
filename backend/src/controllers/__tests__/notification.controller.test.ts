import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeNext, makeReq, makeRes } from "./test-utils.js";

const { notificationServiceMock } = vi.hoisted(() => ({
    notificationServiceMock: {
        getUserNotifications: vi.fn(),
        getUnreadNotificationCount: vi.fn(),
        markNotificationAsRead: vi.fn(),
        markAllNotificationsAsRead: vi.fn(),
        deleteNotification: vi.fn(),
    },
}));

vi.mock("../../services/notification.service.js", () => ({
    getUserNotifications: notificationServiceMock.getUserNotifications,
    getUnreadNotificationCount: notificationServiceMock.getUnreadNotificationCount,
    markNotificationAsRead: notificationServiceMock.markNotificationAsRead,
    markAllNotificationsAsRead: notificationServiceMock.markAllNotificationsAsRead,
    deleteNotification: notificationServiceMock.deleteNotification,
}));

import {
    listNotifications,
    readAllNotifications,
    readNotification,
    removeNotification,
    unreadNotificationCount,
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
});
