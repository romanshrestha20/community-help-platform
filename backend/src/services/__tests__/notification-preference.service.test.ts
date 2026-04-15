import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
    prismaMock: {
        notificationPreference: {
            upsert: vi.fn(),
        },
    },
}));

vi.mock("../../lib/prisma.js", () => ({
    prisma: prismaMock,
}));

import {
    filterNotificationTypesByPreferences,
    getDefaultNotificationPreferences,
    getNotificationPreferencesForUser,
    isNotificationTypeEnabled,
    updateNotificationPreferencesForUser,
} from "../notification-preference.service.js";

describe("notification-preference.service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("getDefaultNotificationPreferences: returns expected defaults", () => {
        expect(getDefaultNotificationPreferences()).toEqual({
            pushEnabled: true,
            messagesEnabled: true,
            bidsEnabled: true,
            requestUpdatesEnabled: true,
            savedRequestsEnabled: false,
        });
    });

    it("getNotificationPreferencesForUser: upserts defaults for a user", async () => {
        prismaMock.notificationPreference.upsert.mockResolvedValue({
            pushEnabled: true,
            messagesEnabled: true,
            bidsEnabled: true,
            requestUpdatesEnabled: true,
            savedRequestsEnabled: false,
        });

        const result = await getNotificationPreferencesForUser("user-1");

        expect(prismaMock.notificationPreference.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { userId: "user-1" },
                create: expect.objectContaining({
                    userId: "user-1",
                    pushEnabled: true,
                    messagesEnabled: true,
                    bidsEnabled: true,
                    requestUpdatesEnabled: true,
                    savedRequestsEnabled: false,
                }),
            })
        );
        expect(result).toEqual(
            expect.objectContaining({
                pushEnabled: true,
                savedRequestsEnabled: false,
            })
        );
    });

    it("updateNotificationPreferencesForUser: merges updates with current preferences", async () => {
        prismaMock.notificationPreference.upsert
            .mockResolvedValueOnce({
                pushEnabled: true,
                messagesEnabled: true,
                bidsEnabled: true,
                requestUpdatesEnabled: true,
                savedRequestsEnabled: false,
            })
            .mockResolvedValueOnce({
                pushEnabled: true,
                messagesEnabled: false,
                bidsEnabled: true,
                requestUpdatesEnabled: true,
                savedRequestsEnabled: false,
            });

        const result = await updateNotificationPreferencesForUser("user-1", {
            messagesEnabled: false,
        });

        expect(prismaMock.notificationPreference.upsert).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                where: { userId: "user-1" },
                update: {
                    pushEnabled: true,
                    messagesEnabled: false,
                    bidsEnabled: true,
                    requestUpdatesEnabled: true,
                    savedRequestsEnabled: false,
                },
            })
        );
        expect(result.messagesEnabled).toBe(false);
    });

    it("isNotificationTypeEnabled: disables all categories when push is off", () => {
        const preferences = {
            pushEnabled: false,
            messagesEnabled: true,
            bidsEnabled: true,
            requestUpdatesEnabled: true,
            savedRequestsEnabled: true,
        };

        expect(isNotificationTypeEnabled("MESSAGE_RECEIVED", preferences)).toBe(false);
        expect(isNotificationTypeEnabled("BID_RECEIVED", preferences)).toBe(false);
        expect(isNotificationTypeEnabled("REQUEST_ASSIGNED", preferences)).toBe(false);
    });

    it("filterNotificationTypesByPreferences: keeps only enabled categories", () => {
        const preferences = {
            pushEnabled: true,
            messagesEnabled: false,
            bidsEnabled: true,
            requestUpdatesEnabled: false,
            savedRequestsEnabled: false,
        };

        const result = filterNotificationTypesByPreferences(
            [
                "MESSAGE_RECEIVED",
                "BID_RECEIVED",
                "REQUEST_ASSIGNED",
                "SYSTEM",
            ],
            preferences
        );

        expect(result).toEqual(["BID_RECEIVED", "SYSTEM"]);
    });
});
