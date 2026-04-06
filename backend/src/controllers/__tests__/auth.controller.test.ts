import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeNext, makeReq, makeRes } from "./test-utils.js";

const { prismaMock, bcryptMock, jwtMock } = vi.hoisted(() => ({
    prismaMock: {
        userModel: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        deletedAccount: {
            findUnique: vi.fn(),
        },
        refreshToken: {
            create: vi.fn(),
            findUnique: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
            deleteMany: vi.fn(),
        },
        $transaction: vi.fn(),
    },
    bcryptMock: {
        hash: vi.fn(),
        compare: vi.fn(),
    },
    jwtMock: {
        accessToken: vi.fn(),
        signRefreshToken: vi.fn(),
        verifyRefreshToken: vi.fn(),
    },
}));

vi.mock("../../lib/prisma.js", () => ({
    prisma: prismaMock,
}));

vi.mock("bcrypt", () => ({
    default: bcryptMock,
}));

vi.mock("../../utils/jwt.js", () => ({
    accessToken: jwtMock.accessToken,
    signRefreshToken: jwtMock.signRefreshToken,
    verifyRefreshToken: jwtMock.verifyRefreshToken,
}));

import {
    changePassword,
    loginUser,
    refreshAccessToken,
    registerUser,
} from "../auth.controller.js";

describe("auth.controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("registerUser: rejects missing required fields", async () => {
        const req = makeReq({ body: { email: "user@example.com" } });
        const res = makeRes();
        const next = makeNext();

        await registerUser(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Missing required fields", statusCode: 400 }),
        );
    });

    it("registerUser: creates user and returns tokens", async () => {
        prismaMock.userModel.findFirst.mockResolvedValue(null);
        prismaMock.userModel.findUnique.mockResolvedValue(null);
        bcryptMock.hash.mockResolvedValue("hashed");
        prismaMock.userModel.create.mockResolvedValue({ id: "user-1", email: "user@example.com" });
        jwtMock.accessToken.mockReturnValue("access-token");
        jwtMock.signRefreshToken.mockReturnValue("refresh-token");

        const req = makeReq({
            body: {
                email: "user@example.com",
                password: "secret123",
                phone: "9800000000",
                fullName: "Roman",
                gender: "MALE",
                dateOfBirth: "1999-01-01",
                location: { latitude: 27.7, longitude: 85.3 },
            },
        });
        const res = makeRes();
        const next = makeNext();

        await registerUser(req, res, next);

        expect(prismaMock.userModel.create).toHaveBeenCalledTimes(1);
        expect(prismaMock.refreshToken.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ userId: "user-1", token: "refresh-token" }),
            }),
        );
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, accessToken: "access-token", refreshToken: "refresh-token" }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("loginUser: returns unauthorized for invalid password", async () => {
        prismaMock.userModel.findUnique.mockResolvedValueOnce({ id: "user-1", passwordHash: "hashed" });
        bcryptMock.compare.mockResolvedValue(false);

        const req = makeReq({ body: { email: "user@example.com", password: "bad" } });
        const res = makeRes();
        const next = makeNext();

        await loginUser(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Invalid email or password", statusCode: 401 }),
        );
    });

    it("loginUser: returns gone for deleted account", async () => {
        prismaMock.userModel.findUnique.mockResolvedValueOnce(null);
        prismaMock.deletedAccount.findUnique.mockResolvedValueOnce({
            id: "deleted-1",
            email: "user@example.com",
        });

        const req = makeReq({ body: { email: "user@example.com", password: "secret" } });
        const res = makeRes();
        const next = makeNext();

        await loginUser(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "This account was deleted. Please register again if you want to continue.",
                statusCode: 410,
            }),
        );
    });

    it("refreshAccessToken: rejects expired session", async () => {
        const expired = new Date(Date.now() - 1000);
        jwtMock.verifyRefreshToken.mockReturnValue({ userId: "user-1" });
        prismaMock.refreshToken.findUnique.mockResolvedValue({ token: "old-refresh", expiresAt: expired });

        const req = makeReq({ body: { refreshToken: "old-refresh" } });
        const res = makeRes();
        const next = makeNext();

        await refreshAccessToken(req, res, next);

        expect(prismaMock.refreshToken.delete).toHaveBeenCalledWith({ where: { token: "old-refresh" } });
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Session expired. Please login again.", statusCode: 401 }),
        );
    });

    it("changePassword: updates password and invalidates tokens", async () => {
        prismaMock.userModel.findUnique.mockResolvedValue({ id: "user-1", passwordHash: "old-hash" });
        bcryptMock.compare.mockResolvedValue(true);
        bcryptMock.hash.mockResolvedValue("new-hash");
        prismaMock.$transaction.mockResolvedValue([]);

        const req = makeReq({
            user: { userId: "user-1" },
            body: { currentPassword: "old-pass", newPassword: "new-pass-123" },
        });
        const res = makeRes();
        const next = makeNext();

        await changePassword(req, res, next);

        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ status: "success", message: "Password changed successfully. Please log in again." }),
        );
        expect(next).not.toHaveBeenCalled();
    });
});
