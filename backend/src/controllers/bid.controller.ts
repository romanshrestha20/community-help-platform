import { prisma } from "../lib/prisma.js";
import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";
import { PrismaClient } from "../../generated/prisma/client.js";


// helper places a bid on a HelpRequest.
export const placeBid = async (req: Request, res: Response, next: NextFunction) => {
    const helperId = req.user?.userId;
    const { helpRequestId, message, amount } = req.body;
    try {

        // Validate input
        if (!helperId) return next(new AppError("Unauthorized", 401));
        if (!helpRequestId || !message || !amount) {
            return next(new AppError("All fields are required", 400));
        }

        // Check if HelpRequest exists and is open
        const helpRequest = await prisma.helpRequest.findUnique({
            where: { id: helpRequestId },
        });
        if (!helpRequest) return next(new AppError("Help request not found", 404));

        // prevent bidding on own request
        if (helpRequest.requesterId === helperId) {
            return next(new AppError("Cannot place bid on your own request", 400));
        }
        const newBid = await prisma.bid.create({
            data: {
                message,
                amount,
                helperId,
                helpRequestId,
            },
        });

        res.status(201).json({
            success: true,
            data: newBid,
            message: "Bid placed successfully",
        });
    } catch (error) {
        console.error(error);
        next(new AppError("Failed to place bid", 500));
    }
}

export const getBidsForHelpRequest = async (req: Request, res: Response, next: NextFunction) => {
    const { helpRequestId } = req.params;
    try {
        const existing = await prisma.helpRequest.findUnique({
            where: { id: helpRequestId },
        });
        if (!existing) return next(new AppError("Help request not found", 404));

        const bids = await prisma.bid.findMany({
            where: { helpRequestId },
            include: {
                helper: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                email: true,
                                fullName: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({
            success: true,
            data: bids,
            message: "Bids fetched successfully",
        });
    } catch (error) {
        console.error(error);
        next(new AppError("Failed to fetch bids", 500));
    }
}

//Update Bid (only pending)
export const updateBid = async (req: Request, res: Response, next: NextFunction) => {
    const helperId = req.user?.userId;
    const { bidId } = req.params;
    const { message, amount } = req.body;

    try {
        if (!helperId) return next(new AppError("Unauthorized", 401));
        const bid = await prisma.bid.findUnique({ where: { id: bidId } });
        if (!bid) return next(new AppError("Bid not found", 404));

        // Only the helper who placed the bid can update it, and only if it's still pending
        if (bid.helperId !== helperId) return next(new AppError("Forbidden", 403));
        if (bid.status !== "PENDING") return next(new AppError("Cannot edit bid that is already accepted/rejected", 400));

        const updatedBid = await prisma.bid.update({
            where: { id: bidId },
            data: { message, amount },
        });

        res.status(200).json({
            success: true,
            data: updatedBid,
            message: "Bid updated successfully",
        });
    } catch (error) {
        console.error(error);
        next(new AppError("Failed to update bid", 500));

    }
}

// Accept or reject a bid (only by requester, and only if bid is pending)
export const respondToBid = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    const { bidId } = req.params;
    const { status } = req.body; // "ACCEPTED" | "REJECTED"

    try {
        if (!userId) return next(new AppError("Unauthorized", 401));
        if (!["ACCEPTED", "REJECTED"].includes(status)) return next(new AppError("Invalid status", 400));

        const bid = await prisma.bid.findUnique({
            where: { id: bidId },
            include: { helpRequest: true },
        });
        if (!bid) return next(new AppError("Bid not found", 404));
        if (bid.helpRequest.requesterId !== userId) return next(new AppError("Forbidden", 403));
        if (bid.status !== "PENDING") return next(new AppError("Bid already processed", 400));

        // Transaction ensures only one accepted bid per help request
        const updatedBid = await prisma.$transaction(async (tx) => {
            if (status === "ACCEPTED") {
                await tx.bid.updateMany({
                    where: { helpRequestId: bid.helpRequestId, id: { not: bidId } },
                    data: { status: "REJECTED" },
                });
            }

            return tx.bid.update({ where: { id: bidId }, data: { status } });
        });

        res.status(200).json({ success: true, data: updatedBid, message: `Bid ${status.toLowerCase()} successfully` });
    } catch (error) {
        console.error(error);
        next(new AppError("Failed to respond to bid", 500));
    }
};

export const deleteBid = async (req: Request, res: Response, next: NextFunction) => {
    const helperId = req.user?.userId;
    const { bidId } = req.params;

    try {
        // only helper who placed the bid can delete it, and only if it's still pending
        if (!helperId) return next(new AppError("Unauthorized", 401));

        // check if bid exists and belongs to helper
        const bid = await prisma.bid.findUnique({ where: { id: bidId } });
        if (!bid) return next(new AppError("Bid not found", 404));
        // only helper who placed the bid can delete it, and only if it's still pending
        if (bid.helperId !== helperId) return next(new AppError("Forbidden", 403));
        // only pending bids can be deleted
        if (bid.status !== "PENDING") return next(new AppError("Cannot delete bid that is already accepted/rejected", 400));

        // delete bid
        await prisma.bid.delete({ where: { id: bidId } });
        res.json({ success: true, message: "Bid deleted successfully" });

    } catch (error) {
        console.error("Delete Bid error:", error);
        next(new AppError("Failed to delete bid", 500));
    }
};