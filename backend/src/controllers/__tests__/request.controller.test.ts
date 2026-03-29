import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeNext, makeReq, makeRes } from "./test-utils.js";

const { prismaMock } = vi.hoisted(() => ({
    prismaMock: {
        helpRequest: {
            create: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn(),
            findUnique: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock("../../lib/prisma.js", () => ({
    prisma: prismaMock,
}));

import {
    createHelpRequest,
    deleteHelpRequest,
    getAllHelpRequests,
    updateHelpRequestStatus,
} from "../request.controller.js";

describe("request.controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("createHelpRequest: returns unauthorized when user is missing", async () => {
        const req = makeReq({ body: {}, user: undefined });
        const res = makeRes();
        const next = makeNext();

        await createHelpRequest(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "Unauthorized", statusCode: 401 }));
    });

    it("createHelpRequest: creates a request successfully", async () => {
        prismaMock.helpRequest.create.mockResolvedValue({ id: "req-1", title: "Need groceries" });

        const req = makeReq({
            user: { userId: "user-1" },
            body: {
                title: "Need groceries",
                description: "Help with groceries",
                category: "FOOD",
                budget: 50,
                location: { latitude: 27.7, longitude: 85.3 },
            },
        });
        const res = makeRes();
        const next = makeNext();

        await createHelpRequest(req, res, next);

        expect(prismaMock.helpRequest.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    requesterId: "user-1",
                    category: "FOOD",
                }),
                include: { location: true },
            }),
        );
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: "Help request created" }));
        expect(next).not.toHaveBeenCalled();
    });

    it("getAllHelpRequests: validates invalid category", async () => {
        const req = makeReq({ query: { category: "INVALID" } });
        const res = makeRes();
        const next = makeNext();

        await getAllHelpRequests(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "Invalid category", statusCode: 400 }));
    });

    it("getAllHelpRequests: returns formatted results with meta", async () => {
        prismaMock.helpRequest.findMany.mockResolvedValue([
            {
                id: "req-1",
                title: "Need food",
                description: "Soon",
                category: "FOOD",
                budget: 20,
                status: "OPEN",
                isPaid: false,
                location: { city: "Kathmandu", country: "Nepal" },
                requester: { profile: { fullName: "Roman" } },
                _count: { bids: 2 },
                createdAt: new Date("2026-03-29T00:00:00.000Z"),
            },
        ]);
        prismaMock.helpRequest.count.mockResolvedValue(1);

        const req = makeReq({ query: { page: "1", limit: "10", category: "FOOD" } });
        const res = makeRes();
        const next = makeNext();

        await getAllHelpRequests(req, res, next);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: [expect.objectContaining({ requesterName: "Roman", bidCount: 2 })],
                meta: expect.objectContaining({ total: 1, page: 1, totalPages: 1 }),
            }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("deleteHelpRequest: forbids deleting another user's request", async () => {
        prismaMock.helpRequest.findUnique.mockResolvedValue({ id: "req-1", requesterId: "user-2" });

        const req = makeReq({ user: { userId: "user-1" }, params: { id: "req-1" } });
        const res = makeRes();
        const next = makeNext();

        await deleteHelpRequest(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "Forbidden", statusCode: 403 }));
    });

    it("updateHelpRequestStatus: rejects invalid transition", async () => {
        prismaMock.helpRequest.findUnique.mockResolvedValue({
            id: "req-1",
            requesterId: "user-1",
            status: "COMPLETED",
        });

        const req = makeReq({
            user: { userId: "user-1" },
            params: { id: "req-1" },
            body: { status: "OPEN" },
        });
        const res = makeRes();
        const next = makeNext();

        await updateHelpRequestStatus(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Invalid status transition", statusCode: 400 }),
        );
    });
});
