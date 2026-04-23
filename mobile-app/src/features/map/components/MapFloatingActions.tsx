import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  mappedCount: number;
  onPressRecenter: () => void;
};

export const MapFloatingActions = ({
  mappedCount,
  onPressRecenter,
}: Props) => {
  const { palette } = useThemeContext();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.countPill,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
      >
        <Ionicons name="location-outline" size={16} color={palette.primary} />
        <Text style={[styles.countText, { color: palette.textPrimary }]}>
          {mappedCount} mapped request{mappedCount === 1 ? "" : "s"}
        </Text>
      </View>

      <Pressable
        onPress={onPressRecenter}
        style={({ pressed }) => [
          styles.recenterButton,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <Ionicons name="locate-outline" size={18} color={palette.textPrimary} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: theme.spacing.sm,
  },
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    shadowColor: "#122013",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  countText: {
    fontSize: 13,
    fontWeight: "700",
  },
  recenterButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#122013",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
});
