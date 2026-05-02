import { prisma } from "../lib/prisma.js";
import { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError.js";
import {
  getHelpRequests,
  getNearbyHelpRequests,
} from "../services/helpRequest.service.js";
import {
  normalizeIncomingLocation,
  toLocationCreateInput,
  toLocationUpdateInput,
} from "../utils/location.js";
import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
} from "../utils/cloudinary.js";
import { getZodErrorMessage } from "../utils/zod.js";
import {
  createHelpRequestBodySchema,
  updateHelpRequestBodySchema,
  updateHelpRequestStatusBodySchema,
} from "../utils/validation-schemas.js";

import { createNotification } from "../services/notification.service.js";
import { NotificationType } from "../../generated/prisma/client.js";

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

const normalizeParamId = (value: string | string[] | undefined): string | null => {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
    return value[0];
  }

  return null;
};

const getQueryString = (value: unknown): string | undefined => {
  return typeof value === "string" ? value : undefined;
};

const HELP_REQUEST_INCLUDE = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
    },
  },
  location: true,
  images: true,
  requester: {
    select: {
      id: true,
      profile: {
        select: {
          fullName: true,
          avatarUrl: true,
          gender: true,
          address: true,
        },
      },
    },
  },
  _count: {
    select: {
      bids: true,
    },
  },
} as const;

const formatHelpRequest = (r: any) => ({
  id: r.id,
  requesterId: r.requester?.id ?? r.requesterId,
  assignedHelperId: r.assignedHelperId ?? null,
  title: r.title,
  description: r.description,
  category: r.category
    ? {
      id: r.category.id,
      name: r.category.name,
      slug: r.category.slug,
      icon: r.category.icon,
    }
    : null,
  budget: r.budget,
  status: r.status,
  isPaid: r.isPaid,
  isUrgent: r.isUrgent === true,
  urgentExpiresAt: r.urgentExpiresAt ?? null,
  serviceRadiusMeters: r.serviceRadiusMeters ?? null,
  location: r.location ?? null,
  city: r.location?.city ?? null,
  state: r.location?.state ?? null,
  country: r.location?.country ?? null,
  requesterName: r.requester?.profile?.fullName ?? null,
  requesterAvatarUrl: r.requester?.profile?.avatarUrl ?? null,
  requesterGender: r.requester?.profile?.gender ?? null,
  requesterLocation:
    r.requester?.profile?.address?.formattedAddress ||
    [
      r.requester?.profile?.address?.city,
      r.requester?.profile?.address?.country,
    ]
      .filter(Boolean)
      .join(", ") ||
    null,
  images: Array.isArray(r.images) ? r.images.map(stripImagePublicId) : [],
  bidCount: r._count?.bids ?? 0,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

const URGENT_DURATION_MINUTES_DEFAULT = 120;

const resolveUrgentExpiry = (
  isUrgent: boolean,
  urgentDurationMinutes?: number
) => {
  if (!isUrgent) return null;
  const minutes =
    typeof urgentDurationMinutes === "number" &&
      Number.isFinite(urgentDurationMinutes) &&
      urgentDurationMinutes >= 5
      ? urgentDurationMinutes
      : URGENT_DURATION_MINUTES_DEFAULT;
  return new Date(Date.now() + minutes * 60 * 1000);
};

const isMissingUrgentColumnError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string; meta?: { message?: string } };
  const combinedMessage = `${candidate.message ?? ""} ${candidate.meta?.message ?? ""}`.toLowerCase();
  return (
    candidate.code === "P2022" &&
    (combinedMessage.includes("isurgent") || combinedMessage.includes("urgentexpiresat"))
  );
};

const nearbyCategoryAllowlist = new Set([
  "errands",
  "moving",
  "transportation",
  "shopping",
]);

const isMissingNearbyPreferenceColumnError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const prismaError = error as { code?: string; message?: string };
  if (prismaError.code !== "P2022") return false;
  const message = (prismaError.message || "").toLowerCase();
  return (
    message.includes("nearbyalertsenabled") ||
    message.includes("nearbyalertradiuskm") ||
    message.includes("nearbyalertsurgentonly") ||
    message.includes("nearbyalertcategoryslugs")
  );
};

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const getDistanceKm = (
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
) => {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(to.latitude - from.latitude);
  const lonDelta = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lonDelta / 2) * Math.sin(lonDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const maybeBroadcastNearbyRequestAlert = async ({
  requestId,
  requesterId,
  title,
  isUrgent,
  categorySlug,
  location,
}: {
  requestId: string;
  requesterId: string;
  title: string;
  isUrgent: boolean;
  categorySlug: string;
  location: { latitude: number; longitude: number } | null;
}) => {
  if (!location || !nearbyCategoryAllowlist.has(categorySlug)) return;

  let usersWithNearbyAlerts: Array<{
    userId: string;
    nearbyAlertRadiusKm: number;
    nearbyAlertsUrgentOnly: boolean;
    nearbyAlertCategorySlugs: string[];
    user: {
      profile: {
        address: {
          latitude: number;
          longitude: number;
        } | null;
      } | null;
    };
  }> = [];

  try {
    usersWithNearbyAlerts = await prisma.notificationPreference.findMany({
      where: {
        nearbyAlertsEnabled: true,
        userId: { not: requesterId },
      },
      select: {
        userId: true,
        nearbyAlertRadiusKm: true,
        nearbyAlertsUrgentOnly: true,
        nearbyAlertCategorySlugs: true,
        user: {
          select: {
            profile: {
              select: {
                address: {
                  select: {
                    latitude: true,
                    longitude: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 200,
    });
  } catch (error) {
    if (isMissingNearbyPreferenceColumnError(error)) {
      return;
    }
    throw error;
  }

  if (!usersWithNearbyAlerts.length) return;

  const matchedRecipients = usersWithNearbyAlerts
    .map((userPreference) => {
      // Defensive guard: owner should never get their own nearby alert.
      if (userPreference.userId === requesterId) {
        return null;
      }

      if (userPreference.nearbyAlertsUrgentOnly && !isUrgent) {
        return null;
      }

      if (
        userPreference.nearbyAlertCategorySlugs.length > 0 &&
        !userPreference.nearbyAlertCategorySlugs.includes(categorySlug)
      ) {
        return null;
      }

      // Skip users safely when profile address is missing.
      const address = userPreference.user.profile?.address;
      if (!address) {
        return null;
      }

      const distanceKm = getDistanceKm(location, {
        latitude: address.latitude,
        longitude: address.longitude,
      });

      if (distanceKm > userPreference.nearbyAlertRadiusKm) {
        return null;
      }

      return {
        userId: userPreference.userId,
        distanceKm,
      };
    })
    .filter((entry): entry is { userId: string; distanceKm: number } => Boolean(entry));

  if (!matchedRecipients.length) return;

  const notificationTitle = isUrgent ? "Urgent request nearby" : "New request nearby";
  const nearbyType = isUrgent ? "URGENT_REQUEST_NEARBY" : "REQUEST_NEARBY";

  const existingNearbyNotifications = await prisma.notification.findMany({
    where: {
      requestId,
      type: NotificationType.SYSTEM,
      title: {
        in: ["Urgent request nearby", "New request nearby"],
      },
      userId: {
        in: matchedRecipients.map((recipient) => recipient.userId),
      },
    },
    select: {
      userId: true,
      requestId: true,
    },
  });
  const existingKeySet = new Set(existingNearbyNotifications.map((item) => `${item.userId}:${item.requestId}`));
  const recipientsToNotify = matchedRecipients.filter(
    (recipient) => !existingKeySet.has(`${recipient.userId}:${requestId}`)
  );

  if (!recipientsToNotify.length) return;

  await Promise.all(
    recipientsToNotify.map((recipient) =>
      createNotification({
        userId: recipient.userId,
        actorId: requesterId,
        type: NotificationType.SYSTEM,
        title: notificationTitle,
        body: `${title} · ${recipient.distanceKm.toFixed(1)} km away`,
        requestId,
        data: {
          nearbyType,
          priority: isUrgent ? "urgent" : "normal",
          distanceKm: Number(recipient.distanceKm.toFixed(2)),
          requestTitle: title,
          categorySlug,
        },
      })
    )
  );
};

const ensureActiveCategory = async (categoryId: string) => {
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
    },
  });

  if (!category) {
    throw new AppError("Invalid category selected", 400);
  }

  return category;
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

    const parsedBody = createHelpRequestBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }

    const {
      title,
      description,
      categoryId,
      budget,
      isPaid,
      isUrgent,
      urgentDurationMinutes,
      serviceRadiusMeters,
    } = parsedBody.data;

    const location = normalizeIncomingLocation(req.body as Record<string, unknown>);
    const files = getUploadedFiles(req);

    const requester = await prisma.userModel.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!requester) {
      return next(new AppError("Invalid session. Please log in again.", 401));
    }

    if (!location) {
      return next(new AppError("A valid location is required", 400));
    }

    const category = await ensureActiveCategory(categoryId);

    const createData: any = {
      title,
      description,
      category: {
        connect: { id: categoryId },
      },
      budget: budget ?? null,
      isPaid: isPaid ?? false,
      isUrgent: isUrgent ?? false,
      urgentExpiresAt: resolveUrgentExpiry(Boolean(isUrgent), urgentDurationMinutes),
      ...(serviceRadiusMeters !== undefined && {
        serviceRadiusMeters,
      }),
      requester: {
        connect: { id: userId },
      },
      location: {
        create: toLocationCreateInput(location),
      },
    };

    let newRequest: any;
    try {
      newRequest = await prisma.helpRequest.create({ data: createData });
    } catch (error) {
      if (!isMissingUrgentColumnError(error)) {
        throw error;
      }

      const { isUrgent: _isUrgent, urgentExpiresAt: _urgentExpiresAt, ...fallbackCreateData } = createData;
      newRequest = await prisma.helpRequest.create({ data: fallbackCreateData });
    }

    await maybeBroadcastNearbyRequestAlert({
      requestId: newRequest.id,
      requesterId: userId,
      title: newRequest.title,
      isUrgent: Boolean(newRequest.isUrgent),
      categorySlug: category.slug,
      location: location
        ? { latitude: location.latitude, longitude: location.longitude }
        : null,
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
      include: HELP_REQUEST_INCLUDE,
    });

    sendResponse(
      res,
      requestWithRelations
        ? formatHelpRequest(requestWithRelations)
        : {
          ...newRequest,
          category: null,
          images: createdImages.map(stripImagePublicId),
        },
      "Help request created"
    );
  } catch (err) {
    console.error("Create Help Request Error:", err);

    if (err instanceof AppError) {
      return next(err);
    }

    if ((err as any)?.code === "P2003") {
      return next(new AppError("Invalid related resource", 400));
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

export const getNearbyRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const result = await getNearbyHelpRequests({
      userId,
      latitude: getQueryString(req.query.latitude) ?? getQueryString(req.query.lat),
      longitude: getQueryString(req.query.longitude) ?? getQueryString(req.query.lng),
      radiusKm: getQueryString(req.query.radiusKm),
      category: getQueryString(req.query.category),
      categoryId: getQueryString(req.query.categoryId),
      search: getQueryString(req.query.search),
      page: getQueryString(req.query.page),
      limit: getQueryString(req.query.limit),
    });

    sendResponse(res, result.requests, "", {
      ...result.meta,
      searchMeta: result.searchMeta,
    });
  } catch (err) {
    console.error(err);
    next(err instanceof AppError ? err : new AppError("Failed to fetch nearby requests", 500));
  }
};

// GET ONE
export const getHelpRequestById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = normalizeParamId(req.params.id);

    if (!id) {
      return next(new AppError("Not found", 404));
    }

    const r = await prisma.helpRequest.findUnique({
      where: { id },
      include: HELP_REQUEST_INCLUDE,
    });

    if (!r) {
      return next(new AppError("Not found", 404));
    }

    sendResponse(res, formatHelpRequest(r));
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

    const id = normalizeParamId(req.params.id);

    if (!id) {
      return next(new AppError("Not found", 404));
    }

    const existing: any = await prisma.helpRequest.findUnique({
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
  const id = normalizeParamId(req.params.id);
  const parsedBody = updateHelpRequestStatusBodySchema.safeParse(req.body);

  const transitions: Record<string, string[]> = {
    OPEN: ["ASSIGNED", "CANCELLED"],
    ASSIGNED: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
  };

  try {
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }

    if (!id) {
      return next(new AppError("Not found", 404));
    }

    const { status } = parsedBody.data;

    const existing: any = await prisma.helpRequest.findUnique({
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
      include: HELP_REQUEST_INCLUDE,
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

    sendResponse(res, formatHelpRequest(updated), `Status changed to ${status}`);
  } catch (error) {
    console.error("Update Help Request Status Error:", error);

    if (error instanceof AppError) {
      return next(error);
    }

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
  const id = normalizeParamId(req.params.id);
  const parsedBody = updateHelpRequestBodySchema.safeParse(req.body);
  const hasLocationPayload = Object.prototype.hasOwnProperty.call(req.body, "location");

  try {
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!id) {
      return next(new AppError("Help request not found", 404));
    }

    const request: any = await prisma.helpRequest.findUnique({
      where: { id },
      include: { location: true },
    });

    if (!request) {
      return next(new AppError("Help request not found", 404));
    }

    if (request.requesterId !== userId) {
      return next(new AppError("Forbidden", 403));
    }

    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }

    const {
      title,
      description,
      categoryId,
      budget,
      isPaid,
      isUrgent,
      urgentDurationMinutes,
      serviceRadiusMeters,
    } = parsedBody.data;

    const location = normalizeIncomingLocation(req.body as Record<string, unknown>);

    if (hasLocationPayload && !location) {
      return next(
        new AppError(
          "Invalid location payload. Use location.latitude and location.longitude.",
          400
        )
      );
    }

    if (categoryId !== undefined) {
      await ensureActiveCategory(categoryId);
    }

    const updateData: any = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(categoryId !== undefined && {
        category: {
          connect: { id: categoryId },
        },
      }),
      ...(budget !== undefined && { budget }),
      ...(isPaid !== undefined && { isPaid }),
      ...(isUrgent !== undefined && {
        isUrgent,
        urgentExpiresAt: resolveUrgentExpiry(Boolean(isUrgent), urgentDurationMinutes),
      }),
      ...(serviceRadiusMeters !== undefined && {
        serviceRadiusMeters,
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

    let updatedRequest: any;
    try {
      updatedRequest = await prisma.helpRequest.update({
        where: { id },
        data: updateData,
        include: HELP_REQUEST_INCLUDE,
      });
    } catch (error) {
      if (!isMissingUrgentColumnError(error)) {
        throw error;
      }

      const { isUrgent: _isUrgent, urgentExpiresAt: _urgentExpiresAt, ...fallbackUpdateData } = updateData;
      updatedRequest = await prisma.helpRequest.update({
        where: { id },
        data: fallbackUpdateData,
        include: HELP_REQUEST_INCLUDE,
      });
    }

    sendResponse(
      res,
      formatHelpRequest(updatedRequest),
      "Help request updated successfully"
    );
  } catch (error) {
    console.error("Update Help Request Error:", error);

    if (error instanceof AppError) {
      return next(error);
    }

    next(new AppError("Failed to update help request", 500));
  }
};

export const addRequestImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.userId;
  const requestId = normalizeParamId(req.params.id);

  try {
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const files = getUploadedFiles(req);

    if (!files.length) {
      return next(new AppError("At least one image is required", 400));
    }

    if (!requestId) {
      return next(new AppError("Request not found", 404));
    }

    const helpRequest: any = await prisma.helpRequest.findUnique({
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
  const requestId = normalizeParamId(req.params.id);
  const imageId = normalizeParamId(req.params.imageId);

  try {
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!requestId || !imageId) {
      return next(new AppError("Invalid request image parameters", 400));
    }

    const helpRequest: any = await prisma.helpRequest.findUnique({
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
