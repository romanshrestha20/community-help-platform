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

const { notificationServiceMock } = vi.hoisted(() => ({
    notificationServiceMock: {
        createNotification: vi.fn(),
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

vi.mock("../../services/notification.service.js", () => ({
    createNotification: notificationServiceMock.createNotification,
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

    it("updateHelpRequestStatus: marks request completed and notifies assigned helper", async () => {
        prismaMock.helpRequest.findUnique.mockResolvedValue({
            id: "req-1",
            requesterId: "user-1",
            assignedHelperId: "helper-1",
            status: "ASSIGNED",
            title: "Need help",
        });
        prismaMock.helpRequest.update.mockResolvedValue({
            id: "req-1",
            status: "COMPLETED",
            images: [],
        });

        const req = makeReq({
            user: { userId: "user-1" },
            params: { id: "req-1" },
            body: { status: "COMPLETED" },
        });
        const res = makeRes();
        const next = makeNext();

        await updateHelpRequestStatus(req, res, next);

        expect(notificationServiceMock.createNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: "helper-1",
                actorId: "user-1",
                type: "REQUEST_COMPLETED",
                title: "Request marked as completed",
                requestId: "req-1",
            }),
        );
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Status changed to COMPLETED" }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("updateHelpRequestStatus: marks request cancelled and notifies assigned helper", async () => {
        prismaMock.helpRequest.findUnique.mockResolvedValue({
            id: "req-2",
            requesterId: "user-1",
            assignedHelperId: "helper-2",
            status: "ASSIGNED",
            title: "Need help again",
        });
        prismaMock.helpRequest.update.mockResolvedValue({
            id: "req-2",
            status: "CANCELLED",
            images: [],
        });

        const req = makeReq({
            user: { userId: "user-1" },
            params: { id: "req-2" },
            body: { status: "CANCELLED" },
        });
        const res = makeRes();
        const next = makeNext();

        await updateHelpRequestStatus(req, res, next);

        expect(notificationServiceMock.createNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: "helper-2",
                actorId: "user-1",
                type: "REQUEST_CANCELLED",
                title: "Request was cancelled",
                requestId: "req-2",
            }),
        );
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Status changed to CANCELLED" }),
        );
        expect(next).not.toHaveBeenCalled();
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

    // Multiple Image Upload Tests
    it("createHelpRequest: uploads 3 images successfully", async () => {
        prismaMock.userModel.findUnique.mockResolvedValue({ id: "user-1" });
        prismaMock.helpRequest.create.mockResolvedValue({ id: "req-1", title: "Help needed" });
        cloudinaryUtilsMock.uploadImageToCloudinary
            .mockResolvedValueOnce({ url: "https://img/1", publicId: "public-1" })
            .mockResolvedValueOnce({ url: "https://img/2", publicId: "public-2" })
            .mockResolvedValueOnce({ url: "https://img/3", publicId: "public-3" });
        prismaMock.$transaction.mockResolvedValueOnce([
            { id: "img-1", url: "https://img/1", publicId: "public-1" },
            { id: "img-2", url: "https://img/2", publicId: "public-2" },
            { id: "img-3", url: "https://img/3", publicId: "public-3" },
        ]);
        prismaMock.helpRequest.findUnique.mockResolvedValue({
            id: "req-1",
            title: "Help needed",
            description: "Need help",
            category: "FOOD",
            budget: 100,
            isPaid: false,
            status: "OPEN",
            location: { latitude: 27.7, longitude: 85.3 },
            images: [
                { id: "img-1", url: "https://img/1", publicId: "public-1" },
                { id: "img-2", url: "https://img/2", publicId: "public-2" },
                { id: "img-3", url: "https://img/3", publicId: "public-3" },
            ],
            requester: { id: "user-1", profile: { fullName: "Roman" } },
            _count: { bids: 0 },
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const req = makeReq({
            user: { userId: "user-1" },
            body: {
                title: "Help needed",
                description: "Need help",
                category: "FOOD",
                budget: 100,
                location: { latitude: 27.7, longitude: 85.3 },
            },
        });
        (req as any).files = [
            { buffer: Buffer.from("image1") },
            { buffer: Buffer.from("image2") },
            { buffer: Buffer.from("image3") },
        ];
        const res = makeRes();
        const next = makeNext();

        await createHelpRequest(req, res, next);

        expect(cloudinaryUtilsMock.uploadImageToCloudinary).toHaveBeenCalledTimes(3);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Help request created",
                data: expect.objectContaining({
                    id: "req-1",
                    images: [
                        expect.objectContaining({ id: "img-1", url: "https://img/1" }),
                        expect.objectContaining({ id: "img-2", url: "https://img/2" }),
                        expect.objectContaining({ id: "img-3", url: "https://img/3" }),
                    ],
                }),
            }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("createHelpRequest: uploads 5 images successfully (max limit)", async () => {
        prismaMock.userModel.findUnique.mockResolvedValue({ id: "user-1" });
        prismaMock.helpRequest.create.mockResolvedValue({ id: "req-1", title: "Help needed" });

        const imageData = Array.from({ length: 5 }, (_, i) => ({
            url: `https://img/${i + 1}`,
            publicId: `public-${i + 1}`,
        }));

        imageData.forEach((img) => {
            cloudinaryUtilsMock.uploadImageToCloudinary.mockResolvedValueOnce(img);
        });

        const dbImages = imageData.map((img, i) => ({
            id: `img-${i + 1}`,
            ...img,
        }));

        prismaMock.$transaction.mockResolvedValueOnce(dbImages);
        prismaMock.helpRequest.findUnique.mockResolvedValue({
            id: "req-1",
            title: "Help needed",
            description: "Need help with images",
            category: "MEDICAL",
            budget: 500,
            isPaid: true,
            status: "OPEN",
            location: { latitude: 27.7, longitude: 85.3 },
            images: dbImages,
            requester: { id: "user-1", profile: { fullName: "Roman" } },
            _count: { bids: 0 },
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const req = makeReq({
            user: { userId: "user-1" },
            body: {
                title: "Help needed",
                description: "Need help with images",
                category: "MEDICAL",
                budget: 500,
                isPaid: true,
                location: { latitude: 27.7, longitude: 85.3 },
            },
        });
        (req as any).files = Array.from({ length: 5 }, (_, i) => ({
            buffer: Buffer.from(`image${i + 1}`),
        }));
        const res = makeRes();
        const next = makeNext();

        await createHelpRequest(req, res, next);

        expect(cloudinaryUtilsMock.uploadImageToCloudinary).toHaveBeenCalledTimes(5);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Help request created",
                data: expect.objectContaining({
                    id: "req-1",
                    images: expect.any(Array),
                }),
            }),
        );
        const responseData = (res.json as any).mock.calls[0][0].data;
        expect(responseData.images).toHaveLength(5);
        expect(next).not.toHaveBeenCalled();
    });

    it("addRequestImages: adds 3 images to existing request", async () => {
        prismaMock.helpRequest.findUnique.mockResolvedValue({
            id: "req-1",
            requesterId: "user-1",
            images: [{ id: "img-0", url: "https://img/0", publicId: "public-0" }],
        });
        cloudinaryUtilsMock.uploadImageToCloudinary
            .mockResolvedValueOnce({ url: "https://img/1", publicId: "public-1" })
            .mockResolvedValueOnce({ url: "https://img/2", publicId: "public-2" })
            .mockResolvedValueOnce({ url: "https://img/3", publicId: "public-3" });
        prismaMock.$transaction.mockResolvedValueOnce([
            { id: "img-1", url: "https://img/1", publicId: "public-1" },
            { id: "img-2", url: "https://img/2", publicId: "public-2" },
            { id: "img-3", url: "https://img/3", publicId: "public-3" },
        ]);

        const req = makeReq({
            user: { userId: "user-1" },
            params: { id: "req-1" },
        });
        (req as any).files = [
            { buffer: Buffer.from("image1") },
            { buffer: Buffer.from("image2") },
            { buffer: Buffer.from("image3") },
        ];
        const res = makeRes();
        const next = makeNext();

        await addRequestImages(req, res, next);

        expect(cloudinaryUtilsMock.uploadImageToCloudinary).toHaveBeenCalledTimes(3);
        expect(prismaMock.$transaction).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Request images uploaded successfully",
                data: expect.arrayContaining([
                    expect.objectContaining({ id: "img-1" }),
                    expect.objectContaining({ id: "img-2" }),
                    expect.objectContaining({ id: "img-3" }),
                ]),
            }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("createHelpRequest: rolls back uploaded images on DB transaction failure", async () => {
        prismaMock.userModel.findUnique.mockResolvedValue({ id: "user-1" });
        prismaMock.helpRequest.create.mockResolvedValue({ id: "req-1" });
        cloudinaryUtilsMock.uploadImageToCloudinary
            .mockResolvedValueOnce({ url: "https://img/1", publicId: "public-1" })
            .mockResolvedValueOnce({ url: "https://img/2", publicId: "public-2" });
        prismaMock.$transaction.mockRejectedValueOnce(new Error("DB transaction failed"));

        const req = makeReq({
            user: { userId: "user-1" },
            body: {
                title: "Help needed",
                description: "Need help",
                category: "FOOD",
                location: { latitude: 27.7, longitude: 85.3 },
            },
        });
        (req as any).files = [
            { buffer: Buffer.from("image1") },
            { buffer: Buffer.from("image2") },
        ];
        const res = makeRes();
        const next = makeNext();

        await createHelpRequest(req, res, next);

        // Verify Cloudinary images were attempted to be deleted
        expect(cloudinaryUtilsMock.deleteImageFromCloudinary).toHaveBeenCalledWith("public-1");
        expect(cloudinaryUtilsMock.deleteImageFromCloudinary).toHaveBeenCalledWith("public-2");
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "Failed to create help request" }));
    });

    it("addRequestImages: rejects request with no images", async () => {
        prismaMock.helpRequest.findUnique.mockResolvedValue({
            id: "req-1",
            requesterId: "user-1",
        });

        const req = makeReq({
            user: { userId: "user-1" },
            params: { id: "req-1" },
        });
        (req as any).files = [];
        const res = makeRes();
        const next = makeNext();

        await addRequestImages(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: "At least one image is required", statusCode: 400 }),
        );
    });

    it("addRequestImages: forbids adding images to another user's request", async () => {
        prismaMock.helpRequest.findUnique.mockResolvedValue({
            id: "req-1",
            requesterId: "user-2",
            images: [],
        });

        const req = makeReq({
            user: { userId: "user-1" },
            params: { id: "req-1" },
        });
        (req as any).files = [{ buffer: Buffer.from("image") }];
        const res = makeRes();
        const next = makeNext();

        await addRequestImages(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "You are not allowed to add images to this request",
                statusCode: 403,
            }),
        );
    });

    it("addRequestImages: rolls back images on transaction failure", async () => {
        prismaMock.helpRequest.findUnique.mockResolvedValue({
            id: "req-1",
            requesterId: "user-1",
            images: [],
        });
        cloudinaryUtilsMock.uploadImageToCloudinary
            .mockResolvedValueOnce({ url: "https://img/1", publicId: "public-1" })
            .mockResolvedValueOnce({ url: "https://img/2", publicId: "public-2" });
        prismaMock.$transaction.mockRejectedValueOnce(new Error("Transaction failed"));

        const req = makeReq({
            user: { userId: "user-1" },
            params: { id: "req-1" },
        });
        (req as any).files = [
            { buffer: Buffer.from("image1") },
            { buffer: Buffer.from("image2") },
        ];
        const res = makeRes();
        const next = makeNext();

        await addRequestImages(req, res, next);

        expect(cloudinaryUtilsMock.deleteImageFromCloudinary).toHaveBeenCalledWith("public-1");
        expect(cloudinaryUtilsMock.deleteImageFromCloudinary).toHaveBeenCalledWith("public-2");
        expect(next).toHaveBeenCalled();
    });
});
