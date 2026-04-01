/**
 * Configuration for the custom tab bar navigator
 * Centralized place for tabs, colors, and constants
 */

import { darkColors, lightColors } from "@/design-system/tokens/colors";
import type { ColorSchemeName } from "react-native";
import type {
    TabItem,
    TabBarTheme,
    ThemeMode,
    ResolvedColorScheme,
} from "@/types/tabBar";

/**
 * Default 4-tab configuration
 */
export const defaultTabsConfig: TabItem[] = [
    {
        name: "home",
        icon: "home",
        label: "Home",
    },
    {
        name: "messages",
        icon: "comments",
        label: "Messages",
        badge: 0,
    },
    {
        name: "notifications",
        icon: "bell",
        label: "Notifications",
        badge: 0,
    },
    {
        name: "profile",
        icon: "user",
        label: "Profile",
    },
];

/**
 * Theme configuration for light and dark modes
 */
export const tabBarTheme: TabBarTheme = {
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

/**
 * Tab bar dimensions and constants
 */
export const TAB_BAR_CONSTANTS = {
    HEIGHT: 65,
    PADDING_BOTTOM: 8,
    ICON_SIZE: 24,
    LABEL_FONT_SIZE: 11,
    LABEL_FONT_WEIGHT: "600" as const,
};

/**
 * Resolve active color scheme from an app-level theme mode.
 */
export const resolveColorScheme = (
    themeMode: ThemeMode,
    systemColorScheme: ColorSchemeName
): ResolvedColorScheme => {
    if (themeMode === "system") {
        return systemColorScheme === "dark" ? "dark" : "light";
    }

    return themeMode;
};

/**
 * Get palette for a resolved color scheme.
 */
export const getTheme = (colorScheme: ResolvedColorScheme) => {
    return tabBarTheme[colorScheme];
};
