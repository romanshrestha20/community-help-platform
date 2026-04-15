import { prisma } from "../lib/prisma.js";
import { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError.js";
import { createNotification } from "../services/notification.service.js";
import { ensureConversationForRequestInTransaction } from "../services/conversation.service.js";
import { NotificationType, Prisma } from "../../generated/prisma/client.js";
import { getZodErrorMessage } from "../utils/zod.js";
import {
  placeBidBodySchema,
  respondToBidBodySchema,
  updateBidBodySchema,
} from "../utils/validation-schemas.js";

const calculateAge = (dateOfBirth?: Date | string | null) => {
  if (!dateOfBirth) return undefined;

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return undefined;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : undefined;
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

// Centralized response
const sendResponse = (res: Response, data: any = null, message = "") => {
  res.json({ success: true, data, message });
};

const HELPER_PROFILE_SELECT = {
  fullName: true,
  dateOfBirth: true,
  gender: true,
  avatarUrl: true,
  rating: true,
  totalReviews: true,
  helpCount: true,
  address: {
    select: {
      city: true,
      state: true,
      country: true,
      formattedAddress: true,
    },
  },
} as const;

// Format bid for consistent responses
const formatBid = (bid: any) => ({
  id: bid.id,
  helpRequestId: bid.helpRequestId,
  helperId: bid.helperId,
  message: bid.message,
  amount: bid.amount,
  status: bid.status,
  helperName: bid.helper?.profile?.fullName || bid.helper?.email || "Helper",
  helperEmail: bid.helper?.email || "",
  helperAge: calculateAge(bid.helper?.profile?.dateOfBirth),
  helperGender: bid.helper?.profile?.gender ?? null,
  helperAvatarUrl: bid.helper?.profile?.avatarUrl ?? null,
  helperLocation:
    bid.helper?.profile?.address?.formattedAddress ||
    [
      bid.helper?.profile?.address?.city,
      bid.helper?.profile?.address?.country,
    ]
      .filter(Boolean)
      .join(", ") ||
    null,
  helperRating: bid.helper?.profile?.rating ?? 0,
  helperTotalReviews: bid.helper?.profile?.totalReviews ?? 0,
  helperCompletedHelps: bid.helper?.profile?.helpCount ?? 0,
  createdAt: bid.createdAt,
  updatedAt: bid.updatedAt || bid.createdAt,
});
// PLACE BID
export const placeBid = async (req: Request, res: Response, next: NextFunction) => {
  const helperId = req.user?.userId;

  try {
    if (!helperId) return next(new AppError("Unauthorized", 401));
    const parsedBody = placeBidBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }

    const { helpRequestId, message, amount } = parsedBody.data;

    const request = await prisma.helpRequest.findUnique({ where: { id: helpRequestId } });
    if (!request) return next(new AppError("Request not found", 404));
    if (request.status !== "OPEN") return next(new AppError("Request is not open", 400));
    if (request.requesterId === helperId) {
      return next(new AppError("Cannot bid on your own request", 400));
    }

    const existingBid = await prisma.bid.findFirst({
      where: { helpRequestId, helperId },
    });
    if (existingBid) return next(new AppError("Already bid", 400));

    const bid = await prisma.bid.create({
      data: { message, amount, helperId, helpRequestId },
      include: {
        helper: {
          select: {
            id: true,
            email: true,
            profile: { select: HELPER_PROFILE_SELECT },
          },
        },
      },
    });

    await createNotification({
      userId: request.requesterId,
      actorId: helperId,
      type: NotificationType.BID_RECEIVED,
      title: "New bid received",
      body: `${bid.helper?.profile?.fullName} placed a bid on "${request.title}"`,
      requestId: request.id,
      bidId: bid.id,
      data: {
        requestTitle: request.title,
        bidAmount: bid.amount,
      },
    });

    console.log("Bid placed:", {
      bidId: bid.id,
      helpRequestId,
      helperId,
      amount,
      notification: {
        userId: request.requesterId,
        actorId: helperId,
        type: NotificationType.BID_RECEIVED,
        title: "New bid received",
        body: `${bid.helper?.profile?.fullName} placed a bid on "${request.title}"`,
        requestId: request.id,
        bidId: bid.id,
      },
    });
    sendResponse(res, formatBid(bid), "Bid placed");

  } catch (error) {
    console.error("Place Bid Error:", error);
    next(new AppError("Failed to place bid", 500));
  }
};

// GET BIDS
export const getBidsForHelpRequest = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;

  try {
    if (!userId) return next(new AppError("Unauthorized", 401));

    const helpRequestId = normalizeParamId(req.params.helpRequestId);
    if (!helpRequestId) return next(new AppError("Request not found", 404));

    const request = await prisma.helpRequest.findUnique({
      where: { id: helpRequestId },
      select: { id: true, requesterId: true },
    });

    if (!request) return next(new AppError("Request not found", 404));

    if (request.requesterId !== userId) {
      return next(new AppError("Forbidden", 403));
    }

    const bids = await prisma.bid.findMany({
      where: { helpRequestId },
      include: {
        helper: {
          select: {
            id: true,
            email: true,
            profile: { select: HELPER_PROFILE_SELECT },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedBids = bids.map(formatBid);
    sendResponse(res, formattedBids);

  } catch {
    next(new AppError("Failed to fetch bids", 500));
  }
};

// GET MY BIDS (helper activity stream)
export const getMyBids = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;

  try {
    if (!userId) return next(new AppError("Unauthorized", 401));

    const bids = await prisma.bid.findMany({
      where: { helperId: userId },
      include: {
        helper: {
          select: {
            id: true,
            email: true,
            profile: { select: { fullName: true, dateOfBirth: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    sendResponse(res, bids.map(formatBid));
  } catch {
    next(new AppError("Failed to fetch your bids", 500));
  }
};

// RESPOND TO BID
export const respondToBid = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;
  const bidId = normalizeParamId(req.params.bidId);

  try {
    if (!userId) return next(new AppError("Unauthorized", 401));

    if (!bidId) return next(new AppError("Bid not found", 404));

    const parsedBody = respondToBidBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }

    const { status } = parsedBody.data;

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        request: true,
        helper: {
          select: {
            id: true,
            email: true,
            profile: {
              select: HELPER_PROFILE_SELECT,
            },
          },
        },
      },
    });

    if (!bid) return next(new AppError("Bid not found", 404));
    if (bid.request.requesterId !== userId) return next(new AppError("Forbidden", 403));
    if (bid.status !== "PENDING") return next(new AppError("Already processed", 400));

    let autoRejectedBids: { id: string; helperId: string }[] = [];

    const { updatedBid, conversationResult } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let txConversationResult: Awaited<ReturnType<typeof ensureConversationForRequestInTransaction>> | null = null;

      if (status === "ACCEPTED") {
        autoRejectedBids = await tx.bid.findMany({
          where: {
            helpRequestId: bid.helpRequestId,
            id: { not: bidId },
            status: "PENDING",
          },
          select: {
            id: true,
            helperId: true,
          },
        });

        await tx.bid.updateMany({
          where: {
            helpRequestId: bid.helpRequestId,
            id: { not: bidId },
            status: "PENDING",
          },
          data: {
            status: "REJECTED",
          },
        });

        await tx.helpRequest.update({
          where: { id: bid.helpRequestId },
          data: {
            status: "ASSIGNED",
            assignedHelperId: bid.helperId,
          },
        });

        txConversationResult = await ensureConversationForRequestInTransaction(tx, bid.helpRequestId);
      }

      const txUpdatedBid = await tx.bid.update({
        where: { id: bidId },
        data: { status },
      });

      return {
        updatedBid: txUpdatedBid,
        conversationResult: txConversationResult,
      };
    });

    const conversation = conversationResult?.conversation ?? null;

    await createNotification({
      userId: bid.helperId,
      actorId: userId,
      type:
        status === "ACCEPTED"
          ? NotificationType.BID_ACCEPTED
          : NotificationType.BID_REJECTED,
      title:
        status === "ACCEPTED"
          ? "Your bid was accepted"
          : "Your bid was rejected",
      body:
        status === "ACCEPTED"
          ? `Your bid for "${bid.request.title}" was accepted.`
          : `Your bid for "${bid.request.title}" was rejected.`,
      requestId: bid.helpRequestId,
      bidId: bid.id,
      conversationId: conversation?.id ?? null,
      data: {
        requestTitle: bid.request.title,
        bidAmount: bid.amount,
        conversationId: conversation?.id ?? null,
        starterNote: conversationResult?.starterNote ?? null,
      },
    });

    if (status === "ACCEPTED" && autoRejectedBids.length > 0) {
      await Promise.all(
        autoRejectedBids.map((rejectedBid) =>
          createNotification({
            userId: rejectedBid.helperId,
            actorId: userId,
            type: NotificationType.BID_REJECTED,
            title: "Your bid was rejected",
            body: `Your bid for "${bid.request.title}" was rejected.`,
            requestId: bid.helpRequestId,
            bidId: rejectedBid.id,
            data: {
              requestTitle: bid.request.title,
            },
          })
        )
      );
    }

    const updatedWithHelper = await prisma.bid.findUnique({
      where: { id: updatedBid.id },
      include: {
        helper: {
          select: {
            id: true,
            email: true,
            profile: {
              select: HELPER_PROFILE_SELECT,
            },
          },
        },
      },
    });

    sendResponse(
      res,
      formatBid(updatedWithHelper || updatedBid),
      `Bid ${status.toLowerCase()}`
    );
  } catch (error) {
    console.error("Respond To Bid Error:", error);
    next(new AppError("Failed to respond", 500));
  }
};

// DELETE BID
export const deleteBid = async (req: Request, res: Response, next: NextFunction) => {
  const helperId = req.user?.userId;
  const bidId = normalizeParamId(req.params.bidId);

  try {
    if (!helperId) return next(new AppError("Unauthorized", 401));
    if (!bidId) return next(new AppError("Not found", 404));

    const bid = await prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid) return next(new AppError("Not found", 404));
    if (bid.helperId !== helperId) return next(new AppError("Forbidden", 403));
    if (bid.status !== "PENDING") return next(new AppError("Cannot delete", 400));

    await prisma.bid.delete({ where: { id: bidId } });

    sendResponse(res, null, "Bid deleted");
  } catch {
    next(new AppError("Delete failed", 500));
  }
};

export const updateBid = async (req: Request, res: Response, next: NextFunction) => {
  const helperId = req.user?.userId;
  const bidId = normalizeParamId(req.params.bidId);

  try {
    if (!helperId) return next(new AppError("Unauthorized", 401));
    if (!bidId) return next(new AppError("Bid not found", 404));
    const parsedBody = updateBidBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }

    const { message, amount } = parsedBody.data;

    const bid = await prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid) return next(new AppError("Bid not found", 404));
    if (bid.helperId !== helperId) return next(new AppError("Forbidden", 403));
    if (bid.status !== "PENDING") return next(new AppError("Cannot update a processed bid", 400));

    const updatedBid = await prisma.bid.update({
      where: { id: bidId },
      data: {
        ...(message && { message }),
        ...(amount !== undefined && { amount }),
      },
      include: {
        helper: {
          select: {
            id: true,
            email: true,
            profile: { select: HELPER_PROFILE_SELECT },
          },
        },
      },
    });

    sendResponse(res, formatBid(updatedBid), "Bid updated successfully");
  } catch (error) {
    console.error("Update Bid Error:", error);
    next(new AppError("Failed to update bid", 500));
  }
};

// Get a single bid by ID (optional)
export const getBidById = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;
  const bidId = normalizeParamId(req.params.bidId);

  try {
    if (!userId) return next(new AppError("Unauthorized", 401));
    if (!bidId) return next(new AppError("Bid not found", 404));

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        request: true,
        helper: {
          select: {
            id: true,
            email: true,
            profile: { select: HELPER_PROFILE_SELECT },
          },
        },
      },
    });

    if (!bid) return next(new AppError("Bid not found", 404));

    // Only helper or requester can view the bid
    if (bid.helperId !== userId && bid.request.requesterId !== userId) {
      return next(new AppError("Forbidden", 403));
    }

    sendResponse(res, formatBid(bid));
  } catch {
    next(new AppError("Failed to fetch bid", 500));
  }
};
