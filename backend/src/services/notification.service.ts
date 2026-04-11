import { prisma } from "../lib/prisma.js";
import { NotificationType, Prisma } from "../../generated//prisma/client.js";
import { dispatchNotificationPush } from "./notification-dispatch.service.js";

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

