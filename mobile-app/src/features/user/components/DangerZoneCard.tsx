import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { Card, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  loading?: boolean;
  onDeleteAccount: () => void;
};

export const DangerZoneCard = ({ loading = false, onDeleteAccount }: Props) => {
  const { palette } = useThemeContext();

  return (
    <Card
      style={{
        borderColor: palette.dangerSoft,
      }}
    >
      <Stack gap="sm">
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
      </Stack>
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
  button: {
    minHeight: 50,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.xxs,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
});