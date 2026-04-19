import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { MapRequestItem } from "@/features/map/types/map.types";
import {
  formatRequestBudget,
  formatRequestLocation,
  getRequestCategoryLabel,
} from "@/features/helpRequest/utils/requestDisplay";
import { formatDistance } from "@/utils/distance";

type Props = {
  request: MapRequestItem;
  onPress: () => void;
};

export const SelectedRequestSheet = ({ request, onPress }: Props) => {
  const { palette } = useThemeContext();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            opacity: pressed ? 0.96 : 1,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.copy}>
            <Text style={[styles.title, { color: palette.textPrimary }]}>
              {request.title}
            </Text>
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
              {getRequestCategoryLabel(request)}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={palette.textSecondary}
          />
        </View>

        <View style={styles.metaRow}>
          <View style={styles.pillGroup}>
            <View
              style={[
                styles.pill,
                { backgroundColor: palette.surfaceMuted },
              ]}
            >
              <Text style={[styles.pillText, { color: palette.textSecondary }]}>
                {request.status}
              </Text>
            </View>

            {typeof request.distanceKm === "number" ? (
              <View
                style={[
                  styles.pill,
                  { backgroundColor: `${palette.primary}14` },
                ]}
              >
                <Text style={[styles.pillText, { color: palette.primary }]}>
                  {formatDistance(request.distanceKm)} away
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.budget, { color: palette.primary }]}>
            {formatRequestBudget(request)}
          </Text>
        </View>

        <Text
          numberOfLines={1}
          style={[styles.location, { color: palette.textSecondary }]}
        >
          {formatRequestLocation(request)}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: theme.spacing.md,
    right: theme.spacing.md,
    bottom: theme.spacing.md,
  },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: theme.spacing.md,
    shadowColor: "#122013",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: theme.spacing.sm,
  },
  pillGroup: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  pill: {
    borderRadius: theme.radius.fill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  budget: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  location: {
    marginTop: 10,
    fontSize: 13,
  },
});
