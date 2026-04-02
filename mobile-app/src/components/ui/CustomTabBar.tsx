/**
 * Custom Tab Bar Component
 * Main tab bar renderer for the Expo Router Tabs
 */

import React from "react";
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Platform,
useColorScheme,
    Text,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { theme } from "@/design-system";
import {
    defaultTabsConfig,
    getTheme,
    TAB_BAR_CONSTANTS,
    resolveColorScheme,
} from "@/config/tabBarConfig";
import { darkColors, lightColors } from "@/design-system/tokens/colors";
import type { ColorScheme, TabItem } from "@/types/tabBar";

interface CustomTabBarProps {
    tabs?: TabItem[];
    colorScheme?: ColorScheme;
    state: any;
    descriptors: any;
    navigation: any;
}

const createStyles = (
    colors: ReturnType<typeof getTheme>,
    palette: typeof lightColors
) =>
    StyleSheet.create({
        container: {
            flexDirection: "row",
            backgroundColor: colors.backgroundColor,
            borderTopColor: colors.borderColor,
            borderTopWidth: 1,
            height: TAB_BAR_CONSTANTS.HEIGHT,
            paddingBottom: Platform.OS === "ios" ? 20 : TAB_BAR_CONSTANTS.PADDING_BOTTOM,
            paddingHorizontal: theme.spacing.xs,
        },
        tabButton: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: theme.spacing.sm,
            borderRadius: theme.radius.lg,
        },
        tabButtonActive: {
            backgroundColor: colors.backgroundColor,
        },
        iconWrapper: {
            position: "relative",
            marginBottom: theme.spacing.xxs,
        },
        label: {
            fontSize: TAB_BAR_CONSTANTS.LABEL_FONT_SIZE,
            fontWeight: TAB_BAR_CONSTANTS.LABEL_FONT_WEIGHT,
            marginTop: 2,
        },
        labelActive: {
            color: colors.primaryColor,
        },
        labelInactive: {
            color: colors.secondaryColor,
        },
        badge: {
            position: "absolute",
            top: -5,
            right: -8,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: palette.danger,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.backgroundColor,
        },
        badgeText: {
            color: palette.textInverse,
            fontSize: 10,
            fontWeight: "700",
            textAlign: "center",
            lineHeight: 16,
        },
    });

/**
 * Main custom tab bar component
 * Renders tabs with icons, labels, and optional badges
 */
export const CustomTabBar: React.FC<CustomTabBarProps> = ({
    tabs = defaultTabsConfig,
    colorScheme,
    state,
    descriptors,
    navigation,
}) => {
    const systemColorScheme = useColorScheme();
    const ColorScheme =
        colorScheme ?? resolveColorScheme("system", systemColorScheme);
    const colors = getTheme(ColorScheme);
    const palette = ColorScheme === "dark" ? darkColors : lightColors;
    const styles = createStyles(colors, palette);

    const handleTabPress = (tabName: string, index: number) => {
        const event = navigation.emit({
            type: "tabPress",
            target: state.routeNames[index],
            preventDefault: false,
        });

        if (!event.defaultPrevented) {
            navigation.navigate(state.routeNames[index], {
                merge: true,
            });
        }
    };

    return (
        <View style={styles.container}>
            {tabs.map((tab, index) => {
                const isFocused = state.index === index;

                return (
                    <TouchableOpacity
                        key={tab.name}
                        style={[styles.tabButton, isFocused && styles.tabButtonActive]}
                        onPress={() => handleTabPress(tab.name, index)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.iconWrapper}>
                            <FontAwesome
                                name={tab.icon}
                                size={TAB_BAR_CONSTANTS.ICON_SIZE}
                                color={isFocused ? colors.primaryColor : colors.secondaryColor}
                            />
                            {tab.badge && tab.badge > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {tab.badge > 99 ? "99+" : tab.badge.toString()}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Text
                            style={[
                                styles.label,
                                isFocused ? styles.labelActive : styles.labelInactive,
                            ]}
                            numberOfLines={1}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};
