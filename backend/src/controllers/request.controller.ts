import { prisma } from "../lib/prisma.js";
import { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError.js";

const validCategories = ["FOOD", "MEDICAL", "EDUCATION", "OTHER"];
const validStatuses = ["OPEN", "ASSIGNED", "COMPLETED", "CANCELLED"];

const sendResponse = (res: Response, data: any = null, message = "", meta = {}) => {
    res.json({ success: true, data, message, meta });
};

// CREATE
export const createHelpRequest = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    try {
        if (!userId) return next(new AppError("Unauthorized", 401));

        const { title, description, category, location, budget } = req.body;

        if (!title || !description || !category || !location) {
            return next(new AppError("All fields are required", 400));
        }

        if (!validCategories.includes(category)) {
            return next(new AppError("Invalid category", 400));
        }

        const newRequest = await prisma.helpRequest.create({
            data: {
                title,
                description,
                category,
                budget: budget || null,
                requesterId: userId,
                location: {
                    create: {
                        latitude: location.latitude,
                        longitude: location.longitude,
                        radius: location.radius || 800,
                        street: location.street || null,
                        city: location.city || null,
                        state: location.state || null,
                        country: location.country || null,
                    },
                },
            },
            include: { location: true },
        });

        sendResponse(res, newRequest, "Help request created");
    } catch (err) {
        next(new AppError("Failed to create help request", 500));
    }
};

// GET ALL
export const getAllHelpRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
        const skip = (page - 1) * limit;

        const { category, status } = req.query;

        if (category && !validCategories.includes(category as string)) {
            return next(new AppError("Invalid category", 400));
        }

        if (status && !validStatuses.includes(status as string)) {
            return next(new AppError("Invalid status", 400));
        }

        const filters: any = {};
        if (category) filters.category = category;
        if (status) filters.status = status;

        const [requests, total] = await Promise.all([
            prisma.helpRequest.findMany({
                where: filters,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    location: true,
                    requester: {
                        select: {
                            id: true,
                            profile: { select: { fullName: true } },
                        },
                    },
                    _count: { select: { bids: true } },
                },
            }),
            prisma.helpRequest.count({ where: filters }),
        ]);

        const formatted = requests.map((r: any) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            category: r.category,
            budget: r.budget,
            status: r.status,
            isPaid: r.isPaid,
            city: r.location?.city,
            country: r.location?.country,
            requesterName: r.requester.profile?.fullName,
            bidCount: r._count.bids,
            createdAt: r.createdAt,
        }));

        sendResponse(res, formatted, "", {
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (err) {
        next(new AppError("Failed to fetch requests", 500));
    }
};

// GET ONE
export const getHelpRequestById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const r = await prisma.helpRequest.findUnique({
            where: { id },
            include: {
                location: true,
                requester: {
                    select: {
                        id: true,
                        profile: { select: { fullName: true } },
                    },
                },
                _count: { select: { bids: true } },
            },
        });

        if (!r) return next(new AppError("Not found", 404));

        const formatted = {
            id: r.id,
            title: r.title,
            description: r.description,
            category: r.category,
            budget: r.budget,
            status: r.status,
            isPaid: r.isPaid,
            city: r.location?.city,
            country: r.location?.country,
            requesterName: r.requester.profile?.fullName,
            bidCount: r._count.bids,
            createdAt: r.createdAt,
        };

        sendResponse(res, formatted);
    } catch {
        next(new AppError("Failed to fetch request", 500));
    }
};

// DELETE
export const deleteHelpRequest = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    try {
        if (!userId) return next(new AppError("Unauthorized", 401));

        const { id } = req.params;

        const existing = await prisma.helpRequest.findUnique({ where: { id } });
        if (!existing) return next(new AppError("Not found", 404));
        if (existing.requesterId !== userId) return next(new AppError("Forbidden", 403));

        await prisma.helpRequest.delete({ where: { id } });

        sendResponse(res, null, "Deleted successfully");
    } catch {
        next(new AppError("Delete failed", 500));
    }
};

// UPDATE STATUS
export const updateHelpRequestStatus = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { status } = req.body;

    const transitions: Record<string, string[]> = {
        OPEN: ["ASSIGNED", "CANCELLED"],
        ASSIGNED: ["COMPLETED"],
        COMPLETED: [],
        CANCELLED: [],
    };

    try {
        if (!userId) return next(new AppError("Unauthorized", 401));
        if (!validStatuses.includes(status)) return next(new AppError("Invalid status", 400));

        const existing = await prisma.helpRequest.findUnique({ where: { id } });
        if (!existing) return next(new AppError("Not found", 404));
        if (existing.requesterId !== userId) return next(new AppError("Forbidden", 403));

        if (!transitions[existing.status].includes(status)) {
            return next(new AppError("Invalid status transition", 400));
        }

        const updated = await prisma.helpRequest.update({
            where: { id },
            data: { status },
        });

        sendResponse(res, updated, `Status changed to ${status}`);
    } catch {
        next(new AppError("Failed to update status", 500));
    }
};


// UPDATE
export const updateHelpRequest = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { title, description, category, budget, status } = req.body;

    try {
        if (!userId) return next(new AppError("Unauthorized", 401));

        const request = await prisma.helpRequest.findUnique({ where: { id } });
        if (!request) return next(new AppError("Help request not found", 404));
        if (request.requesterId !== userId) return next(new AppError("Forbidden", 403));

        // Status transition rules
        const allowedStatuses: Record<string, string[]> = {
            OPEN: ["ASSIGNED", "CANCELLED"],
            ASSIGNED: ["COMPLETED"],
            COMPLETED: [],
            CANCELLED: [],
        };

        if (status && !allowedStatuses[request.status].includes(status)) {
            return next(new AppError(`Cannot change status from ${request.status} to ${status}`, 400));
        }

        const updatedRequest = await prisma.helpRequest.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description && { description }),
                ...(category && { category }),
                ...(budget !== undefined && { budget }),
                ...(status && { status }),
            },
        });

        sendResponse(res, updatedRequest, "Help request updated successfully");
    } catch (error) {
        console.error("Update Help Request Error:", error);
        next(new AppError("Failed to update help request", 500));
    }
};