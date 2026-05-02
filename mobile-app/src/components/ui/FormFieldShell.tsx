import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type FormFieldShellProps = {
  label?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
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

  return (
    <View
      style={[styles.container, style, disabled ? styles.disabled : null]}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
    >
      {label ? (
        <Text style={[styles.label, { color: palette.textPrimary }]}>
          {label}
          {required ? <Text style={{ color: palette.danger }}> *</Text> : null}
        </Text>
      ) : null}

      <View style={contentStyle}>{children}</View>

      {error ? (
        <Text style={[styles.feedback, { color: palette.danger }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.feedback, { color: palette.textSecondary }]}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    marginBottom: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    letterSpacing: 0.2,
  },
  feedback: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
