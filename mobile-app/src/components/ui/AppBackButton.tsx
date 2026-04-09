import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Href } from "expo-router";
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";

import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { goBackOrFallback } from "@/utils/navigation";
import { APP_ROUTES } from "@/config/routes";
import { theme } from "@/design-system";

type Size = "sm" | "md" | "lg";
type Variant = "primary" | "danger" | "ghost" | "secondary";

export type AppBackButtonProps = {
    /** Display text next to the back icon */
    title?: string;
    /** Fallback route if back navigation fails */
    fallback?: Href;
    /** Replace current history entry instead of pushing back */
    replace?: boolean;
    /** Visual style variant */
    variant?: Variant;
    /** Icon-only mode (no text, icon as button) */
    iconOnly?: boolean;
    /** Button size: sm (compact headers), md (standard), lg (prominent) */
    size?: Size;
    /** Full width button */
    fullWidth?: boolean;
    /** Show loading indicator */
    loading?: boolean;
    /** Custom callback before navigation */
    onBackPress?: () => void;
};

export const AppBackButton = ({
    title = "Back",
    fallback = APP_ROUTES.HOME,
    replace = true,
    variant = "ghost",
    iconOnly = false,
    size = "md",
    fullWidth = false,
    loading = false,
    onBackPress,
}: AppBackButtonProps) => {
    const { palette } = useThemeContext();

    // Color system based on variant
    const variantColors = {
        primary: {
            container: palette.primary,
            containerBorder: palette.primary,
            icon: palette.textInverse,
            iconBg: "rgba(255,255,255,0.14)",
            iconBorder: "rgba(255,255,255,0.18)",
        },
        danger: {
            container: palette.dangerSoft,
            containerBorder: palette.danger,
            icon: palette.textPrimary,
            iconBg: palette.surface,
            iconBorder: palette.border,
        },
        secondary: {
            container: palette.surface,
            containerBorder: palette.borderStrong,
            icon: palette.textPrimary,
            iconBg: palette.surfaceMuted,
            iconBorder: palette.border,
        },
        ghost: {
            container: palette.surface,
            containerBorder: palette.border,
            icon: palette.textPrimary,
            iconBg: palette.surfaceMuted,
            iconBorder: palette.border,
        },
    };

    const colors = variantColors[variant];

    // Size configuration
    const sizeConfig = {
        sm: {
            button: 36,
            icon: 36,
            iconSize: 16,
            gap: 6,
            text: styles.textSm,
        },
        md: {
            button: 44,
            icon: 32,
            iconSize: 18,
            gap: 8,
            text: styles.textMd,
        },
        lg: {
            button: 48,
            icon: 36,
            iconSize: 20,
            gap: 8,
            text: styles.textLg,
        },
    };

    const config = sizeConfig[size];

    const handlePress = () => {
        if (loading) return;

        if (onBackPress) {
            onBackPress();
            return;
        }

        goBackOrFallback({
            fallback,
            replace,
        });
    };

    const buttonMinHeight = iconOnly ? config.button : undefined;
    const iconBoxSize = config.icon;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={title || "Go back"}
            onPress={handlePress}
            disabled={loading}
            style={({ pressed }) => [
                styles.pressable,
                {
                    minHeight: buttonMinHeight,
                    minWidth: 44,
                },
                !iconOnly && {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: config.gap,
                },
                fullWidth && styles.fullWidth,
                pressed && !loading && styles.pressed,
                loading && styles.disabled,
            ]}
        >
            <View
                style={[
                    styles.iconContainer,
                    {
                        width: iconBoxSize,
                        height: iconBoxSize,
                        backgroundColor: colors.iconBg,
                        borderColor: colors.iconBorder,
                    },
                ]}
            >
                {loading ? (
                    <ActivityIndicator size={config.iconSize - 4} color={colors.icon} />
                ) : (
                    <Ionicons name="chevron-back" size={config.iconSize} color={colors.icon} />
                )}
            </View>

            {!iconOnly && title && (
                <Text
                    numberOfLines={1}
                    style={[
                        config.text,
                        {
                            color: colors.icon,
                        },
                    ]}
                >
                    {title}
                </Text>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    pressable: {
        alignSelf: "flex-start",
        alignItems: "center",
        justifyContent: "center",
    },
    fullWidth: {
        alignSelf: "stretch",
    },
    pressed: {
        opacity: 0.7,
    },
    disabled: {
        opacity: 0.6,
    },
    iconContainer: {
        borderRadius: theme.radius.fill,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    textSm: {
        fontSize: theme.typography.fontSize.xs,
        lineHeight: theme.typography.lineHeight.xs,
        fontWeight: theme.typography.fontWeight.semibold,
        paddingRight: 2,
    },
    textMd: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        paddingRight: 2,
    },
    textLg: {
        fontSize: theme.typography.fontSize.lg,
        lineHeight: theme.typography.lineHeight.lg,
        fontWeight: theme.typography.fontWeight.semibold,
        paddingRight: 2,
    },
});