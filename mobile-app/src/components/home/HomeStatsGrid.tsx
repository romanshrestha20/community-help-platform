import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Stat = { label: string; value: string; icon: React.ComponentProps<typeof Ionicons>["name"] };

type Props = { stats: Stat[] };

export const HomeStatsGrid = ({ stats }: Props) => {
  const { palette } = useThemeContext();

  return (
    <View style={styles.grid}>
      {stats.map((stat) => (
        <View key={stat.label} style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.labelRow}>
            <Ionicons name={stat.icon} size={14} color={palette.primary} />
            <Text style={[styles.label, { color: palette.textSecondary }]}>{stat.label}</Text>
          </View>
          <Text style={[styles.value, { color: palette.textPrimary }]}>{stat.value}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
  value: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
});
