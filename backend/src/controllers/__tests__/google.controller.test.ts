import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeNext, makeReq, makeRes } from "./test-utils.js";

const { googleServiceMock } = vi.hoisted(() => ({
    googleServiceMock: {
        googleSignIn: vi.fn(),
        googleSignInForDevelopment: vi.fn(),
    },
}));

vi.mock("../../services/google.service.js", () => ({
    AuthService: class AuthServiceMock {
        googleSignIn = googleServiceMock.googleSignIn;
        googleSignInForDevelopment = googleServiceMock.googleSignInForDevelopment;
    },
}));

import { googleLogin } from "../google.controller.js";

describe("google.controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete process.env.ALLOW_DEV_OAUTH;
    });

    it("rejects requests without an id token when dev oauth is disabled", async () => {
        const req = makeReq({ body: {} });
        const res = makeRes();
        const next = makeNext();

        await googleLogin(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "idToken is required. Please provide a valid Google ID token in the request body.",
                statusCode: 400,
            }),
        );
        expect(googleServiceMock.googleSignIn).not.toHaveBeenCalled();
        expect(googleServiceMock.googleSignInForDevelopment).not.toHaveBeenCalled();
    });

    it("uses the development fallback when ALLOW_DEV_OAUTH is enabled", async () => {
        process.env.ALLOW_DEV_OAUTH = "true";
        googleServiceMock.googleSignInForDevelopment.mockResolvedValue({
            isNewUser: true,
            accessToken: "access-token",
            refreshToken: "refresh-token",
            user: { id: "user-1", email: "dev@example.com", phone: null, isVerified: true },
        });

        const req = makeReq({
            body: {
                email: "dev@example.com",
                name: "Dev User",
            },
        });
        const res = makeRes();
        const next = makeNext();

        await googleLogin(req, res, next);

        expect(googleServiceMock.googleSignInForDevelopment).toHaveBeenCalledWith({
            email: "dev@example.com",
            fullName: "Dev User",
            providerId: "dev",
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Google sign-up successful",
                accessToken: "access-token",
                refreshToken: "refresh-token",
            }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("verifies an id token and returns google sign-in payload", async () => {
        googleServiceMock.googleSignIn.mockResolvedValue({
            isNewUser: false,
            accessToken: "access-token",
            refreshToken: "refresh-token",
            user: { id: "user-1", email: "user@example.com", phone: null, isVerified: true },
        });

        const req = makeReq({ body: { idToken: "google-id-token" } });
        const res = makeRes();
        const next = makeNext();

        await googleLogin(req, res, next);

        expect(googleServiceMock.googleSignIn).toHaveBeenCalledWith({ idToken: "google-id-token" });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Google login successful",
                accessToken: "access-token",
                refreshToken: "refresh-token",
            }),
        );
        expect(next).not.toHaveBeenCalled();
    });
});