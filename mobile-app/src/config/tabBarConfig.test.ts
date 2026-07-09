import { describe, expect, it } from "vitest";

import {
  TAB_BAR_CONSTANTS,
  defaultTabsConfig,
  getTabBarOverlayHeight,
  getTheme,
  isPostTab,
  isRouteMatch,
  isTabFocused,
  resolveColorScheme,
  shouldHideTabBar,
} from "./tabBarConfig";

describe("tabBarConfig", () => {
  it("calculates overlay height with and without bottom inset", () => {
    expect(getTabBarOverlayHeight(0)).toBe(86);
    expect(getTabBarOverlayHeight(10)).toBe(
      TAB_BAR_CONSTANTS.HEIGHT + 10 + TAB_BAR_CONSTANTS.FLOATING_MARGIN_BOTTOM + 28
    );
  });

  it("resolves color scheme from explicit mode or system fallback", () => {
    expect(resolveColorScheme("light", "dark")).toBe("light");
    expect(resolveColorScheme("dark", "light")).toBe("dark");
    expect(resolveColorScheme("system", "dark")).toBe("dark");
    expect(resolveColorScheme("system", null)).toBe("light");
  });

  it("returns theme colors for both schemes", () => {
    expect(getTheme("light").primaryColor).toBeTruthy();
    expect(getTheme("dark").backgroundColor).toBeTruthy();
  });

  it("matches exact and nested routes only when they belong to the tab path", () => {
    expect(isRouteMatch("/home", "/home")).toBe(true);
    expect(isRouteMatch("/home/requests", "/home")).toBe(true);
    expect(isRouteMatch("/home-archive", "/home")).toBe(false);
  });

  it("detects focused tabs using active match paths", () => {
    const homeTab = defaultTabsConfig.find((tab) => tab.key === "home");
    const profileTab = defaultTabsConfig.find((tab) => tab.key === "profile");

    expect(homeTab).toBeDefined();
    expect(profileTab).toBeDefined();

    expect(isTabFocused(homeTab!, "/home/requests/abc")).toBe(true);
    expect(isTabFocused(profileTab!, "/home")).toBe(false);
  });

  it("hides the tab bar on configured exact, prefix, and pattern routes only", () => {
    expect(shouldHideTabBar("/home/requests/map")).toBe(true);
    expect(shouldHideTabBar("/messages/123")).toBe(true);
    expect(shouldHideTabBar("/messages")).toBe(false);
    expect(shouldHideTabBar("/profile/requests/123")).toBe(true);
    expect(shouldHideTabBar("/home/requests/create")).toBe(true);
    expect(shouldHideTabBar("/home/requests/123/edit")).toBe(true);
    expect(shouldHideTabBar("/home/requests/123")).toBe(false);
  });

  it("identifies the post tab by key or trigger flag", () => {
    const postTab = defaultTabsConfig.find((tab) => tab.key === "post");
    const homeTab = defaultTabsConfig.find((tab) => tab.key === "home");

    expect(isPostTab(postTab!)).toBe(true);
    expect(isPostTab(homeTab!)).toBe(false);
    expect(isPostTab({ ...homeTab!, key: "custom", isBottomSheetTrigger: true })).toBe(true);
  });
});
