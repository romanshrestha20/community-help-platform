import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { HomeActionButton } from "./HomeActionButton";

type Props = {
  onCreateRequest: () => void;
  onBrowseAll: () => void;
};

export function HomeEmptyState({ onCreateRequest, onBrowseAll }: Props) {
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
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: palette.surfaceMuted },
        ]}
      >
        <Ionicons name="leaf-outline" size={22} color={palette.primary} />
      </View>

      <Text style={[styles.title, { color: palette.textPrimary }]}>
        No requests yet
      </Text>
      <Text style={[styles.body, { color: palette.textSecondary }]}>
        Try a different category or search term to discover nearby help requests
        around you.
      </Text>

      <View style={styles.actions}>
        <HomeActionButton
          label="Create request"
          icon="add-outline"
          onPress={onCreateRequest}
          variant="secondary"
        />
        <HomeActionButton
          label="Browse all"
          onPress={onBrowseAll}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 26,
    padding: theme.spacing.lg,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: 6,
  },
  body: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 22,
    fontWeight: theme.typography.fontWeight.medium,
  },
  actions: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
});
