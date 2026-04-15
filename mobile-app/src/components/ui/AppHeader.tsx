import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Href } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { AppBackButton, AppBackButtonProps } from "@/components/ui/AppBackButton";
import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Variant = "large" | "compact";
type Align = "left" | "center";

type RightAction =
  | React.ReactNode
  | {
    icon: React.ComponentProps<typeof Ionicons>["name"];
    onPress: () => void;
    accessibilityLabel?: string;
    color?: string;
  };

type Props = {
  title: string;
  subtitle?: string;
  variant?: Variant;
  align?: Align;
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
  align = "left",
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
  const isCentered = align === "center";

  const isRightActionButton =
    rightAction &&
    typeof rightAction === "object" &&
    "icon" in rightAction &&
    "onPress" in rightAction;

  const variantStyles = isCompact ? styles.containerCompact : styles.containerLarge;
  const titleStyles = isCompact ? styles.titleCompact : styles.titleLarge;
  const subtitleStyles = isCompact ? styles.subtitleCompact : styles.subtitleLarge;

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
        <View style={styles.sideSlot}>
          {showBackButton ? (
            <AppBackButton
              title=""
              variant="secondary"
              size={isCompact ? "sm" : "md"}
              iconOnly={isCompact}
              {...backButtonProps}
              fallback={fallback}
            />
          ) : null}
        </View>

        <View
          style={[
            styles.centerContent,
            isCentered ? styles.centerAligned : styles.leftAligned,
          ]}
        >
          <Text
            numberOfLines={titleNumberOfLines}
            style={[
              titleStyles,
              {
                color: palette.textPrimary,
                textAlign: isCentered ? "center" : "left",
              },
            ]}
          >
            {title}
          </Text>

          {subtitle ? (
            <Text
              numberOfLines={subtitleNumberOfLines}
              style={[
                subtitleStyles,
                {
                  color: palette.textSecondary,
                  textAlign: isCentered ? "center" : "left",
                  opacity: 0.85,
                },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={[styles.sideSlot, styles.rightSlot]}>
          {rightAction ? (
            isRightActionButton ? (
              <Pressable
                onPress={rightAction.onPress}
                style={({ pressed }) => [
                  styles.rightButton,
                  {
                    borderColor: palette.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                accessibilityLabel={rightAction.accessibilityLabel}
                accessibilityRole="button"
              >
                <Ionicons
                  name={rightAction.icon}
                  size={16}
                  color={rightAction.color ?? palette.danger}
                />
              </Pressable>
            ) : (
              rightAction
            )
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  containerLarge: {
    marginBottom: theme.spacing.lg,
  },
  containerCompact: {
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  content: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
  },
  sideSlot: {
    width: 52,
    minHeight: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  rightSlot: {
    alignItems: "flex-end",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.sm,
  },
  leftAligned: {
    alignItems: "flex-start",
  },
  centerAligned: {
    alignItems: "center",
  },
  titleLarge: {
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  titleCompact: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  subtitleLarge: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  subtitleCompact: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  rightButton: {
    minHeight: 36,
    minWidth: 36,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.fill,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
});