import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeNext, makeReq, makeRes } from "./test-utils.js";

const { prismaMock } = vi.hoisted(() => ({
    prismaMock: {
        helpRequest: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        bid: {
            findFirst: vi.fn(),
            create: vi.fn(),
            findUnique: vi.fn(),
            updateMany: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

vi.mock("../../lib/prisma.js", () => ({
    prisma: prismaMock,
}));

import { deleteBid, placeBid, respondToBid } from "../bid.controller.js";

describe("bid.controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("placeBid: validates amount", async () => {
        const req = makeReq({ user: { userId: "helper-1" }, body: { helpRequestId: "req-1", message: "I can help", amount: 0 } });
        const res = makeRes();
        const next = makeNext();

        await placeBid(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "Invalid amount", statusCode: 400 }));
    });

    it("placeBid: creates bid successfully", async () => {
        prismaMock.helpRequest.findUnique.mockResolvedValue({ id: "req-1", status: "OPEN", requesterId: "requester-1" });
        prismaMock.bid.findFirst.mockResolvedValue(null);
        prismaMock.bid.create.mockResolvedValue({
            id: "bid-1",
            message: "I can help",
            amount: 40,
            status: "PENDING",
            helper: null,
            createdAt: new Date("2026-03-29T00:00:00.000Z"),
        });

        const req = makeReq({ user: { userId: "helper-1" }, body: { helpRequestId: "req-1", message: "I can help", amount: 40 } });
        const res = makeRes();
        const next = makeNext();

        await placeBid(req, res, next);

        expect(prismaMock.bid.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { message: "I can help", amount: 40, helperId: "helper-1", helpRequestId: "req-1" },
            }),
        );
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: "Bid placed" }));
        expect(next).not.toHaveBeenCalled();
    });

    it("respondToBid: accepts bid and updates request state", async () => {
        prismaMock.bid.findUnique.mockResolvedValue({
            id: "bid-1",
            helpRequestId: "req-1",
            status: "PENDING",
            helpRequest: { requesterId: "requester-1" },
        });
        prismaMock.$transaction.mockImplementation(async (fn: any) => {
            const tx = {
                bid: {
                    updateMany: vi.fn(),
                    update: vi.fn().mockResolvedValue({
                        id: "bid-1",
                        status: "ACCEPTED",
                        message: "ok",
                        amount: 30,
                        createdAt: new Date("2026-03-29T00:00:00.000Z"),
                    }),
                },
                helpRequest: {
                    update: vi.fn(),
                },
            };
            return fn(tx);
        });

        const req = makeReq({
            user: { userId: "requester-1" },
            params: { bidId: "bid-1" },
            body: { status: "ACCEPTED" },
        });
        const res = makeRes();
        const next = makeNext();

        await respondToBid(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: "Bid accepted" }));
        expect(next).not.toHaveBeenCalled();
    });

    it("deleteBid: blocks deletion for non-pending bid", async () => {
        prismaMock.bid.findUnique.mockResolvedValue({ id: "bid-1", helperId: "helper-1", status: "ACCEPTED" });

        const req = makeReq({ user: { userId: "helper-1" }, params: { bidId: "bid-1" } });
        const res = makeRes();
        const next = makeNext();

        await deleteBid(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "Cannot delete", statusCode: 400 }));
    });
});
