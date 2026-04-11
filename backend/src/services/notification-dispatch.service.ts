import { prisma } from "../lib/prisma.js";
import { NotificationType } from "../../generated/prisma/client.js";
import { getPushTokensForUser } from "./push-token.service.js";
import { sendExpoPushMessages, type ExpoPushMessage } from "./expo-push.service.js";

type NotificationLike = {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    requestId?: string | null;
    bidId?: string | null;
    conversationId?: string | null;
    messageId?: string | null;
    reviewId?: string | null;
    data?: unknown;
};

const buildNotificationRoute = (notification: NotificationLike) => {
    switch (notification.type) {
        case "MESSAGE_RECEIVED":
            return "/messages";
        case "BID_RECEIVED":
            return notification.requestId ? `/profile/requests/${notification.requestId}` : "/profile/bids";
        case "BID_ACCEPTED":
        case "BID_REJECTED":
            return "/profile/bids";
        case "REQUEST_ASSIGNED":
        case "REQUEST_COMPLETED":
        case "REQUEST_CANCELLED":
            return notification.requestId ? `/home/requests/${notification.requestId}` : "/home/requests";
        case "REVIEW_RECEIVED":
        case "REVIEW_REPLY_RECEIVED":
            return "/profile";
        default:
            return "/notifications";
    }
};

export const dispatchNotificationPush = async (notification: NotificationLike) => {
    const tokens = await getPushTokensForUser(notification.userId);

    if (tokens.length === 0) {
        return;
    }

    const unreadCount = await prisma.notification.count({
        where: {
            userId: notification.userId,
            isRead: false,
        },
    });

    const route = buildNotificationRoute(notification);
    const messages: ExpoPushMessage[] = tokens.map((tokenRecord) => ({
        to: tokenRecord.token,
        title: notification.title,
        body: notification.body,
        sound: "default",
        priority: "high",
        badge: unreadCount,
        data: {
            notificationId: notification.id,
            type: notification.type,
            requestId: notification.requestId ?? null,
            bidId: notification.bidId ?? null,
            conversationId: notification.conversationId ?? null,
            messageId: notification.messageId ?? null,
            reviewId: notification.reviewId ?? null,
            route,
        },
    }));

    try {
        await sendExpoPushMessages(messages);
    } catch (error) {
        console.warn("Failed to send Expo push notification:", error);
    }
};

export const resolveNotificationRoute = buildNotificationRoute;