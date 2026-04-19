import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  title: string;
  meta: string;
  onPressView: () => void;
};

export function HomeUrgentBanner({ title, meta, onPressView }: Props) {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.urgentBanner,
        { backgroundColor: palette.primary },
      ]}
    >
      <View style={styles.urgentBannerCopy}>
        <Text style={styles.urgentLabel}>URGENT NEARBY</Text>
        <Text style={styles.urgentHeadline} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.urgentMeta} numberOfLines={1}>
          {meta}
        </Text>
      </View>

      <Pressable
        onPress={onPressView}
        style={({ pressed }) => [
          styles.urgentViewButton,
          {
            backgroundColor: palette.surface,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Text style={[styles.urgentViewButtonText, { color: palette.primary }]}>
          View
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  urgentBanner: {
    minHeight: 72,
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    columnGap: theme.spacing.sm,
    shadowColor: "#122013",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  urgentBannerCopy: {
    flex: 1,
    gap: 3,
    justifyContent: "center",
  },
  urgentLabel: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 1.2,
  },
  urgentHeadline: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: theme.typography.fontWeight.bold,
  },
  urgentMeta: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: theme.typography.fontWeight.medium,
  },
  urgentViewButton: {
    minWidth: 64,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.sm,
  },
  urgentViewButtonText: {
    fontSize: 13,
    fontWeight: theme.typography.fontWeight.bold,
  },
});