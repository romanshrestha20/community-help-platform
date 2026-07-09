import { describe, expect, it } from "vitest";

import {
  getDefaultNotificationPreferences,
  getNotificationPreferencesForUser,
  updateNotificationPreferencesForUser,
} from "../services/notification-preference.service.js";
import { createUser } from "./test-helpers.js";

describe("notification-preference integration", () => {
  it("creates default preferences in the real database on first read", async () => {
    const user = await createUser();

    const preferences = await getNotificationPreferencesForUser(user.id);

    expect(preferences).toEqual(getDefaultNotificationPreferences());
  });

  it("persists updated preferences and returns them on later reads", async () => {
    const user = await createUser();

    const updated = await updateNotificationPreferencesForUser(user.id, {
      pushEnabled: false,
      messagesEnabled: false,
      nearbyAlertsEnabled: true,
      nearbyAlertRadiusKm: 25,
      nearbyAlertsUrgentOnly: true,
      nearbyAlertCategorySlugs: ["errands", "moving"],
    });

    expect(updated).toEqual(
      expect.objectContaining({
        pushEnabled: false,
        messagesEnabled: false,
        nearbyAlertsEnabled: true,
        nearbyAlertRadiusKm: 25,
        nearbyAlertsUrgentOnly: true,
        nearbyAlertCategorySlugs: ["errands", "moving"],
      })
    );

    const reread = await getNotificationPreferencesForUser(user.id);
    expect(reread).toEqual(updated);
  });
});
