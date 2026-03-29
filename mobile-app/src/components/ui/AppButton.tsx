import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";

import { theme } from "@/design-system";

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "danger" | "ghost";
  fullWidth?: boolean;
};

export const AppButton = ({
  title,
  onPress,
  loading,
  disabled,
  variant = "primary",
  fullWidth = true,
}: Props) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === "danger" ? styles.dangerButton : variant === "ghost" ? styles.ghostButton : styles.primaryButton,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.text}>{title}</Text>
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
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  dangerButton: {
    backgroundColor: theme.colors.danger,
  },
  ghostButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: theme.colors.textInverse,
    fontWeight: theme.typography.fontWeight.semibold,
    fontSize: theme.typography.fontSize.md,
  },
});