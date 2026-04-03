import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  title?: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "danger" | "ghost" | "secondary";
  fullWidth?: boolean;
  icon?: React.ReactNode;
};

export const AppButton = ({
  title,
  onPress,
  loading,
  disabled,
  variant = "primary",
  fullWidth = true,
  icon,
}: Props) => {
  const { palette } = useThemeContext();
  const isGhost = variant === "ghost";
  const isSecondary = variant === "secondary";
  const foregroundColor = isGhost || isSecondary ? palette.textPrimary : palette.textInverse;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === "danger"
          ? { backgroundColor: palette.danger }
          : variant === "secondary"
            ? {
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.borderStrong,
            }
          : variant === "ghost"
            ? {
              backgroundColor: palette.surfaceMuted,
              borderWidth: 1,
              borderColor: palette.border,
            }
            : { backgroundColor: palette.primary },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={foregroundColor} />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          {title ? <Text style={[styles.text, { color: foregroundColor }]}>{title}</Text> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontWeight: theme.typography.fontWeight.semibold,
    fontSize: theme.typography.fontSize.md,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: theme.spacing.xxs,
  },
});