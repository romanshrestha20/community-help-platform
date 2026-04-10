import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";
import {
    deleteNotification,
    getUnreadNotificationCount,
    getUserNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from "../services/notification.service.js";

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

        res.json({
            success: true,
            data: notifications,
        });
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

        res.json({
            success: true,
            data: { count },
        });
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

        res.json({
            success: true,
            message: "Notification marked as read",
        });
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

        res.json({
            success: true,
            message: "All notifications marked as read",
        });
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