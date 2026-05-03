import type {
  ColorScheme,
  TabBarTheme,
  TabItem,
  ThemeMode,
} from "@/types/tabBar";
import { darkColors, lightColors } from "@/design-system/tokens/colors";

export const TAB_BAR_CONSTANTS = {
  HEIGHT: 54,
  FLOATING_MARGIN_HORIZONTAL: 12,
  FLOATING_MARGIN_BOTTOM: 4,

  PADDING_TOP: 6,
  PADDING_BOTTOM: 0,
  PADDING_HORIZONTAL: 8,

  BORDER_RADIUS: 28,

  ICON_SIZE: 22,
  ACTIVE_ICON_SIZE: 23,

  LABEL_FONT_SIZE: 11,
  LABEL_FONT_WEIGHT: "700" as const,

  FAB_SIZE: 58,
  FAB_ICON_SIZE: 26,
  FAB_BORDER_WIDTH: 4,
  FAB_RAISE_OFFSET: -28,

  BADGE_MIN_WIDTH: 18,
  BADGE_HEIGHT: 18,
  BADGE_FONT_SIZE: 10,
} as const;

export function getTabBarOverlayHeight(bottomInset: number): number {
  const bottomPadding = Math.max(bottomInset, TAB_BAR_CONSTANTS.PADDING_BOTTOM);
  const containerHeight = TAB_BAR_CONSTANTS.HEIGHT + bottomPadding;
  const fabProtrusion = Math.abs(
    Math.min(0, TAB_BAR_CONSTANTS.FAB_RAISE_OFFSET)
  );

  return (
    containerHeight +
    TAB_BAR_CONSTANTS.FLOATING_MARGIN_BOTTOM +
    fabProtrusion
  );
}

export const TAB_BAR_HIDDEN_ROUTES = {
  exact: ["/home/requests/map"] as const,

  prefixes: [
    "/messages/",
    "/profile/requests/",
  ] as const,

  patterns: [
    /^\/home\/requests\/create(?:\/.*)?$/,
    /^\/home\/requests\/[^/]+\/edit$/,
  ] as const,
} as const;

export const TAB_BAR_THEME: TabBarTheme = {
  light: {
    primaryColor: lightColors.primary,
    secondaryColor: lightColors.textSecondary,
    backgroundColor: lightColors.surface,
    borderColor: lightColors.border,
  },

  dark: {
    primaryColor: darkColors.primary,
    secondaryColor: darkColors.textSecondary,
    backgroundColor: darkColors.surface,
    borderColor: darkColors.border,
  },
};

export const defaultTabsConfig: TabItem[] = [
  {
    key: "home",
    screenName: "home",
    href: "/home",
    icon: "home",
    activeIcon: "home",
    label: "Home",
    activeMatchPaths: ["/home"],
  },

  {
    key: "messages",
    screenName: "messages",
    href: "/messages",
    icon: "envelope-o",
    activeIcon: "envelope",
    label: "Messages",
    activeMatchPaths: ["/messages"],
  },

  {
    key: "post",
    screenName: "post",
    href: "/home/requests/create",
    icon: "plus",
    activeIcon: "plus",
    label: "Create",
    activeMatchPaths: ["/home/requests/create"],
    isBottomSheetTrigger: true,
  },

  {
    key: "notifications",
    screenName: "notifications",
    href: "/notifications",
    icon: "bell-o",
    activeIcon: "bell",
    label: "Alerts",
    activeMatchPaths: ["/notifications"],
  },

  {
    key: "profile",
    screenName: "profile",
    href: "/profile",
    icon: "user-o",
    activeIcon: "user",
    label: "Profile",
    activeMatchPaths: ["/profile"],
  },
];

export function resolveColorScheme(
  themeMode: ThemeMode,
  systemColorScheme: "light" | "dark" | null | undefined
): ColorScheme {
  if (themeMode === "light" || themeMode === "dark") {
    return themeMode;
  }

  return systemColorScheme === "dark" ? "dark" : "light";
}

export function getTheme(colorScheme: ColorScheme): TabBarTheme[ColorScheme] {
  return TAB_BAR_THEME[colorScheme];
}

export function isRouteMatch(pathname: string, routePath: string): boolean {
  return pathname === routePath || pathname.startsWith(`${routePath}/`);
}

export function isTabFocused(tab: TabItem, pathname: string): boolean {
  const matchPaths = tab.activeMatchPaths?.length
    ? tab.activeMatchPaths
    : [tab.href];

  return matchPaths.some((path) => isRouteMatch(pathname, path));
}

export function shouldHideTabBar(pathname: string): boolean {
  const isExactHidden = TAB_BAR_HIDDEN_ROUTES.exact.some(
    (route) => pathname === route
  );

  if (isExactHidden) {
    return true;
  }

  const isPrefixHidden = TAB_BAR_HIDDEN_ROUTES.prefixes.some((prefix) => {
    if (prefix === "/messages/") {
      return pathname.startsWith(prefix) && pathname !== "/messages";
    }

    return pathname.startsWith(prefix);
  });

  if (isPrefixHidden) {
    return true;
  }

  return TAB_BAR_HIDDEN_ROUTES.patterns.some((pattern) =>
    pattern.test(pathname)
  );
}

export function isPostTab(tab: TabItem): boolean {
  return tab.isBottomSheetTrigger === true || tab.key === "post";
}
