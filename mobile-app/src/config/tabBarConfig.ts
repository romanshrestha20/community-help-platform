import type { ColorScheme, TabBarTheme, TabItem, ThemeMode } from "@/types/tabBar";
import { darkColors, lightColors } from "@/design-system/tokens/colors";

export const TAB_BAR_CONSTANTS = {
  HEIGHT: 72,
  PADDING_BOTTOM: 10,
  ICON_SIZE: 22,
  LABEL_FONT_SIZE: 12,
  LABEL_FONT_WEIGHT: "600" as const,
};

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
    icon: "envelope",
    activeIcon: "envelope",
    label: "Messages",
    activeMatchPaths: ["/messages"],
  },
  {
    key: "post",
    screenName: "",
    href: "/home/requests/create",
    icon: "plus",
    activeIcon: "plus",
    label: "",
    activeMatchPaths: ["/home/requests/create"],
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
    icon: "user",
    activeIcon: "user",
    label: "Profile",
    activeMatchPaths: ["/profile"],
  },
];

export function resolveColorScheme(
  themeMode: ThemeMode,
  systemColorScheme: "light" | "dark" | null | undefined
): ColorScheme {
  if (themeMode === "light") return "light";
  if (themeMode === "dark") return "dark";
  return systemColorScheme === "dark" ? "dark" : "light";
}

export function getTheme(colorScheme: ColorScheme) {
  return TAB_BAR_THEME[colorScheme];
}
