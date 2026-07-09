import { describe, expect, it, vi } from "vitest";

describe("notificationPreference", () => {
  it("persists preferences in web localStorage", async () => {
    vi.resetModules();

    const { Platform } = await import("react-native");
    Platform.OS = "web";

    const notificationPreference = await import("./notificationPreference");
    const updated = {
      ...notificationPreference.getDefaultNotificationPreferences(),
      pushEnabled: false,
      nearbyAlertRadiusKm: 25 as const,
    };

    await notificationPreference.saveNotificationPreferences(updated);
    expect(await notificationPreference.getNotificationPreferences()).toEqual(updated);
  });

  it("uses SecureStore on native and falls back to memory when storage is unavailable", async () => {
    vi.resetModules();

    const { Platform } = await import("react-native");
    const SecureStore = await import("expo-secure-store");
    Platform.OS = "android";
    vi.mocked(SecureStore.isAvailableAsync).mockResolvedValue(true);
    vi.mocked(SecureStore.getItemAsync).mockResolvedValue(
      JSON.stringify({
        pushEnabled: true,
        messagesEnabled: false,
        bidsEnabled: true,
        requestUpdatesEnabled: true,
        savedRequestsEnabled: false,
        nearbyAlertsEnabled: true,
        nearbyAlertRadiusKm: 10,
        nearbyAlertsUrgentOnly: false,
        nearbyAlertCategorySlugs: ["errands"],
      })
    );

    const notificationPreference = await import("./notificationPreference");
    expect((await notificationPreference.getNotificationPreferences()).nearbyAlertRadiusKm).toBe(10);

    vi.resetModules();
    Platform.OS = "android";
    vi.mocked(SecureStore.isAvailableAsync).mockResolvedValue(false);
    const fallbackModule = await import("./notificationPreference");
    const updated = {
      ...fallbackModule.getDefaultNotificationPreferences(),
      bidsEnabled: false,
    };
    await fallbackModule.saveNotificationPreferences(updated);
    expect(await fallbackModule.getNotificationPreferences()).toEqual(updated);
  });
});
