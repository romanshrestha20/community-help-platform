import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type FormFieldShellProps = {
  label?: string;
  required?: boolean;
  helperText?: string | null;
  error?: string | null;
  disabled?: boolean;
  children: React.ReactNode;
  accessibilityLabel?: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

export const FormFieldShell = ({
  label,
  required = false,
  helperText,
  error,
  disabled = false,
  children,
  accessibilityLabel,
  style,
  contentStyle,
}: FormFieldShellProps) => {
  const { palette } = useThemeContext();
  const message = error || helperText;

  return (
    <View
      style={[styles.container, disabled ? styles.disabled : null, style]}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(disabled) }}
    >
      {label ? (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>
            {label}
          </Text>
          {required ? (
            <Text style={[styles.required, { color: palette.danger }]}>*</Text>
          ) : null}
        </View>
      ) : null}

      <View style={contentStyle}>{children}</View>

      {message ? (
        <Text
          style={[
            styles.feedback,
            { color: error ? palette.danger : palette.textSecondary },
          ]}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
  },
  disabled: {
    opacity: 0.6,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  required: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  feedback: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
  },
});
