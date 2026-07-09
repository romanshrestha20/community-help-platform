import { describe, expect, it, vi } from "vitest";

describe("themePreference", () => {
  it("saves and loads theme mode via web localStorage", async () => {
    vi.resetModules();

    const { Platform } = await import("react-native");
    const themePreference = await import("./themePreference");

    Platform.OS = "web";

    await themePreference.saveThemeMode("dark");
    expect(await themePreference.getThemeMode()).toBe("dark");
  });

  it("uses SecureStore on native and falls back to in-memory values on persistence failure", async () => {
    vi.resetModules();

    const { Platform } = await import("react-native");
    const SecureStore = await import("expo-secure-store");
    Platform.OS = "ios";
    vi.mocked(SecureStore.isAvailableAsync).mockResolvedValue(true);
    vi.mocked(SecureStore.getItemAsync).mockResolvedValue("light");

    const themePreference = await import("./themePreference");

    expect(await themePreference.getThemeMode()).toBe("light");

    vi.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error("nope"));
    await themePreference.saveThemeMode("dark");
    expect(await themePreference.getThemeMode()).toBe("light");

    vi.resetModules();
    const themePreferenceFallback = await import("./themePreference");
    Platform.OS = "ios";
    vi.mocked(SecureStore.isAvailableAsync).mockResolvedValue(false);
    await themePreferenceFallback.saveThemeMode("dark");
    expect(await themePreferenceFallback.getThemeMode()).toBe("dark");
  });
});
