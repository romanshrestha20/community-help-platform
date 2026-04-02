import { prisma } from "../lib/prisma.js";
import { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError.js";
import { getHelpRequests } from "../services/helpRequest.service.js";
import {
  normalizeIncomingLocation,
  toLocationCreateInput,
  toLocationUpdateInput,
} from "../utils/location.js";

const validCategories = ["FOOD", "MEDICAL", "EDUCATION", "OTHER"];
const validStatuses = ["OPEN", "ASSIGNED", "COMPLETED", "CANCELLED"];

const sendResponse = (
  res: Response,
  data: any = null,
  message = "",
  meta = {}
) => {
  res.json({ success: true, data, message, meta });
};

// CREATE
export const createHelpRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.userId;

  try {
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const { title, description, category, budget, isPaid, serviceRadiusMeters } =
      req.body;

    const location = normalizeIncomingLocation(req.body as Record<string, unknown>);

    const requester = await prisma.userModel.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!requester) {
      return next(new AppError("Invalid session. Please log in again.", 401));
    }

    if (!title || !description || !category) {
      return next(new AppError("Title, description, and category are required", 400));
    }

    if (!validCategories.includes(category)) {
      return next(new AppError("Invalid category", 400));
    }

    if (!location) {
      return next(new AppError("A valid location is required", 400));
    }

    const newRequest = await prisma.helpRequest.create({
      data: {
        title,
        description,
        category,
        budget: budget ?? null,
        isPaid: Boolean(isPaid),
        ...(serviceRadiusMeters !== undefined && {
          serviceRadiusMeters: Number(serviceRadiusMeters),
        }),
        requester: {
          connect: { id: userId },
        },
        location: {
          create: toLocationCreateInput(location),
        },
      },
      include: {
        location: true,
        requester: {
          select: {
            id: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        _count: {
          select: {
            bids: true,
          },
        },
      },
    });

    sendResponse(res, newRequest, "Help request created");
  } catch (err) {
    console.error("Create Help Request Error:", err);

    if ((err as any)?.code === "P2003") {
      return next(new AppError("Invalid session. Please log in again.", 401));
    }

    next(new AppError("Failed to create help request", 500));
  }
};

// GET ALL
export const getAllHelpRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getHelpRequests(req.query);
    sendResponse(res, result.requests, "", result.meta);
  } catch (err) {
    console.error(err);
    next(new AppError("Failed to fetch requests", 500));
  }
};

// GET ONE
export const getHelpRequestById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const r = await prisma.helpRequest.findUnique({
      where: { id },
      include: {
        location: true,
        requester: {
          select: {
            id: true,
            profile: {
              select: {
                fullName: true,
                address: true,
              },
            },
          },
        },
        _count: { select: { bids: true } },
      },
    });

    if (!r) {
      return next(new AppError("Not found", 404));
    }

    const formatted = {
      id: r.id,
      requesterId: r.requester.id,
      title: r.title,
      description: r.description,
      category: r.category,
      budget: r.budget,
      status: r.status,
      isPaid: r.isPaid,
      serviceRadiusMeters: (r as any).serviceRadiusMeters ?? null,
      location: r.location,
      requesterName: r.requester.profile?.fullName ?? null,
      bidCount: r._count.bids,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };

    sendResponse(res, formatted);
  } catch (error) {
    console.error("Get Help Request By Id Error:", error);
    next(new AppError("Failed to fetch request", 500));
  }
};

// DELETE
export const deleteHelpRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.userId;

  try {
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const { id } = req.params;

    const existing = await prisma.helpRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      return next(new AppError("Not found", 404));
    }

    if (existing.requesterId !== userId) {
      return next(new AppError("Forbidden", 403));
    }

    await prisma.helpRequest.delete({ where: { id } });

    sendResponse(res, null, "Deleted successfully");
  } catch (error) {
    console.error("Delete Help Request Error:", error);
    next(new AppError("Delete failed", 500));
  }
};

// UPDATE STATUS
export const updateHelpRequestStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!validStatuses.includes(status)) {
      return next(new AppError("Invalid status", 400));
    }

    const existing = await prisma.helpRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      return next(new AppError("Not found", 404));
    }

    if (existing.requesterId !== userId) {
      return next(new AppError("Forbidden", 403));
    }

    if (!transitions[existing.status].includes(status)) {
      return next(new AppError("Invalid status transition", 400));
    }

    const updated = await prisma.helpRequest.update({
      where: { id },
      data: { status },
      include: {
        location: true,
      },
    });

    sendResponse(res, updated, `Status changed to ${status}`);
  } catch (error) {
    console.error("Update Help Request Status Error:", error);
    next(new AppError("Failed to update status", 500));
  }
};

// UPDATE
export const updateHelpRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.userId;
  const { id } = req.params;
  const { title, description, category, budget, status, isPaid, serviceRadiusMeters } =
    req.body;
  const hasLocationPayload = Object.prototype.hasOwnProperty.call(req.body, "location");

  try {
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const request = await prisma.helpRequest.findUnique({
      where: { id },
      include: { location: true },
    });

    if (!request) {
      return next(new AppError("Help request not found", 404));
    }

    if (request.requesterId !== userId) {
      return next(new AppError("Forbidden", 403));
    }

    if (category && !validCategories.includes(category)) {
      return next(new AppError("Invalid category", 400));
    }

    const allowedStatuses: Record<string, string[]> = {
      OPEN: ["ASSIGNED", "CANCELLED"],
      ASSIGNED: ["COMPLETED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (status && !validStatuses.includes(status)) {
      return next(new AppError("Invalid status", 400));
    }

    if (status && !allowedStatuses[request.status].includes(status)) {
      return next(
        new AppError(
          `Cannot change status from ${request.status} to ${status}`,
          400
        )
      );
    }

    const location = normalizeIncomingLocation(req.body as Record<string, unknown>);

    if (hasLocationPayload && !location) {
      return next(new AppError("Invalid location payload. Use location.latitude and location.longitude.", 400));
    }

    const updateData: any = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(budget !== undefined && { budget }),
      ...(status !== undefined && { status }),
      ...(isPaid !== undefined && { isPaid: Boolean(isPaid) }),
      ...(serviceRadiusMeters !== undefined && {
        serviceRadiusMeters: Number(serviceRadiusMeters),
      }),
    };

    if (location) {
      if (request.locationId) {
        updateData.location = {
          update: toLocationUpdateInput(location),
        };
      } else {
        updateData.location = {
          create: toLocationCreateInput(location),
        };
      }
    }

    const updatedRequest = await prisma.helpRequest.update({
      where: { id },
      data: updateData,
      include: {
        location: true,
        requester: {
          select: {
            id: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        _count: {
          select: {
            bids: true,
          },
        },
      },
    });

    sendResponse(res, updatedRequest, "Help request updated successfully");
  } catch (error) {
    console.error("Update Help Request Error:", error);
    next(new AppError("Failed to update help request", 500));
  }
};