import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  loading?: boolean;
  onDeleteAccount: () => void;
};

export const DangerZoneCard = ({ loading = false, onDeleteAccount }: Props) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.dangerSoft,
        },
      ]}
    >
      <Text style={[styles.title, { color: palette.danger }]}>Danger zone</Text>
      <Text style={[styles.description, { color: palette.textSecondary }]}>
        Deleting your account is permanent. Your profile and related data will be removed.
      </Text>

      <Pressable
        style={[
          styles.button,
          {
            backgroundColor: palette.danger,
          },
          loading && styles.buttonDisabled,
        ]}
        onPress={onDeleteAccount}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={palette.textInverse} />
        ) : (
          <Text style={[styles.buttonText, { color: palette.textInverse }]}>
            Delete account
          </Text>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  description: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.md,
  },
  button: {
    marginTop: spacing.xxs,
    minHeight: 50,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});