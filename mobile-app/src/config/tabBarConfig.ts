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
    icon: "home",
    label: "Home",
  },
  {
    name: "messages",
    icon: "envelope",
    label: "Messages",
  },
  {
    name: "notifications",
    icon: "bell",
    label: "Notifications",
  },
  {
    name: "profile",
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