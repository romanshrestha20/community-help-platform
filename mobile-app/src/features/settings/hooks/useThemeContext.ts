import { useColorScheme } from "react-native";
import { getTheme, ColorScheme } from "@/config/tabBarConfig";
import { useThemeStore } from "@/features/settings/store/theme.store";
import { darkColors, lightColors } from "@/design-system/tokens/colors";

export const useThemeContext = () => {
    const systemColorScheme = useColorScheme();
    const themeMode = useThemeStore((state) => state.themeMode);
    const colorScheme = ColorScheme(themeMode, systemColorScheme);
    const colors = getTheme(colorScheme);
    const palette = colorScheme === "dark" ? darkColors : lightColors;

    return {
        themeMode,
        colorScheme,
        colors,
        palette,
    };
};
