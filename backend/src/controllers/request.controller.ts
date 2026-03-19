import { prisma } from "../lib/prisma.js";
import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";



export const createHelpRequest = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    try {
        if (!userId) return next(new AppError("Unauthorized", 401));

        const { title, description, category, location, budget } = req.body;

        if (!title || !description || !category || !location) {
            return next(new AppError("All fields are required", 400));
        }

        const validCategories = ["FOOD", "MEDICAL", "EDUCATION", "OTHER"];
        if (!validCategories.includes(category)) {
            return next(new AppError("Invalid category", 400));
        }

        const newLocation = await prisma.location.create({
            data: {
                latitude: location.latitude,
                longitude: location.longitude,
                radius: location.radius || 800,
                street: location.street || null,
                city: location.city || null,
                state: location.state || null,
                country: location.country || null,
            },
        });

        const newRequest = await prisma.helpRequest.create({
            data: {
                title,
                description,
                category,
                locationId: newLocation.id,
                budget: budget || null,
                requesterId: userId,
            },
            include: {
                location: true,
            },
        });

        res.status(201).json({
            success: true,
            data: newRequest,
            message: "Help request created successfully",
        });

    } catch (error) {
        console.error(error);
        next(new AppError("Failed to create help request", 500));
    }
};


export const getAllHelpRequests = async (req: Request, res: Response) => {
    try {
        // ---------------------------
        // Pagination
        // ---------------------------
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // max 50 per request
        const skip = (page - 1) * limit;

        // ---------------------------
        // Filtering
        // ---------------------------
        const { category, status } = req.query;

        // Valid values
        const validCategories = ["FOOD", "MEDICAL", "EDUCATION", "OTHER"];
        const validStatuses = ["OPEN", "ASSIGNED", "COMPLETED", "CANCELLED"];

        // Validate query filters
        if (category && !validCategories.includes(category as string)) {
            return res.status(400).json({ success: false, error: "Invalid category" });
        }
        if (status && !validStatuses.includes(status as string)) {
            return res.status(400).json({ success: false, error: "Invalid status" });
        }

        // Build Prisma where object
        const filters: any = {};
        if (category) filters.category = category;
        if (status) filters.status = status;

        // ---------------------------
        // 3️⃣ Query database
        // ---------------------------
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
                            email: true,
                            profile: true,
                        },
                    },
                },
            }),
            prisma.helpRequest.count({ where: filters }),
        ]);

        // ---------------------------
        // 4️⃣ Response
        // ---------------------------
        res.json({
            success: true,
            data: requests,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Error fetching help requests:", error);
        res.status(500).json({ success: false, error: "Failed to fetch help requests" });
    }
};

// Get single Help Request
export const getHelpRequestById = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;

    try {
        const helpRequest = await prisma.helpRequest.findUnique({
            where: { id },
            include: {
                location: true,
                requester: {
                    select: {
                        id: true,
                        email: true,
                        profile: true,
                    },
                },
                bids: true,
                messages: true,
            },
        });

        if (!helpRequest) {
            return res.status(404).json({ success: false, error: "Not found" });
        }

        res.json({ success: true, data: helpRequest });

    } catch {
        res.status(500).json({ success: false, error: "Failed to fetch help request" });
    }
};

export const deleteHelpRequest = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    if (!userId) return next(new AppError("Unauthorized", 401));

    const { id } = req.params;

    try {
        // check if request exists and belongs to user
        const existing = await prisma.helpRequest.findUnique({ where: { id } });

        if (!existing) return next(new AppError("Not found", 404));
        // only requester can delete request
        if (existing.requesterId !== userId) {
            return next(new AppError("Forbidden", 403));
        }
        // delete request and associated location in a transaction
        await prisma.$transaction([
            prisma.helpRequest.delete({ where: { id } }),
            existing.locationId
                ? prisma.location.delete({ where: { id: existing.locationId } })
                : undefined,
        ].filter(Boolean)); // filter removes undefined


        res.json({
            success: true,
            message: "Deleted successfully",
        });

    } catch {
        next(new AppError("Delete failed", 500));
    }
};

export const updateHelpRequest = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    if (!userId) return next(new AppError("Unauthorized", 401));

    const { id } = req.params;
    const { title, description, category, location, budget } = req.body;

    try {
        const existing = await prisma.helpRequest.findUnique({ where: { id } });

        if (!existing) return next(new AppError("Not found", 404));
        if (existing.requesterId !== userId) {
            return next(new AppError("Forbidden", 403));
        }

        // Update location (only location fields)
        if (location && existing.locationId) {
            await prisma.location.update({
                where: { id: existing.locationId },
                data: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    radius: location.radius || 800,
                    street: location.street || null,
                    city: location.city || null,
                    state: location.state || null,
                    country: location.country || null,
                },
            });
        }

        // Update helpRequest fields
        const updated = await prisma.helpRequest.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description && { description }),
                ...(category && { category }),
                ...(budget !== undefined && { budget }),
            },
            include: { location: true },
        });

        res.json({
            success: true,
            data: updated,
            message: "Updated successfully",
        });

    } catch (error) {
        console.error("Error updating help request:", error);
        next(new AppError("Update failed", 500));
    }
};

export const updateHelpRequestStatus = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { status } = req.body;

    try {

        // check if user is authenticated
        if (!userId) return next(new AppError("Unauthorized", 401));

        // check if request exists
        const existing = await prisma.helpRequest.findUnique({ where: { id } });
        if (!existing) return next(new AppError("Not found", 404));

        // only requester can update status
        if (existing.requesterId !== userId) {
            return next(new AppError("Forbidden", 403));
        }

        // validate status
        const validStatuses = ["OPEN", "ASSIGNED", "COMPLETED", "CANCELLED"];
        if (!validStatuses.includes(status)) {
            return next(new AppError("Invalid status", 400));
        }

        //  transition validation
        const allowedTransitions: Record<string, string[]> = {
            OPEN: ["ASSIGNED", "CANCELLED"],
            ASSIGNED: ["COMPLETED"],
            COMPLETED: [],
            CANCELLED: [],
        }

        if (!allowedTransitions[existing.status].includes(status)) {
            return next(
                new AppError(
                    `Cannot change status from ${existing.status} to ${status}`,
                    400
                )
            );
        }
        // update status
        const updated = await prisma.helpRequest.update({
            where: { id },
            data: { status },
            include: { location: true },
        });

        res.json({
            success: true,
            data: updated,
            message: "Status updated successfully",
        });

    } catch (error) {
        console.error("Error updating help request status:", error);
        next(new AppError("Failed to update help request status", 500));
    }

}


