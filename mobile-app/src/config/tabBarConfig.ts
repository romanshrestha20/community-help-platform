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
    name: "home",
    href: "/home",
    icon: "home",
    label: "Home",
  },
  {
    name: "requests",
    href: "/requests",
    icon: "list-ul",
    label: "My Requests",
  },
  {
    name: "messages",
    href: "/messages",
    icon: "envelope",
    label: "Messages",
  },
  {
    name: "notifications",
    href: "/notifications",
    icon: "bell-o",
    activeIcon: "bell",
    label: "Notifications",
  },
  {
    name: "profile",
    href: "/profile",
    icon: "user",
    label: "Profile",
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
