import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type FormSectionProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export const FormSection = ({ title, subtitle, children }: FormSectionProps) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <Stack gap="xxs" style={styles.sectionTitleWrap}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.sectionSubtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </Stack>
      <Stack gap="md" style={styles.sectionCardBody}>
        {children}
      </Stack>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitleWrap: {
    gap: theme.spacing.xxs,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
  },
  sectionCardBody: {
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.xs + 1,
    lineHeight: theme.typography.lineHeight.xs + 3,
  },
});
