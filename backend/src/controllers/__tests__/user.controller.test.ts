import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeNext, makeReq, makeRes } from "./test-utils.js";

const { prismaMock } = vi.hoisted(() => ({
    prismaMock: {
        userModel: {
            findUnique: vi.fn(),
            delete: vi.fn(),
        },
        profile: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock("../../lib/prisma.js", () => ({
    prisma: prismaMock,
}));

vi.mock("bcrypt", () => ({
    default: {
        hash: vi.fn(),
        compare: vi.fn(),
    },
}));

import { deleteUserAccount, getUserProfile, updateUserProfile } from "../user.controller.js";

describe("user.controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("getUserProfile: rejects unauthenticated requests", async () => {
        const req = makeReq({ user: undefined });
        const res = makeRes();
        const next = makeNext();

        await getUserProfile(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "Unauthorized", statusCode: 401 }));
    });

    it("getUserProfile: returns profile payload", async () => {
        prismaMock.userModel.findUnique.mockResolvedValue({
            id: "user-1",
            email: "user@example.com",
            phone: "9800000000",
            profile: { fullName: "Roman" },
        });

        const req = makeReq({ user: { userId: "user-1" } });
        const res = makeRes();
        const next = makeNext();

        await getUserProfile(req, res, next);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ userId: "user-1", email: "user@example.com", profile: { fullName: "Roman" } }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("updateUserProfile: upserts profile fields", async () => {
        prismaMock.profile.findUnique.mockResolvedValue({
            userId: "user-1",
            addressId: null,
        });
        prismaMock.profile.update.mockResolvedValue({
            id: "profile-1",
            fullName: "Roman",
        });

        const req = makeReq({
            user: { userId: "user-1" },
            body: {
                fullName: "Roman",
                bio: "Volunteer",
                gender: "MALE",
                dateOfBirth: "2000-01-01",
            },
        });
        const res = makeRes();
        const next = makeNext();

        await updateUserProfile(req, res, next);

        expect(prismaMock.profile.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({ where: { userId: "user-1" } }),
        );
        expect(prismaMock.profile.update).toHaveBeenCalledWith(
            expect.objectContaining({ where: { userId: "user-1" } }),
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ status: "success", message: "Profile updated successfully" }),
        );
    });

    it("deleteUserAccount: deletes authenticated user", async () => {
        prismaMock.userModel.delete.mockResolvedValue({ id: "user-1" });

        const req = makeReq({ user: { userId: "user-1" } });
        const res = makeRes();
        const next = makeNext();

        await deleteUserAccount(req, res, next);

        expect(prismaMock.userModel.delete).toHaveBeenCalledWith({ where: { id: "user-1" } });
        expect(res.json).toHaveBeenCalledWith({ message: "User account deleted successfully" });
        expect(next).not.toHaveBeenCalled();
    });
});
