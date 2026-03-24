import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/design-system";

type ProfileInfoRowProps = {
  label: string;
  value?: string | null;
};

export const ProfileInfoRow = ({ label, value }: ProfileInfoRowProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}>{value?.trim() ? value : "Not provided"}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xxs,
  },
  value: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
  },
});
