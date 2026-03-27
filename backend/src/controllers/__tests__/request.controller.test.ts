import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, verifyAccessTokenMock } = vi.hoisted(() => ({
    prismaMock: {
        location: {
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        helpRequest: {
            create: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn(),
            findUnique: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
        },
        $transaction: vi.fn(),
    },
    verifyAccessTokenMock: vi.fn(),
}));

vi.mock("../lib/prisma.js", () => ({
    prisma: prismaMock,
}));

vi.mock("../utils/jwt.js", () => ({
    accessToken: vi.fn(),
    verifyAccessToken: verifyAccessTokenMock,
    signRefreshToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
}));

import app from "../../app.js";

const validRequestBody = {
    title: "Need groceries",
    description: "Need help getting groceries this week",
    category: "FOOD",
    budget: 50,
    location: {
        latitude: 27.7172,
        longitude: 85.324,
        radius: 500,
        city: "Kathmandu",
        country: "Nepal",
    },
};

describe("Help Request Controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        verifyAccessTokenMock.mockImplementation((token: string) => {
            if (token === "valid-token") return { userId: "user-1" };
            if (token === "other-token") return { userId: "user-2" };
            if (token === "empty-user-token") return {};
            throw new Error("invalid token");
        });
    });

    describe("POST /api/requests", () => {
        it("returns 401 when auth header is missing", async () => {
            const res = await request(app).post("/api/requests").send(validRequestBody);

            expect(res.status).toBe(401);
            expect(res.body.error.message).toBe("Unauthorized: No token provided");
        });

        it("returns 401 when token does not include userId", async () => {
            const res = await request(app)
                .post("/api/requests")
                .set("Authorization", "Bearer empty-user-token")
                .send(validRequestBody);

            expect(res.status).toBe(401);
            expect(res.body.error.message).toBe("Unauthorized");
        });

        it("returns 400 when required fields are missing", async () => {
            const res = await request(app)
                .post("/api/requests")
                .set("Authorization", "Bearer valid-token")
                .send({ title: "Missing fields" });

            expect(res.status).toBe(400);
            expect(res.body.error.message).toBe("All fields are required");
        });

        it("returns 400 when category is invalid", async () => {
            const res = await request(app)
                .post("/api/requests")
                .set("Authorization", "Bearer valid-token")
                .send({ ...validRequestBody, category: "INVALID" });

            expect(res.status).toBe(400);
            expect(res.body.error.message).toBe("Invalid category");
        });

        it("creates a help request successfully", async () => {
            prismaMock.location.create.mockResolvedValue({ id: "loc-1" });
            prismaMock.helpRequest.create.mockResolvedValue({
                id: "req-1",
                requesterId: "user-1",
                locationId: "loc-1",
                ...validRequestBody,
            });

            const res = await request(app)
                .post("/api/requests")
                .set("Authorization", "Bearer valid-token")
                .send(validRequestBody);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Help request created successfully");
            expect(prismaMock.location.create).toHaveBeenCalledTimes(1);
            expect(prismaMock.helpRequest.create).toHaveBeenCalledTimes(1);
        });

        it("returns 500 when create fails", async () => {
            prismaMock.location.create.mockRejectedValue(new Error("db error"));

            const res = await request(app)
                .post("/api/requests")
                .set("Authorization", "Bearer valid-token")
                .send(validRequestBody);

            expect(res.status).toBe(500);
            expect(res.body.error.message).toBe("Failed to create help request");
        });
    });

    describe("GET /api/requests", () => {
        it("returns 400 for invalid category", async () => {
            const res = await request(app).get("/api/requests?category=INVALID");

            expect(res.status).toBe(400);
            expect(res.body).toEqual({ success: false, error: "Invalid category" });
        });

        it("returns 400 for invalid status", async () => {
            const res = await request(app).get("/api/requests?status=INVALID");

            expect(res.status).toBe(400);
            expect(res.body).toEqual({ success: false, error: "Invalid status" });
        });

        it("returns paginated help requests", async () => {
            prismaMock.helpRequest.findMany.mockResolvedValue([{ id: "req-1" }]);
            prismaMock.helpRequest.count.mockResolvedValue(1);

            const res = await request(app).get("/api/requests?page=2&limit=10&category=FOOD");

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.total).toBe(1);
            expect(res.body.page).toBe(2);
            expect(res.body.totalPages).toBe(1);
            expect(prismaMock.helpRequest.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { category: "FOOD" },
                    skip: 10,
                    take: 10,
                }),
            );
        });

        it("returns 500 when fetch fails", async () => {
            prismaMock.helpRequest.findMany.mockRejectedValue(new Error("db error"));

            const res = await request(app).get("/api/requests");

            expect(res.status).toBe(500);
            expect(res.body).toEqual({ success: false, error: "Failed to fetch help requests" });
        });
    });

    describe("GET /api/requests/:id", () => {
        it("returns 401 when auth header is missing", async () => {
            const res = await request(app).get("/api/requests/req-1");

            expect(res.status).toBe(401);
            expect(res.body.error.message).toBe("Unauthorized: No token provided");
        });

        it("returns 404 when request is not found", async () => {
            prismaMock.helpRequest.findUnique.mockResolvedValue(null);

            const res = await request(app)
                .get("/api/requests/req-404")
                .set("Authorization", "Bearer valid-token");

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ success: false, error: "Not found" });
        });

        it("returns help request by id", async () => {
            prismaMock.helpRequest.findUnique.mockResolvedValue({ id: "req-1" });

            const res = await request(app)
                .get("/api/requests/req-1")
                .set("Authorization", "Bearer valid-token");

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ success: true, data: { id: "req-1" } });
        });

        it("returns 500 when lookup fails", async () => {
            prismaMock.helpRequest.findUnique.mockRejectedValue(new Error("db error"));

            const res = await request(app)
                .get("/api/requests/req-1")
                .set("Authorization", "Bearer valid-token");

            expect(res.status).toBe(500);
            expect(res.body).toEqual({ success: false, error: "Failed to fetch help request" });
        });
    });

    describe("DELETE /api/requests/:id", () => {
        it("returns 404 when request does not exist", async () => {
            prismaMock.helpRequest.findUnique.mockResolvedValue(null);

            const res = await request(app)
                .delete("/api/requests/req-404")
                .set("Authorization", "Bearer valid-token");

            expect(res.status).toBe(404);
            expect(res.body.error.message).toBe("Not found");
        });

        it("returns 403 when user is not the requester", async () => {
            prismaMock.helpRequest.findUnique.mockResolvedValue({
                id: "req-1",
                requesterId: "user-2",
                locationId: "loc-1",
            });

            const res = await request(app)
                .delete("/api/requests/req-1")
                .set("Authorization", "Bearer valid-token");

            expect(res.status).toBe(403);
            expect(res.body.error.message).toBe("Forbidden");
        });

        it("deletes request successfully", async () => {
            prismaMock.helpRequest.findUnique.mockResolvedValue({
                id: "req-1",
                requesterId: "user-1",
                locationId: "loc-1",
            });
            prismaMock.helpRequest.delete.mockResolvedValue({ id: "req-1" });
            prismaMock.location.delete.mockResolvedValue({ id: "loc-1" });
            prismaMock.$transaction.mockResolvedValue([{}, {}]);

            const res = await request(app)
                .delete("/api/requests/req-1")
                .set("Authorization", "Bearer valid-token");

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Deleted successfully");
            expect(prismaMock.helpRequest.delete).toHaveBeenCalledWith({ where: { id: "req-1" } });
            expect(prismaMock.location.delete).toHaveBeenCalledWith({ where: { id: "loc-1" } });
            expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
        });

        it("returns 500 when delete fails", async () => {
            prismaMock.helpRequest.findUnique.mockResolvedValue({
                id: "req-1",
                requesterId: "user-1",
                locationId: "loc-1",
            });
            prismaMock.helpRequest.delete.mockResolvedValue({ id: "req-1" });
            prismaMock.location.delete.mockResolvedValue({ id: "loc-1" });
            prismaMock.$transaction.mockRejectedValue(new Error("delete failed"));

            const res = await request(app)
                .delete("/api/requests/req-1")
                .set("Authorization", "Bearer valid-token");

            expect(res.status).toBe(500);
            expect(res.body.error.message).toBe("Delete failed");
        });
    });

    describe("PUT /api/requests/:id", () => {
        it("returns 404 when request does not exist", async () => {
            prismaMock.helpRequest.findUnique.mockResolvedValue(null);

            const res = await request(app)
                .put("/api/requests/req-404")
                .set("Authorization", "Bearer valid-token")
                .send({ title: "Updated" });

            expect(res.status).toBe(404);
            expect(res.body.error.message).toBe("Not found");
        });

        it("returns 403 when user is not owner", async () => {
            prismaMock.helpRequest.findUnique.mockResolvedValue({
                id: "req-1",
                requesterId: "user-2",
                locationId: "loc-1",
            });

            const res = await request(app)
                .put("/api/requests/req-1")
                .set("Authorization", "Bearer valid-token")
                .send({ title: "Updated" });

            expect(res.status).toBe(403);
            expect(res.body.error.message).toBe("Forbidden");
        });

        it("updates request and location successfully", async () => {
            prismaMock.helpRequest.findUnique.mockResolvedValue({
                id: "req-1",
                requesterId: "user-1",
                locationId: "loc-1",
            });
            prismaMock.location.update.mockResolvedValue({ id: "loc-1" });
            prismaMock.helpRequest.update.mockResolvedValue({
                id: "req-1",
                title: "Updated title",
            });

            const res = await request(app)
                .put("/api/requests/req-1")
                .set("Authorization", "Bearer valid-token")
                .send({
                    title: "Updated title",
                    location: {
                        latitude: 12.34,
                        longitude: 56.78,
                        city: "Pokhara",
                    },
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Updated successfully");
            expect(prismaMock.location.update).toHaveBeenCalledTimes(1);
            expect(prismaMock.helpRequest.update).toHaveBeenCalledTimes(1);
        });

        it("returns 500 when update fails", async () => {
            prismaMock.helpRequest.findUnique.mockResolvedValue({
                id: "req-1",
                requesterId: "user-1",
                locationId: "loc-1",
            });
            prismaMock.helpRequest.update.mockRejectedValue(new Error("update failed"));

            const res = await request(app)
                .put("/api/requests/req-1")
                .set("Authorization", "Bearer valid-token")
                .send({ title: "Updated" });

            expect(res.status).toBe(500);
            expect(res.body.error.message).toBe("Update failed");
        });
    });

    describe("PATCH /api/requests/:id/status", () => {
        it("returns 404 when request is missing", async () => {
            prismaMock.helpRequest.findUnique.mockResolvedValue(null);

            const res = await request(app)
                .patch("/api/requests/req-404/status")
                .set("Authorization", "Bearer valid-token")
                .send({ status: "ASSIGNED" });

            expect(res.status).toBe(404);
            expect(res.body.error.message).toBe("Not found");
        });

        it("returns 403 when user is not owner", async () => {
            prismaMock.helpRequest.findUnique.mockResolvedValue({
                id: "req-1",
                requesterId: "user-2",
                status: "OPEN",
            });

            const res = await request(app)
                .patch("/api/requests/req-1/status")
                .set("Authorization", "Bearer valid-token")
                .send({ status: "ASSIGNED" });

            expect(res.status).toBe(403);
            expect(res.body.error.message).toBe("Forbidden");
        });

        it("returns 400 for invalid status value", async () => {
            prismaMock.helpRequest.findUnique.mockResolvedValue({
                id: "req-1",
                requesterId: "user-1",
                status: "OPEN",
            });

            const res = await request(app)
                .patch("/api/requests/req-1/status")
                .set("Authorization", "Bearer valid-token")
                .send({ status: "INVALID" });

            expect(res.status).toBe(400);
            expect(res.body.error.message).toBe("Invalid status");
        });

        it("returns 400 for invalid transition", async () => {
            prismaMock.helpRequest.findUnique.mockResolvedValue({
                id: "req-1",
                requesterId: "user-1",
                status: "COMPLETED",
            });

            const res = await request(app)
                .patch("/api/requests/req-1/status")
                .set("Authorization", "Bearer valid-token")
                .send({ status: "OPEN" });

            expect(res.status).toBe(400);
            expect(res.body.error.message).toBe("Cannot change status from COMPLETED to OPEN");
        });

        it("updates status successfully", async () => {
            prismaMock.helpRequest.findUnique.mockResolvedValue({
                id: "req-1",
                requesterId: "user-1",
                status: "OPEN",
            });
            prismaMock.helpRequest.update.mockResolvedValue({
                id: "req-1",
                status: "ASSIGNED",
            });

            const res = await request(app)
                .patch("/api/requests/req-1/status")
                .set("Authorization", "Bearer valid-token")
                .send({ status: "ASSIGNED" });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Status updated successfully");
            expect(prismaMock.helpRequest.update).toHaveBeenCalledWith({
                where: { id: "req-1" },
                data: { status: "ASSIGNED" },
                include: { location: true },
            });
        });

        it("returns 500 when status update fails", async () => {
            prismaMock.helpRequest.findUnique.mockResolvedValue({
                id: "req-1",
                requesterId: "user-1",
                status: "OPEN",
            });
            prismaMock.helpRequest.update.mockRejectedValue(new Error("status update failed"));

            const res = await request(app)
                .patch("/api/requests/req-1/status")
                .set("Authorization", "Bearer valid-token")
                .send({ status: "ASSIGNED" });

            expect(res.status).toBe(500);
            expect(res.body.error.message).toBe("Failed to update help request status");
        });
    });
});
