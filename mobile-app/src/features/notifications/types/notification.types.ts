export type NotificationType =
    | "BID_RECEIVED"
    | "BID_ACCEPTED"
    | "BID_REJECTED"
    | "REQUEST_ASSIGNED"
    | "REQUEST_COMPLETED"
    | "REQUEST_CANCELLED"
    | "MESSAGE_RECEIVED"
    | "REVIEW_RECEIVED"
    | "REVIEW_REPLY_RECEIVED"
    | "SYSTEM";

export type ApiResponse<T> = {
    success: boolean;
    data: T;
    message?: string;
};

export type NotificationPreferencesDto = {
    pushEnabled: boolean;
    messagesEnabled: boolean;
    bidsEnabled: boolean;
    requestUpdatesEnabled: boolean;
    savedRequestsEnabled: boolean;
};

export type NotificationRegistrationStatus =
    | "idle"
    | "requesting-permission"
    | "denied"
    | "registering-token"
    | "registered"
    | "failed";

export type NotificationPermissionStatus =
    | "undetermined"
    | "granted"
    | "denied"
    | null;

export type AppNotification = {
    id: string;
    actorId?: string | null;
    requestId?: string | null;
    bidId?: string | null;
    conversationId?: string | null;
    messageId?: string | null;
    reviewId?: string | null;
    type: NotificationType;
    title: string;
    body: string;
    isRead: boolean;
    readAt?: string | null;
    createdAt: string;
    actor?: {
        id: string;
        email: string;
        profile: {
            fullName: string | null;
            avatarUrl?: string | null;
        };
    } | null;
    request?: {
        id: string;
        title: string;
        status: string | null;
    } | null;
    bid?: {
        id: string;
        amount: number | null;
        status: string;
    } | null;
    conversation?: {
        id: string;
    } | null;
    message?: {
        id: string;
        content: string | null;
        type: string;
    } | null;
    review?: {
        id: string;
        rating: number;
        comment?: string | null;
    } | null;
    data?: Record<string, unknown> | null;
};
