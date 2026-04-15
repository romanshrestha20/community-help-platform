import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashToken } from "../../utils/token.js";
import { makeNext, makeReq, makeRes } from "./test-utils.js";

const {
    prismaMock,
    bcryptMock,
    jwtMock,
    authTokenServiceMock,
    emailServiceMock,
    smsServiceMock,
    rateLimitServiceMock,
} = vi.hoisted(() => ({
    prismaMock: {
        userModel: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        passwordResetToken: {
            update: vi.fn(),
            deleteMany: vi.fn(),
        },
        emailVerificationToken: {
            update: vi.fn(),
            deleteMany: vi.fn(),
        },
        phoneVerificationCode: {
            findFirst: vi.fn(),
            update: vi.fn(),
            deleteMany: vi.fn(),
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
    authTokenServiceMock: {
        createPasswordResetToken: vi.fn(),
        findActivePasswordResetTokenByRawToken: vi.fn(),
        createEmailVerificationToken: vi.fn(),
        findActiveEmailVerificationTokenByRawToken: vi.fn(),
        createPhoneVerificationCode: vi.fn(),
        findLatestActivePhoneVerificationCode: vi.fn(),
    },
    emailServiceMock: {
        sendPasswordResetEmail: vi.fn(),
        sendEmailVerificationEmail: vi.fn(),
    },
    smsServiceMock: {
        sendPhoneVerificationCode: vi.fn(),
    },
    rateLimitServiceMock: {
        assertRateLimit: vi.fn(),
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

vi.mock("../../services/auth-token.service.js", () => ({
    createPasswordResetToken: authTokenServiceMock.createPasswordResetToken,
    findActivePasswordResetTokenByRawToken: authTokenServiceMock.findActivePasswordResetTokenByRawToken,
    createEmailVerificationToken: authTokenServiceMock.createEmailVerificationToken,
    findActiveEmailVerificationTokenByRawToken: authTokenServiceMock.findActiveEmailVerificationTokenByRawToken,
    createPhoneVerificationCode: authTokenServiceMock.createPhoneVerificationCode,
    findLatestActivePhoneVerificationCode: authTokenServiceMock.findLatestActivePhoneVerificationCode,
}));

vi.mock("../../services/email.service.js", () => ({
    sendPasswordResetEmail: emailServiceMock.sendPasswordResetEmail,
    sendEmailVerificationEmail: emailServiceMock.sendEmailVerificationEmail,
}));

vi.mock("../../services/sms.service.js", () => ({
    sendPhoneVerificationCode: smsServiceMock.sendPhoneVerificationCode,
}));

vi.mock("../../services/auth-rate-limit.service.js", () => ({
    assertRateLimit: rateLimitServiceMock.assertRateLimit,
}));

import {
    changePassword,
    forgotPassword,
    loginUser,
    refreshAccessToken,
    resendEmailVerification,
    registerUser,
    resetPassword,
    sendEmailVerification,
    sendPhoneCode,
    verifyEmail,
    verifyPhoneCode,
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
            expect.objectContaining({ message: "Invalid input: expected string, received undefined", statusCode: 400 }),
        );
    });

    it("registerUser: creates user and returns tokens", async () => {
        prismaMock.userModel.findFirst.mockResolvedValue(null);
        prismaMock.userModel.findUnique.mockResolvedValue(null);
        bcryptMock.hash.mockResolvedValue("hashed");
        prismaMock.userModel.create.mockResolvedValue({ id: "user-1", email: "user@example.com" });
        jwtMock.accessToken.mockReturnValue("access-token");
        jwtMock.signRefreshToken.mockReturnValue("refresh-token");
        authTokenServiceMock.createEmailVerificationToken.mockResolvedValue({
            rawToken: "verify-token",
            expiresAt: new Date("2026-04-16T10:00:00.000Z"),
        });

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
        expect(authTokenServiceMock.createEmailVerificationToken).toHaveBeenCalledWith("user-1");
        expect(emailServiceMock.sendEmailVerificationEmail).toHaveBeenCalledWith(
            expect.objectContaining({ email: "user@example.com" }),
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

    it("forgotPassword: returns generic success when user does not exist", async () => {
        prismaMock.userModel.findUnique.mockResolvedValue(null);

        const req = makeReq({
            body: { email: "missing@example.com" },
            ip: "10.0.0.1",
        });
        const res = makeRes();
        const next = makeNext();

        await forgotPassword(req, res, next);

        expect(rateLimitServiceMock.assertRateLimit).toHaveBeenCalledTimes(2);
        expect(authTokenServiceMock.createPasswordResetToken).not.toHaveBeenCalled();
        expect(emailServiceMock.sendPasswordResetEmail).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "If an account exists for this email, we sent a password reset link.",
            }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("forgotPassword: creates token and sends email when user exists", async () => {
        prismaMock.userModel.findUnique.mockResolvedValue({
            id: "user-1",
            email: "user@example.com",
        });
        authTokenServiceMock.createPasswordResetToken.mockResolvedValue({
            rawToken: "raw-reset-token",
            expiresAt: new Date("2026-04-15T10:00:00.000Z"),
        });

        const req = makeReq({
            body: { email: "user@example.com" },
            ip: "10.0.0.2",
        });
        const res = makeRes();
        const next = makeNext();

        await forgotPassword(req, res, next);

        expect(authTokenServiceMock.createPasswordResetToken).toHaveBeenCalledWith("user-1");
        expect(emailServiceMock.sendPasswordResetEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                email: "user@example.com",
                token: "raw-reset-token",
            }),
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
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

    it("resetPassword: rejects invalid token", async () => {
        authTokenServiceMock.findActivePasswordResetTokenByRawToken.mockResolvedValue(null);

        const req = makeReq({
            body: { token: "bad-token", newPassword: "new-pass-123" },
            ip: "10.0.0.3",
        });
        const res = makeRes();
        const next = makeNext();

        await resetPassword(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Reset link is invalid or has expired", statusCode: 400 }),
        );
    });

    it("resetPassword: updates password, marks token used, and deletes refresh tokens", async () => {
        authTokenServiceMock.findActivePasswordResetTokenByRawToken.mockResolvedValue({
            id: "reset-1",
            userId: "user-1",
        });
        bcryptMock.hash.mockResolvedValue("new-hash");
        prismaMock.$transaction.mockResolvedValue([]);

        const req = makeReq({
            body: { token: "good-token", newPassword: "new-pass-123" },
            ip: "10.0.0.4",
        });
        const res = makeRes();
        const next = makeNext();

        await resetPassword(req, res, next);

        expect(authTokenServiceMock.findActivePasswordResetTokenByRawToken).toHaveBeenCalledWith("good-token");
        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Password reset successfully. Please log in again.",
            }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("sendEmailVerification: sends email for authenticated unverified user", async () => {
        prismaMock.userModel.findUnique.mockResolvedValue({
            id: "user-1",
            email: "user@example.com",
            isEmailVerified: false,
        });
        authTokenServiceMock.createEmailVerificationToken.mockResolvedValue({
            rawToken: "verify-token",
            expiresAt: new Date("2026-04-16T10:00:00.000Z"),
        });

        const req = makeReq({
            user: { userId: "user-1" },
            ip: "10.0.0.5",
        });
        const res = makeRes();
        const next = makeNext();

        await sendEmailVerification(req, res, next);

        expect(authTokenServiceMock.createEmailVerificationToken).toHaveBeenCalledWith("user-1");
        expect(emailServiceMock.sendEmailVerificationEmail).toHaveBeenCalledWith(
            expect.objectContaining({ email: "user@example.com", token: "verify-token" }),
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it("resendEmailVerification: rejects already verified user", async () => {
        prismaMock.userModel.findUnique.mockResolvedValue({
            id: "user-1",
            email: "user@example.com",
            isEmailVerified: true,
        });

        const req = makeReq({
            user: { userId: "user-1" },
            ip: "10.0.0.6",
        });
        const res = makeRes();
        const next = makeNext();

        await resendEmailVerification(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Email is already verified", statusCode: 400 }),
        );
    });

    it("verifyEmail: rejects invalid verification token", async () => {
        authTokenServiceMock.findActiveEmailVerificationTokenByRawToken.mockResolvedValue(null);

        const req = makeReq({
            body: { token: "bad-verify-token" },
            ip: "10.0.0.7",
        });
        const res = makeRes();
        const next = makeNext();

        await verifyEmail(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Verification link is invalid or has expired", statusCode: 400 }),
        );
    });

    it("verifyEmail: marks user verified and returns updated user", async () => {
        authTokenServiceMock.findActiveEmailVerificationTokenByRawToken.mockResolvedValue({
            id: "email-token-1",
            userId: "user-1",
        });
        prismaMock.userModel.findUnique.mockResolvedValue({
            id: "user-1",
            email: "user@example.com",
            phone: null,
            isVerified: true,
            isEmailVerified: true,
            isPhoneVerified: false,
            createdAt: "2026-04-15T00:00:00.000Z",
            updatedAt: "2026-04-15T00:00:00.000Z",
            profile: null,
        });
        prismaMock.$transaction.mockResolvedValue([]);

        const req = makeReq({
            body: { token: "good-verify-token" },
            ip: "10.0.0.8",
        });
        const res = makeRes();
        const next = makeNext();

        await verifyEmail(req, res, next);

        expect(authTokenServiceMock.findActiveEmailVerificationTokenByRawToken).toHaveBeenCalledWith("good-verify-token");
        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Email verified successfully.",
                data: expect.objectContaining({ isEmailVerified: true }),
            }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("sendPhoneCode: sends verification code for authenticated user", async () => {
        prismaMock.userModel.findUnique.mockResolvedValue({
            id: "user-1",
            phone: "+15551234567",
            isPhoneVerified: false,
        });
        prismaMock.phoneVerificationCode.findFirst.mockResolvedValue(null);
        authTokenServiceMock.createPhoneVerificationCode.mockResolvedValue({
            rawCode: "123456",
        });

        const req = makeReq({
            user: { userId: "user-1" },
            ip: "10.0.0.9",
        });
        const res = makeRes();
        const next = makeNext();

        await sendPhoneCode(req, res, next);

        expect(authTokenServiceMock.createPhoneVerificationCode).toHaveBeenCalledWith({
            userId: "user-1",
            phone: "+15551234567",
        });
        expect(smsServiceMock.sendPhoneVerificationCode).toHaveBeenCalledWith({
            phone: "+15551234567",
            code: "123456",
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it("verifyPhoneCode: rejects incorrect code", async () => {
        prismaMock.userModel.findUnique.mockResolvedValue({
            id: "user-1",
            email: "user@example.com",
            phone: "+15551234567",
            isVerified: false,
            isEmailVerified: false,
            isPhoneVerified: false,
            createdAt: "2026-04-15T00:00:00.000Z",
            updatedAt: "2026-04-15T00:00:00.000Z",
            profile: null,
        });
        authTokenServiceMock.findLatestActivePhoneVerificationCode.mockResolvedValue({
            id: "phone-code-1",
            attempts: 0,
            codeHash: hashToken("654321"),
        });

        const req = makeReq({
            user: { userId: "user-1" },
            body: { code: "123456" },
            ip: "10.0.0.10",
        });
        const res = makeRes();
        const next = makeNext();

        await verifyPhoneCode(req, res, next);

        expect(prismaMock.phoneVerificationCode.update).toHaveBeenCalledWith({
            where: { id: "phone-code-1" },
            data: { attempts: 1 },
        });
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Verification code is incorrect", statusCode: 400 }),
        );
    });

    it("verifyPhoneCode: marks phone verified and returns updated user", async () => {
        prismaMock.userModel.findUnique.mockResolvedValue({
            id: "user-1",
            email: "user@example.com",
            phone: "+15551234567",
            isVerified: false,
            isEmailVerified: false,
            isPhoneVerified: false,
            createdAt: "2026-04-15T00:00:00.000Z",
            updatedAt: "2026-04-15T00:00:00.000Z",
            profile: null,
        });
        authTokenServiceMock.findLatestActivePhoneVerificationCode.mockResolvedValue({
            id: "phone-code-1",
            userId: "user-1",
            phone: "+15551234567",
            attempts: 0,
            codeHash: hashToken("123456"),
        });
        prismaMock.$transaction.mockResolvedValue([]);

        const req = makeReq({
            user: { userId: "user-1" },
            body: { code: "123456" },
            ip: "10.0.0.11",
        });
        const res = makeRes();
        const next = makeNext();

        await verifyPhoneCode(req, res, next);

        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Phone number verified successfully.",
                data: expect.objectContaining({ isPhoneVerified: true }),
            }),
        );
        expect(next).not.toHaveBeenCalled();
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
