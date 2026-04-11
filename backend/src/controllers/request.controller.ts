import { prisma } from "../lib/prisma.js";
import { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError.js";
import { getHelpRequests } from "../services/helpRequest.service.js";
import {
  normalizeIncomingLocation,
  toLocationCreateInput,
  toLocationUpdateInput,
} from "../utils/location.js";
import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
} from "../utils/cloudinary.js";

import { createNotification } from "../services/notification.service.js";
import { NotificationType } from "../../generated/prisma/client.js";

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

const getUploadedFiles = (req: Request): Express.Multer.File[] => {
  if (Array.isArray(req.files)) {
    return req.files;
  }

  return [];
};

const stripImagePublicId = <T extends { publicId?: string | null }>(image: T) => {
  const { publicId, ...safeImage } = image;
  return safeImage;
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
    console.log("Create Help Request Payload:", req.body);

    const location = normalizeIncomingLocation(req.body as Record<string, unknown>);
    const files = getUploadedFiles(req);

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
        budget: budget !== undefined && budget !== null ? Number(budget) : null,
        isPaid: isPaid === true || isPaid === "true",
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
    });

    let createdImages: any[] = [];

    if (files.length > 0) {
      const uploadedImages = await Promise.all(
        files.map((file) =>
          uploadImageToCloudinary(file.buffer, `thesis-app/requests/${newRequest.id}`)
        )
      );

      try {
        createdImages = await prisma.$transaction(
          uploadedImages.map((image) =>
            prisma.image.create({
              data: {
                url: image.url,
                publicId: image.publicId,
                type: "REQUEST",
                requestId: newRequest.id,
              },
            })
          )
        );
      } catch (error) {
        await Promise.allSettled(
          uploadedImages.map((image) => deleteImageFromCloudinary(image.publicId))
        );

        throw error;
      }
    }

    const requestWithRelations = await prisma.helpRequest.findUnique({
      where: { id: newRequest.id },
      include: {
        location: true,
        images: true,
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

    sendResponse(
      res,
      requestWithRelations
        ? {
          ...requestWithRelations,
          images: requestWithRelations.images.map(stripImagePublicId),
        }
        : {
          ...newRequest,
          images: createdImages.map(stripImagePublicId),
        },
      "Help request created"
    );
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

    const safeRequests = result.requests.map((request: any) => ({
      ...request,
      images: Array.isArray(request.images)
        ? request.images.map(stripImagePublicId)
        : [],
    }));

    sendResponse(res, safeRequests, "", result.meta);
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
        images: true,
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
      images: r.images.map(stripImagePublicId),
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
      include: {
        images: true,
      },
    });

    if (!existing) {
      return next(new AppError("Not found", 404));
    }

    if (existing.requesterId !== userId) {
      return next(new AppError("Forbidden", 403));
    }

    type RequestImage = {
      publicId: string | null;
    };

    await Promise.allSettled(
      existing.images
        .filter((image: RequestImage) => image.publicId)
        .map((image: RequestImage) => deleteImageFromCloudinary(image.publicId!))
    );
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
      include: {
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
      },
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
        images: true,
      },
    });

    if (status === "COMPLETED" && existing.assignedHelperId) {
      await createNotification({
        userId: existing.assignedHelperId,
        actorId: userId,
        type: NotificationType.REQUEST_COMPLETED,
        title: "Request marked as completed",
        body: `"${existing.title}" was marked as completed.`,
        requestId: existing.id,
        data: {
          requestTitle: existing.title,
        },
      });
    }

    if (status === "CANCELLED" && existing.assignedHelperId) {
      await createNotification({
        userId: existing.assignedHelperId,
        actorId: userId,
        type: NotificationType.REQUEST_CANCELLED,
        title: "Request was cancelled",
        body: `"${existing.title}" was cancelled by the requester.`,
        requestId: existing.id,
        data: {
          requestTitle: existing.title,
        },
      });
    }

    sendResponse(
      res,
      {
        ...updated,
        images: updated.images.map(stripImagePublicId),
      },
      `Status changed to ${status}`
    );
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
  const { title, description, category, budget, isPaid, serviceRadiusMeters } =
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


    if (status && !validStatuses.includes(status)) {
      return next(new AppError("Invalid status", 400));
    }



    const location = normalizeIncomingLocation(req.body as Record<string, unknown>);

    if (hasLocationPayload && !location) {
      return next(
        new AppError(
          "Invalid location payload. Use location.latitude and location.longitude.",
          400
        )
      );
    }

    const updateData: any = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(budget !== undefined && { budget: budget === null ? null : Number(budget) }),
      ...(isPaid !== undefined && { isPaid: isPaid === true || isPaid === "true" }),
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
        images: true,
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

    sendResponse(
      res,
      {
        ...updatedRequest,
        images: updatedRequest.images.map(stripImagePublicId),
      },
      "Help request updated successfully"
    );
  } catch (error) {
    console.error("Update Help Request Error:", error);
    next(new AppError("Failed to update help request", 500));
  }
};

export const addRequestImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.userId;
  const requestId = req.params.id;

  try {
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const files = getUploadedFiles(req);

    if (!files.length) {
      return next(new AppError("At least one image is required", 400));
    }

    const helpRequest = await prisma.helpRequest.findUnique({
      where: { id: requestId },
      include: {
        images: true,
      },
    });

    if (!helpRequest) {
      return next(new AppError("Request not found", 404));
    }

    if (helpRequest.requesterId !== userId) {
      return next(new AppError("You are not allowed to add images to this request", 403));
    }

    const uploadedImages = await Promise.all(
      files.map((file) =>
        uploadImageToCloudinary(file.buffer, `thesis-app/requests/${requestId}`)
      )
    );

    let createdImages: any[] = [];

    try {
      createdImages = await prisma.$transaction(
        uploadedImages.map((image) =>
          prisma.image.create({
            data: {
              url: image.url,
              publicId: image.publicId,
              type: "REQUEST",
              requestId,
            },
          })
        )
      );
    } catch (error) {
      await Promise.allSettled(
        uploadedImages.map((image) => deleteImageFromCloudinary(image.publicId))
      );

      throw error;
    }

    sendResponse(
      res,
      createdImages.map(stripImagePublicId),
      "Request images uploaded successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const deleteRequestImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.userId;
  const requestId = req.params.id;
  const imageId = req.params.imageId;

  try {
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const helpRequest = await prisma.helpRequest.findUnique({
      where: { id: requestId },
    });

    if (!helpRequest) {
      return next(new AppError("Request not found", 404));
    }

    if (helpRequest.requesterId !== userId) {
      return next(new AppError("You are not allowed to delete images from this request", 403));
    }

    const image = await prisma.image.findFirst({
      where: {
        id: imageId,
        requestId,
        type: "REQUEST",
      },
    });

    if (!image) {
      return next(new AppError("Request image not found", 404));
    }

    if (image.publicId) {
      try {
        await deleteImageFromCloudinary(image.publicId);
      } catch {
        // keep going so DB cleanup still happens
      }
    }

    await prisma.image.delete({
      where: {
        id: image.id,
      },
    });

    sendResponse(res, null, "Request image deleted successfully");
  } catch (error) {
    next(error);
  }
};