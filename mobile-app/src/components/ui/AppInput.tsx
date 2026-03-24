import React from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";

import { theme } from "@/design-system";

type Props = React.ComponentProps<typeof TextInput> & {
  label?: string;
  error?: string | null;
};

export const AppInput = ({ label, error, ...props }: Props) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        {...props}
        style={[styles.input, error && styles.errorInput]}
        placeholderTextColor={theme.colors.textSecondary}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
  },
  label: {
    marginBottom: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    fontSize: theme.typography.fontSize.sm,
  },
  errorInput: {
    borderColor: theme.colors.danger,
  },
  error: {
    color: theme.colors.danger,
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.xs,
  },
});