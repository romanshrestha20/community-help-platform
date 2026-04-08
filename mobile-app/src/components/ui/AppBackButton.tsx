import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { goBackOrFallback } from "@/utils/navigation";
import { APP_ROUTES } from "@/config/routes";
import { theme } from "@/design-system";

export type AppBackButtonProps = {
    title?: string;
    fallback?: Href;
    replace?: boolean;
    variant?: "primary" | "danger" | "ghost" | "secondary";
    fullWidth?: boolean;
    onBackPress?: () => void;
};

export const AppBackButton = ({
    title = "Back",
    fallback = APP_ROUTES.HOME,
    replace = true,
    variant = "ghost",
    fullWidth = false,
    onBackPress,
}: AppBackButtonProps) => {
    const { palette } = useThemeContext();

    const isPrimary = variant === "primary";
    const isDanger = variant === "danger";
    const isSecondary = variant === "secondary";

    const containerStyle = isPrimary
        ? {
            backgroundColor: palette.primary,
            borderColor: palette.primary,
        }
        : isDanger
            ? {
                backgroundColor: palette.dangerSoft,
                borderColor: palette.danger,
            }
            : isSecondary
                ? {
                    backgroundColor: palette.surface,
                    borderColor: palette.borderStrong,
                }
                : {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                };

    const foregroundColor = isPrimary ? palette.textInverse : palette.textPrimary;

    const iconBackgroundColor = isPrimary
        ? "rgba(255,255,255,0.14)"
        : isDanger
            ? palette.surface
            : palette.surfaceMuted;

    const iconBorderColor = isPrimary
        ? "rgba(255,255,255,0.18)"
        : palette.border;

    const handlePress = () => {
        if (onBackPress) {
            onBackPress();
            return;
        }

        goBackOrFallback({
            fallback,
            replace,
        });
    };

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={title || "Go back"}
            onPress={handlePress}
            style={({ pressed }) => [
                styles.button,
                containerStyle,
                fullWidth && styles.fullWidth,
                pressed && styles.pressed,
            ]}
        >
            <View
                style={[
                    styles.iconContainer,
                    {
                        backgroundColor: iconBackgroundColor,
                        borderColor: iconBorderColor,
                    },
                ]}
            >
                <Ionicons name="chevron-back" size={16} color={foregroundColor} />
            </View>

            {title ? (
                <Text
                    numberOfLines={1}
                    style={[
                        styles.title,
                        {
                            color: foregroundColor,
                        },
                    ]}
                >
                    {title}
                </Text>
            ) : null}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        minHeight: 44,
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        paddingLeft: theme.spacing.xs,
        paddingRight: theme.spacing.sm + 2,
        paddingVertical: theme.spacing.xxs,
        gap: theme.spacing.xs,
    },
    fullWidth: {
        width: "100%",
    },
    pressed: {
        opacity: 0.82,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: theme.radius.fill,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        paddingRight: 2,
    },
});