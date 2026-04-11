import type { ComponentProps } from "react";
import type FontAwesome from "@expo/vector-icons/FontAwesome";

export interface TabItem {
  name: string;
  icon: ComponentProps<typeof FontAwesome>["name"];
  activeIcon?: ComponentProps<typeof FontAwesome>["name"];
  label: string;
  badge?: number;
}

export interface TabBarConfig {
  activeTintColor: string;
  inactiveTintColor: string;
  style: {
    height: number;
    paddingBottom: number;
  };
}

export type ThemeMode = "light" | "dark" | "system";
export type ColorScheme = "light" | "dark";

export interface TabThemeColors {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  borderColor: string;
}

export interface TabBarTheme {
  light: TabThemeColors;
  dark: TabThemeColors;
}