import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";
import {
    deleteNotification,
    getUnreadNotificationCount,
    getUserNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    markNotificationAsUnread,
} from "../services/notification.service.js";
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

        // Validate and sanitize input fields
        const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
        const platform = typeof req.body?.platform === "string" ? req.body.platform.trim() : null;

        if (!token) {
            return next(new AppError("Push token is required", 400));
        }

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

        const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";

        if (!token) {
            return next(new AppError("Push token is required", 400));
        }

        await deletePushTokenForUser(userId, token);

        handleResponse(res, null, "Push token removed");
    } catch (error) {
        next(error);
    }
};