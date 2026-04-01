import React from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = React.ComponentProps<typeof TextInput> & {
  label?: string;
  error?: string | null;
};

export const AppInput = ({ label, error, ...props }: Props) => {
  const { palette } = useThemeContext();

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: palette.textPrimary }]}>{label}</Text>}
      <TextInput
        {...props}
        style={[
          styles.input,
          {
            borderColor: palette.border,
            color: palette.textPrimary,
            backgroundColor: palette.surface,
          },
          error && { borderColor: palette.danger },
        ]}
        placeholderTextColor={palette.textSecondary}
      />
      {error && <Text style={[styles.error, { color: palette.danger }]}>{error}</Text>}
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
  },
  input: {
    borderWidth: 1,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    fontSize: theme.typography.fontSize.sm,
  },
  error: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.xs,
  },
});