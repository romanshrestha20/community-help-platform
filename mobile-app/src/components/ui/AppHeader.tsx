import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Href } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { AppBackButton, AppBackButtonProps } from "@/components/ui/AppBackButton";
import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Variant = "large" | "compact";

type RightAction =
  | React.ReactNode
  | {
    icon: React.ComponentProps<typeof Ionicons>["name"];
    onPress: () => void;
    accessibilityLabel?: string;
  };

type Props = {
  title: string;
  subtitle?: string;
  variant?: Variant;
  showBackButton?: boolean;
  backButtonProps?: Omit<AppBackButtonProps, "fullWidth">;
  rightAction?: RightAction;
  divider?: boolean;
  titleNumberOfLines?: number;
  subtitleNumberOfLines?: number;
};

export const AppHeader = ({
  title,
  subtitle,
  variant = "large",
  showBackButton = false,
  backButtonProps,
  rightAction,
  divider = false,
  titleNumberOfLines = 1,
  subtitleNumberOfLines = 2,
}: Props) => {
  const { palette } = useThemeContext();
  const fallback = (backButtonProps?.fallback as Href | undefined) ?? undefined;

  const isCompact = variant === "compact";
  const isRightActionButton =
    rightAction &&
    typeof rightAction === "object" &&
    "icon" in rightAction &&
    "onPress" in rightAction;

  const variantStyles = isCompact
    ? styles.containerCompact
    : styles.containerLarge;

  const titleStyles = isCompact ? styles.titleCompact : styles.titleLarge;
  const subtitleStyles = isCompact
    ? styles.subtitleCompact
    : styles.subtitleLarge;

  return (
    <View
      style={[
        styles.container,
        variantStyles,
        {
          borderBottomColor: palette.border,
          borderBottomWidth: isCompact || !divider ? 0 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {showBackButton && (
            <AppBackButton
              title=""
              variant="secondary"
              size={isCompact ? "sm" : "md"}
              iconOnly={isCompact}
              {...backButtonProps}
              fallback={fallback}
            />
          )}

          <View style={[styles.textContent, showBackButton && styles.textContentWithBack]}>
            <Text
              numberOfLines={titleNumberOfLines}
              style={[titleStyles, { color: palette.textPrimary }]}
            >
              {title}
            </Text>

            {subtitle && (
              <Text
                numberOfLines={subtitleNumberOfLines}
                style={[
                  subtitleStyles,
                  { color: palette.textSecondary, opacity: 0.8 },
                ]}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {rightAction && (
          <View style={styles.rightSection}>
            {isRightActionButton ? (
              <Pressable
                onPress={rightAction.onPress}
                style={({ pressed }) => [styles.rightButton, pressed && { opacity: 0.85 }]}
                accessibilityLabel={rightAction.accessibilityLabel}
                accessibilityRole="button"
              >
                <Ionicons
                  name={rightAction.icon}
                  size={16}
                  color={palette.danger}
                />
              </Pressable>
            ) : (
              rightAction
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  containerLarge: {
    marginBottom: theme.spacing.md,
  },
  containerCompact: {
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  textContent: {
    flex: 1,
    justifyContent: "center",
    paddingRight: theme.spacing.sm,
  },
  textContentWithBack: {},
  titleLarge: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  titleCompact: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  subtitleLarge: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  subtitleCompact: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.xs,

    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  rightSection: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
    minHeight: 44,
  },
  rightButton: {
    minHeight: 36,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.fill,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
});