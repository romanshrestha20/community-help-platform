import { describe, expect, it } from "vitest";

import type { AppNotification } from "../types/notification.types";

import { getDefaultNotificationPreferences } from "@/utils/notificationPreference";

import {
  filterNotificationsByPreferences,
  isNotificationEnabled,
  isNotificationTypeEnabled,
} from "./notification-preferences";

const baseNotification = (type: AppNotification["type"]): AppNotification => ({
  id: `${type}-1`,
  type,
  title: type,
  body: "Body",
  isRead: false,
  createdAt: "2026-06-20T10:00:00.000Z",
});

describe("notification-preferences", () => {
  it("respects push master toggle and type-specific preference groups", () => {
    const base = getDefaultNotificationPreferences();

    expect(isNotificationTypeEnabled("SYSTEM", base)).toBe(true);
    expect(isNotificationTypeEnabled("MESSAGE_RECEIVED", { ...base, pushEnabled: false })).toBe(false);
    expect(isNotificationTypeEnabled("MESSAGE_RECEIVED", { ...base, messagesEnabled: false })).toBe(false);
    expect(isNotificationTypeEnabled("BID_RECEIVED", { ...base, bidsEnabled: false })).toBe(false);
    expect(isNotificationTypeEnabled("REQUEST_ASSIGNED", { ...base, requestUpdatesEnabled: false })).toBe(false);
    expect(isNotificationTypeEnabled("REQUEST_NEARBY", { ...base, nearbyAlertsEnabled: false })).toBe(false);
    expect(isNotificationTypeEnabled("REVIEW_RECEIVED", { ...base, savedRequestsEnabled: false })).toBe(false);
  });

  it("filters notifications by current preferences", () => {
    const preferences = {
      ...getDefaultNotificationPreferences(),
      messagesEnabled: false,
      bidsEnabled: false,
    };

    const notifications = [
      baseNotification("MESSAGE_RECEIVED"),
      baseNotification("BID_ACCEPTED"),
      baseNotification("REQUEST_COMPLETED"),
      baseNotification("SYSTEM"),
    ];

    expect(isNotificationEnabled(notifications[2], preferences)).toBe(true);
    expect(filterNotificationsByPreferences(notifications, preferences).map((item) => item.type)).toEqual([
      "REQUEST_COMPLETED",
      "SYSTEM",
    ]);
  });
});
