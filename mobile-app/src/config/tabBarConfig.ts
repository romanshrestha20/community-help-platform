import type { ColorScheme, TabBarTheme, TabItem, ThemeMode } from "@/types/tabBar";

export const TAB_BAR_CONSTANTS = {
  HEIGHT: 72,
  PADDING_BOTTOM: 10,
  ICON_SIZE: 22,
  LABEL_FONT_SIZE: 12,
  LABEL_FONT_WEIGHT: "600" as const,
};

export const TAB_BAR_THEME: TabBarTheme = {
  light: {
    primaryColor: "#5c8001",
    secondaryColor: "#7a7a7a",
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
  },
  dark: {
    primaryColor: "#7cb342",
    secondaryColor: "#a1a1aa",
    backgroundColor: "#18181b",
    borderColor: "#27272a",
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