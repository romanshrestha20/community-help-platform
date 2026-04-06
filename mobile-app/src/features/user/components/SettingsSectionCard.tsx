import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

export type SettingsItem = {
  id: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
};

type Props = {
  title: string;
  items: SettingsItem[];
};

export const SettingsSectionCard = ({ title, items }: Props) => {
  const { palette } = useThemeContext();

  return (
    <Card>
      <Stack gap="sm">
        <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>

        <Stack gap="xxs">
          {items.map((item, index) => (
            <Pressable
              key={item.id}
              style={[
                styles.item,
                index !== items.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: palette.border,
                },
              ]}
              onPress={item.onPress}
            >
              <View style={styles.textWrap}>
                <Text
                  style={[
                    styles.itemTitle,
                    { color: item.danger ? palette.danger : palette.textPrimary },
                  ]}
                >
                  {item.title}
                </Text>

                {item.subtitle ? (
                  <Text style={[styles.itemSubtitle, { color: palette.textSecondary }]}>
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>

              <Text
                style={[
                  styles.chevron,
                  { color: item.danger ? palette.danger : palette.textSecondary },
                ]}
              >
                ›
              </Text>
            </Pressable>
          ))}
        </Stack>
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
  item: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  textWrap: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  itemTitle: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  itemSubtitle: {
    fontSize: theme.typography.fontSize.xs + 1,
    lineHeight: theme.typography.lineHeight.xs + 2,
  },
  chevron: {
    fontSize: 22,
    fontWeight: theme.typography.fontWeight.medium,
  },
});