import { prisma } from "../lib/prisma.js";
import { NotificationType, Prisma } from "../../generated//prisma/client.js";
import { dispatchNotificationPush } from "./notification-dispatch.service.js";
import { getIO } from "../lib/socket.js";

type CreateNotificationInput = {
    userId: string;
    actorId?: string | null;
    type: NotificationType;
    title: string;
    body: string;
    requestId?: string | null;
    bidId?: string | null;
    conversationId?: string | null;
    messageId?: string | null;
    reviewId?: string | null;
    data?: Prisma.InputJsonValue;
};

type NotificationRealtimeEvent = {
    action: "created" | "read" | "unread" | "read_all" | "deleted";
    notificationId?: string;
    unreadCount: number;
    notification?: unknown;
};

const emitNotificationRealtimeEvent = async (
    userId: string,
    event: NotificationRealtimeEvent
) => {
    try {
        const io = getIO();
        io.to(`user:${userId}`).emit("notification:event", event);
    } catch (error) {
        console.warn("Notification realtime emit skipped:", error);
    }
};

export const createNotification = async (input: CreateNotificationInput) => {
    const notification = await prisma.notification.create({
        data: {
            userId: input.userId,
            actorId: input.actorId,
            type: input.type,
            title: input.title,
            body: input.body,
            requestId: input.requestId,
            bidId: input.bidId,
            conversationId: input.conversationId,
            messageId: input.messageId,
            reviewId: input.reviewId,
            data: input.data,
        },
    });

    void dispatchNotificationPush(notification).catch((error) => {
        console.warn("Notification push dispatch failed:", error);
    });

    const unreadCount = await getUnreadNotificationCount(input.userId);
    await emitNotificationRealtimeEvent(input.userId, {
        action: "created",
        notificationId: notification.id,
        unreadCount,
        notification,
    });

    return notification;
}


export const getUserNotifications = async (userId: string) => {
    return prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
            actor: {
                select: {
                    id: true,
                    email: true,
                    profile: {
                        select: {
                            fullName: true,
                            avatarUrl: true,
                        },
                    },
                },
            },
            request: {
                select: {
                    id: true,
                    title: true,
                    status: true,
                },
            },
            bid: {
                select: {
                    id: true,
                    amount: true,
                    status: true,
                },
            },
            conversation: {
                select: {
                    id: true,
                },
            },
            message: {
                select: {
                    id: true,
                    content: true,
                    type: true,
                },
            },
            review: {
                select: {
                    id: true,
                    rating: true,
                    title: true,
                },
            },
        },
    });
};

export const getUnreadNotificationCount = async (userId: string) => {
    return prisma.notification.count({
        where: {
            userId,
            isRead: false,
        },
    });
};

export const markNotificationAsRead = async (
    notificationId: string,
    userId: string
) => {
    return prisma.notification.updateMany({
        where: {
            id: notificationId,
            userId,
            isRead: false,
        },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    });
};

export const markNotificationAsUnread = async (
    notificationId: string,
    userId: string
) => {
    return prisma.notification.updateMany({
        where: {
            id: notificationId,
            userId,
            isRead: true,
        },
        data: {
            isRead: false,
            readAt: null,
        },
    });
};

export const markAllNotificationsAsRead = async (userId: string) => {
    return prisma.notification.updateMany({
        where: {
            userId,
            isRead: false,
        },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    });
};

export const deleteNotification = async (
    notificationId: string,
    userId: string
) => {
    return prisma.notification.deleteMany({
        where: {
            id: notificationId,
            userId,
        },
    });
};

export const broadcastNotificationRead = async (
    userId: string,
    notificationId: string
) => {
    const unreadCount = await getUnreadNotificationCount(userId);
    await emitNotificationRealtimeEvent(userId, {
        action: "read",
        notificationId,
        unreadCount,
    });
};

export const broadcastNotificationUnread = async (
    userId: string,
    notificationId: string
) => {
    const unreadCount = await getUnreadNotificationCount(userId);
    await emitNotificationRealtimeEvent(userId, {
        action: "unread",
        notificationId,
        unreadCount,
    });
};

export const broadcastNotificationReadAll = async (userId: string) => {
    const unreadCount = await getUnreadNotificationCount(userId);
    await emitNotificationRealtimeEvent(userId, {
        action: "read_all",
        unreadCount,
    });
};

export const broadcastNotificationDeleted = async (
    userId: string,
    notificationId: string
) => {
    const unreadCount = await getUnreadNotificationCount(userId);
    await emitNotificationRealtimeEvent(userId, {
        action: "deleted",
        notificationId,
        unreadCount,
    });
};
