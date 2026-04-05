import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeNext, makeReq, makeRes } from "./test-utils.js";

const { prismaMock } = vi.hoisted(() => ({
    prismaMock: {
        $transaction: vi.fn(),
        userModel: {
            findUnique: vi.fn(),
        },
        helpRequest: {
            create: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn(),
            findUnique: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
        },
        image: {
            create: vi.fn(),
            findFirst: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

const { helpRequestServiceMock } = vi.hoisted(() => ({
    helpRequestServiceMock: {
        getHelpRequests: vi.fn(),
    },
}));

const { cloudinaryUtilsMock } = vi.hoisted(() => ({
    cloudinaryUtilsMock: {
        uploadImageToCloudinary: vi.fn(),
        deleteImageFromCloudinary: vi.fn(),
    },
}));

vi.mock("../../lib/prisma.js", () => ({
    prisma: prismaMock,
}));

vi.mock("../../services/helpRequest.service.js", () => ({
    getHelpRequests: helpRequestServiceMock.getHelpRequests,
}));

vi.mock("../../utils/cloudinary.js", () => ({
    uploadImageToCloudinary: cloudinaryUtilsMock.uploadImageToCloudinary,
    deleteImageFromCloudinary: cloudinaryUtilsMock.deleteImageFromCloudinary,
}));

import {
    addRequestImages,
    createHelpRequest,
    deleteRequestImage,
    deleteHelpRequest,
    getAllHelpRequests,
    updateHelpRequest,
    updateHelpRequestStatus,
} from "../request.controller.js";

describe("request.controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        prismaMock.$transaction.mockImplementation(async (operations: Promise<unknown>[]) =>
            Promise.all(operations),
        );
    });

    it("createHelpRequest: returns unauthorized when user is missing", async () => {
        const req = makeReq({ body: {}, user: undefined });
        const res = makeRes();
        const next = makeNext();

        await createHelpRequest(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "Unauthorized", statusCode: 401 }));
    });

    it("createHelpRequest: creates a request successfully", async () => {
        prismaMock.userModel.findUnique.mockResolvedValue({ id: "user-1" });
        prismaMock.helpRequest.create.mockResolvedValue({ id: "req-1", title: "Need groceries" });
        prismaMock.helpRequest.findUnique.mockResolvedValue({
            id: "req-1",
            requesterId: "user-1",
            title: "Need groceries",
            description: "Help with groceries",
            category: "FOOD",
            budget: 50,
            isPaid: false,
            status: "OPEN",
            location: { latitude: 27.7, longitude: 85.3 },
            images: [],
            requester: { id: "user-1", profile: { fullName: "Roman" } },
            _count: { bids: 0 },
            createdAt: new Date(),
            updatedAt: new Date(),
        });

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
                    category: "FOOD",
                    requester: { connect: { id: "user-1" } },
                    location: expect.objectContaining({
                        create: expect.objectContaining({ latitude: 27.7, longitude: 85.3 }),
                    }),
                }),
            }),
        );
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: "Help request created" }));
        expect(next).not.toHaveBeenCalled();
    });

    it("createHelpRequest: rejects invalid category", async () => {
        prismaMock.userModel.findUnique.mockResolvedValue({ id: "user-1" });

        const req = makeReq({
            user: { userId: "user-1" },
            body: {
                title: "Need groceries",
                description: "Help with groceries",
                category: "INVALID",
                location: { latitude: 27.7, longitude: 85.3 },
            },
        });
        const res = makeRes();
        const next = makeNext();

        await createHelpRequest(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Invalid category", statusCode: 400 }),
        );
    });

    it("getAllHelpRequests: surfaces service errors as a 500", async () => {
        helpRequestServiceMock.getHelpRequests.mockRejectedValue(new Error("Invalid category"));

        const req = makeReq({ query: { category: "INVALID" } });
        const res = makeRes();
        const next = makeNext();

        await getAllHelpRequests(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "Failed to fetch requests", statusCode: 500 }));
    });

    it("getAllHelpRequests: returns formatted results with meta", async () => {
        helpRequestServiceMock.getHelpRequests.mockResolvedValue({
            requests: [
                {
                    id: "req-1",
                    requesterId: "user-1",
                    title: "Need food",
                    description: "Soon",
                    category: "FOOD",
                    budget: 20,
                    status: "OPEN",
                    isPaid: false,
                    city: "Kathmandu",
                    state: undefined,
                    country: "Nepal",
                    requesterName: "Roman",
                    bidCount: 2,
                    createdAt: new Date("2026-03-29T00:00:00.000Z"),
                },
            ],
            meta: { total: 1, page: 1, totalPages: 1 },
        });

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
        prismaMock.helpRequest.findUnique.mockResolvedValue({
            id: "req-1",
            requesterId: "user-2",
            images: [],
        });

        const req = makeReq({ user: { userId: "user-1" }, params: { id: "req-1" } });
        const res = makeRes();
        const next = makeNext();

        await deleteHelpRequest(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "Forbidden", statusCode: 403 }));
    });

    it("deleteHelpRequest: deletes request and attempts cloudinary cleanup", async () => {
        prismaMock.helpRequest.findUnique.mockResolvedValue({
            id: "req-1",
            requesterId: "user-1",
            images: [
                { id: "img-1", publicId: "cloud/a" },
                { id: "img-2", publicId: null },
            ],
        });
        prismaMock.helpRequest.delete.mockResolvedValue({ id: "req-1" });

        const req = makeReq({ user: { userId: "user-1" }, params: { id: "req-1" } });
        const res = makeRes();
        const next = makeNext();

        await deleteHelpRequest(req, res, next);

        expect(cloudinaryUtilsMock.deleteImageFromCloudinary).toHaveBeenCalledWith("cloud/a");
        expect(prismaMock.helpRequest.delete).toHaveBeenCalledWith({ where: { id: "req-1" } });
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, message: "Deleted successfully" }),
        );
        expect(next).not.toHaveBeenCalled();
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

    it("updateHelpRequest: updates fields and nested location", async () => {
        prismaMock.helpRequest.findUnique.mockResolvedValue({
            id: "req-1",
            requesterId: "user-1",
            status: "OPEN",
            locationId: "loc-1",
            location: { id: "loc-1" },
        });
        prismaMock.helpRequest.update.mockResolvedValue({
            id: "req-1",
            title: "Updated title",
            images: [{ id: "img-1", url: "u", publicId: "p" }],
            location: { id: "loc-1", latitude: 1, longitude: 2 },
            requester: { id: "user-1", profile: { fullName: "Roman" } },
            _count: { bids: 0 },
        });

        const req = makeReq({
            user: { userId: "user-1" },
            params: { id: "req-1" },
            body: {
                title: "Updated title",
                category: "FOOD",
                location: { latitude: 1, longitude: 2, city: "Kathmandu" },
            },
        });
        const res = makeRes();
        const next = makeNext();

        await updateHelpRequest(req, res, next);

        expect(prismaMock.helpRequest.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: "req-1" },
                data: expect.objectContaining({
                    title: "Updated title",
                    location: {
                        update: expect.objectContaining({ latitude: 1, longitude: 2 }),
                    },
                }),
            }),
        );
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Help request updated successfully" }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("addRequestImages: uploads images and stores DB records", async () => {
        prismaMock.helpRequest.findUnique.mockResolvedValue({
            id: "req-1",
            requesterId: "user-1",
            images: [],
        });
        cloudinaryUtilsMock.uploadImageToCloudinary
            .mockResolvedValueOnce({ url: "https://img/1", publicId: "public-1" })
            .mockResolvedValueOnce({ url: "https://img/2", publicId: "public-2" });
        prismaMock.image.create
            .mockResolvedValueOnce({ id: "img-1", url: "https://img/1", publicId: "public-1" })
            .mockResolvedValueOnce({ id: "img-2", url: "https://img/2", publicId: "public-2" });

        const req = makeReq({
            user: { userId: "user-1" },
            params: { id: "req-1" },
        });
        (req as any).files = [
            { buffer: Buffer.from("a") },
            { buffer: Buffer.from("b") },
        ];

        const res = makeRes();
        const next = makeNext();

        await addRequestImages(req, res, next);

        expect(cloudinaryUtilsMock.uploadImageToCloudinary).toHaveBeenCalledTimes(2);
        expect(prismaMock.image.create).toHaveBeenCalledTimes(2);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Request images uploaded successfully",
                data: [
                    expect.objectContaining({ id: "img-1", url: "https://img/1" }),
                    expect.objectContaining({ id: "img-2", url: "https://img/2" }),
                ],
            }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("deleteRequestImage: deletes request image", async () => {
        prismaMock.helpRequest.findUnique.mockResolvedValue({
            id: "req-1",
            requesterId: "user-1",
        });
        prismaMock.image.findFirst.mockResolvedValue({
            id: "img-1",
            requestId: "req-1",
            publicId: "public-1",
            type: "REQUEST",
        });
        prismaMock.image.delete.mockResolvedValue({ id: "img-1" });

        const req = makeReq({
            user: { userId: "user-1" },
            params: { id: "req-1", imageId: "img-1" },
        });
        const res = makeRes();
        const next = makeNext();

        await deleteRequestImage(req, res, next);

        expect(cloudinaryUtilsMock.deleteImageFromCloudinary).toHaveBeenCalledWith("public-1");
        expect(prismaMock.image.delete).toHaveBeenCalledWith({ where: { id: "img-1" } });
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, message: "Request image deleted successfully" }),
        );
        expect(next).not.toHaveBeenCalled();
    });
});
