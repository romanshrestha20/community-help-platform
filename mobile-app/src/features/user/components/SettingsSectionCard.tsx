import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "@/design-system";
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
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>

      <View style={styles.list}>
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
      </View>
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
  list: {
    gap: 2,
  },
  item: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  textWrap: {
    flex: 1,
    gap: spacing.xxs,
  },
  itemTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  itemSubtitle: {
    fontSize: typography.fontSize.xs + 1,
    lineHeight: typography.lineHeight.xs + 2,
  },
  chevron: {
    fontSize: 22,
    fontWeight: typography.fontWeight.medium,
  },
});