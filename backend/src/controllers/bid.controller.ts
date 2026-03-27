import { prisma } from "../lib/prisma.js";
import { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError.js";
// Centralized response
const sendResponse = (res: Response, data: any = null, message = "") => {
  res.json({ success: true, data, message });
};

// Centralized error logging
const handleError = (next: NextFunction, message: string, statusCode = 500, error?: any) => {
  if (error) console.error("Bid Controller Error:", error);
  return next(new AppError(message, statusCode));
};

// Format bid for consistent responses
const formatBid = (bid: any) => ({
  id: bid.id,
  message: bid.message,
  amount: bid.amount,
  status: bid.status,
  helperName: bid.helper?.profile?.fullName || null,
  createdAt: bid.createdAt,
});
// PLACE BID
export const placeBid = async (req: Request, res: Response, next: NextFunction) => {
  const helperId = req.user?.userId;
  const { helpRequestId, message, amount } = req.body;

  try {
    if (!helperId) return next(new AppError("Unauthorized", 401));
    if (!helpRequestId || !message || !amount) {
      return next(new AppError("All fields are required", 400));
    }
    if (amount <= 0) return next(new AppError("Invalid amount", 400));

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
    });

    sendResponse(res, formatBid(bid), "Bid placed");
  } catch {
    next(new AppError("Failed to place bid", 500));
  }
};

// GET BIDS
export const getBidsForHelpRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { helpRequestId } = req.params;

    const bids = await prisma.bid.findMany({
      where: { helpRequestId },
      include: {
        helper: {
          select: {
            id: true,
            profile: { select: { fullName: true } },
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

// RESPOND TO BID
export const respondToBid = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;
  const { bidId } = req.params;
  const { status } = req.body;

  try {
    if (!userId) return next(new AppError("Unauthorized", 401));
    if (!["ACCEPTED", "REJECTED"].includes(status)) {
      return next(new AppError("Invalid status", 400));
    }

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { helpRequest: true },
    });

    if (!bid) return next(new AppError("Bid not found", 404));
    if (bid.helpRequest.requesterId !== userId) return next(new AppError("Forbidden", 403));
    if (bid.status !== "PENDING") return next(new AppError("Already processed", 400));

    const updated = await prisma.$transaction(async (tx: any) => {
      if (status === "ACCEPTED") {
        await tx.bid.updateMany({
          where: { helpRequestId: bid.helpRequestId, id: { not: bidId } },
          data: { status: "REJECTED" },
        });

        await tx.helpRequest.update({
          where: { id: bid.helpRequestId },
          data: { status: "ASSIGNED" },
        });
      }

      return tx.bid.update({ where: { id: bidId }, data: { status } });
    });

    sendResponse(res, formatBid({ ...updated, helper: { profile: { fullName: "" } } }), `Bid ${status.toLowerCase()}`);
  } catch {
    next(new AppError("Failed to respond", 500));
  }
};

// DELETE BID
export const deleteBid = async (req: Request, res: Response, next: NextFunction) => {
  const helperId = req.user?.userId;
  const { bidId } = req.params;

  try {
    if (!helperId) return next(new AppError("Unauthorized", 401));

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
  const { bidId } = req.params;
  const { message, amount } = req.body;

  try {
    if (!helperId) return next(new AppError("Unauthorized", 401));
    if (!message && (amount === undefined || amount === null)) {
      return next(new AppError("At least one field (message or amount) is required", 400));
    }
    if (amount !== undefined && amount <= 0) return next(new AppError("Amount must be greater than 0", 400));

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
    });

    sendResponse(res, updatedBid, "Bid updated successfully");
  } catch (error) {
    console.error("Update Bid Error:", error);
    next(new AppError("Failed to update bid", 500));
  }
};

// Get a single bid by ID (optional)
export const getBidById = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;
  const { bidId } = req.params;

  try {
    if (!userId) return next(new AppError("Unauthorized", 401));

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        helpRequest: true,
        helper: { select: { id: true, profile: { select: { fullName: true } } } },
      },
    });

    if (!bid) return next(new AppError("Bid not found", 404));

    // Only helper or requester can view the bid
    if (bid.helperId !== userId && bid.helpRequest.requesterId !== userId) {
      return next(new AppError("Forbidden", 403));
    }

    sendResponse(res, formatBid(bid));
  } catch {
    next(new AppError("Failed to fetch bid", 500));
  }
};