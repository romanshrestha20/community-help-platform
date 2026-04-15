import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";
import { getZodErrorMessage } from "../utils/zod.js";
import {
    notificationPreferencesBodySchema,
    pushTokenBodySchema,
} from "../utils/validation-schemas.js";
import {
    deleteNotification,
    getUnreadNotificationCount,
    getUserNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    markNotificationAsUnread,
} from "../services/notification.service.js";
import {
    getNotificationPreferencesForUser,
    updateNotificationPreferencesForUser,
} from "../services/notification-preference.service.js";
import { deletePushTokenForUser, upsertPushTokenForUser } from "../services/push-token.service.js";


const handleResponse = <T>(res: Response, data: T, message?: string) => {
    res.json({
        success: true,
        data,
        message,
    });
};

const requireUserId = (req: Request): string | null => {
    return req.user?.userId ?? null;
};

const normalizeParamId = (value: string | string[] | undefined): string | null => {
    if (typeof value === "string" && value.trim().length > 0) {
        return value;
    }

    if (Array.isArray(value) && value.length > 0) {
        const first = value[0];
        return typeof first === "string" && first.trim().length > 0 ? first : null;
    }

    return null;
};



export const listNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = requireUserId(req);
        if (!userId) {
            return next(new AppError("Unauthorized", 401));
        }

        const notifications = await getUserNotifications(userId);

        handleResponse(res, notifications);
    } catch (error) {
        next(error);
    }
};

export const unreadNotificationCount = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = requireUserId(req);
        if (!userId) {
            return next(new AppError("Unauthorized", 401));
        }

        const count = await getUnreadNotificationCount(userId);

        handleResponse(res, { count });
    } catch (error) {
        next(error);
    }
};

export const getNotificationPreferences = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = requireUserId(req);
        if (!userId) {
            return next(new AppError("Unauthorized", 401));
        }

        const preferences = await getNotificationPreferencesForUser(userId);

        handleResponse(res, preferences);
    } catch (error) {
        next(error);
    }
};

export const updateNotificationPreferences = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = requireUserId(req);
        if (!userId) {
            return next(new AppError("Unauthorized", 401));
        }

        const parsedBody = notificationPreferencesBodySchema.safeParse(req.body);
        if (!parsedBody.success) {
            return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
        }

        const preferences = await updateNotificationPreferencesForUser(
            userId,
            parsedBody.data
        );

        handleResponse(res, preferences, "Notification preferences updated");
    } catch (error) {
        next(error);
    }
};

export const readNotification = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = requireUserId(req);
        if (!userId) {
            return next(new AppError("Unauthorized", 401));
        }

        const id = normalizeParamId(req.params.id);
        if (!id) {
            return next(new AppError("Notification ID is required", 400));
        }

        await markNotificationAsRead(id, userId);

        handleResponse(res, null, "Notification marked as read");
    } catch (error) {
        next(error);
    }
};

export const unreadNotification = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = requireUserId(req);
        if (!userId) {
            return next(new AppError("Unauthorized", 401));
        }

        const id = normalizeParamId(req.params.id);
        if (!id) {
            return next(new AppError("Notification ID is required", 400));
        }

        await markNotificationAsUnread(id, userId);

        handleResponse(res, null, "Notification marked as unread");
    } catch (error) {
        next(error);
    }
};

export const readAllNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = requireUserId(req);
        if (!userId) {
            return next(new AppError("Unauthorized", 401));
        }

        await markAllNotificationsAsRead(userId);

        handleResponse(res, null, "All notifications marked as read");
    } catch (error) {
        next(error);
    }
};

export const removeNotification = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = requireUserId(req);
        if (!userId) {
            return next(new AppError("Unauthorized", 401));
        }

        const id = normalizeParamId(req.params.id);
        if (!id) {
            return next(new AppError("Notification ID is required", 400));
        }

        await deleteNotification(id, userId);

        res.json({
            success: true,
            message: "Notification deleted",
        });
    } catch (error) {
        next(error);
    }
};


// Push Token Handlers for Mobile App
export const registerPushToken = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = requireUserId(req);
        if (!userId) {
            return next(new AppError("Unauthorized", 401));
        }

        const parsedBody = pushTokenBodySchema.safeParse(req.body);
        if (!parsedBody.success) {
            return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
        }

        const { token, platform } = parsedBody.data;

        await upsertPushTokenForUser({
            userId,
            token,
            platform,
        });

        handleResponse(res, null, "Push token registered");
    } catch (error) {
        next(error);
    }
};

// Handler to unregister a push token for the authenticated user
export const unregisterPushToken = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = requireUserId(req);
        if (!userId) {
            return next(new AppError("Unauthorized", 401));
        }

        const parsedBody = pushTokenBodySchema.safeParse(req.body);
        if (!parsedBody.success) {
            return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
        }

        const { token } = parsedBody.data;

        await deletePushTokenForUser(userId, token);

        handleResponse(res, null, "Push token removed");
    } catch (error) {
        next(error);
    }
};
