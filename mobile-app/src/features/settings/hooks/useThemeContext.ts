import { useColorScheme } from "react-native";
import { getTheme, resolveColorScheme } from "@/config/tabBarConfig";
import { useThemeStore } from "@/features/settings/store/theme.store";
import { darkColors, lightColors } from "@/design-system/tokens/colors";

export const useThemeContext = () => {
    const systemColorScheme = useColorScheme();
    const themeMode = useThemeStore((state) => state.themeMode);
    const colorScheme = resolveColorScheme(themeMode, systemColorScheme);
    const colors = getTheme(colorScheme);
    const palette = colorScheme === "dark" ? darkColors : lightColors;

    return {
        themeMode,
        colorScheme,
        colors,
        palette,
    };
};
