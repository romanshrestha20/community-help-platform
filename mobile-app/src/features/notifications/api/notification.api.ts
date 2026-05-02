import apiClient from "@/api/api-client";
import type {
    ApiResponse,
    AppNotification,
    NotificationPreferencesDto,
} from "../types/notification.types";

const unwrapResponse = <T>(response: ApiResponse<T>): T => {
    if (!response.success) {
        throw new Error(response.message || "Request failed");
    }

    return response.data;
};

export const fetchNotificationsApi = async (): Promise<AppNotification[]> => {
    const response = await apiClient.get<ApiResponse<AppNotification[]>>("/notifications");
    return unwrapResponse(response.data);
};

export const getUnreadCountApi = async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<{ count: number }>>("/notifications/unread-count");
    return unwrapResponse(response.data).count;
};

export const markAsReadApi = async (notificationId: string): Promise<void> => {
    const response = await apiClient.patch<ApiResponse<null>>(`/notifications/${notificationId}/read`);
    unwrapResponse(response.data);
};

export const markAsUnreadApi = async (notificationId: string): Promise<void> => {
    const response = await apiClient.patch<ApiResponse<null>>(`/notifications/${notificationId}/unread`);
    unwrapResponse(response.data);
};

export const markAllAsReadApi = async (): Promise<void> => {
    const response = await apiClient.patch<ApiResponse<null>>("/notifications/read-all");
    unwrapResponse(response.data);
};

export const deleteNotificationApi = async (notificationId: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<null>>(`/notifications/${notificationId}`);
    unwrapResponse(response.data);
};

export const registerPushTokenApi = async (token: string, platform: string): Promise<void> => {
    const response = await apiClient.post<ApiResponse<null>>("/notifications/push-token", {
        token,
        platform,
    });

    unwrapResponse(response.data);
};

export const unregisterPushTokenApi = async (token: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<null>>("/notifications/push-token", {
        data: { token },
    });

    unwrapResponse(response.data);
};

export const fetchNotificationPreferencesApi =
    async (): Promise<NotificationPreferencesDto> => {
        const response = await apiClient.get<ApiResponse<NotificationPreferencesDto>>(
            "/notifications/preferences",
            {
                skipErrorToast: true,
                suppressErrorLog: true,
            }
        );

        return unwrapResponse(response.data);
    };

export const updateNotificationPreferencesApi = async (
    preferences: Partial<NotificationPreferencesDto>
): Promise<NotificationPreferencesDto> => {
    const response = await apiClient.patch<ApiResponse<NotificationPreferencesDto>>(
        "/notifications/preferences",
        preferences
    );

    return unwrapResponse(response.data);
};
