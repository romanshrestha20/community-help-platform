import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  mappedCount: number;
  onPressRecenter: () => void;
  onPressSearchArea?: () => void;
  showSearchAreaButton?: boolean;
};

export const MapFloatingActions = ({
  mappedCount,
  onPressRecenter,
  onPressSearchArea,
  showSearchAreaButton = false,
}: Props) => {
  const { themeMode } = useThemeContext();
  const isDarkMode = themeMode === "dark";
  const overlaySurface = isDarkMode ? "rgba(17, 27, 24, 0.92)" : "rgba(24, 35, 31, 0.92)";
  const overlayBorder = isDarkMode ? "rgba(153, 196, 178, 0.28)" : "rgba(151, 204, 186, 0.24)";
  const overlayText = "#E9F4EF";
  const overlayAccent = "#74D0B4";

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.countPill,
          {
            backgroundColor: overlaySurface,
            borderColor: overlayBorder,
          },
        ]}
      >
        <Ionicons name="location-outline" size={16} color={overlayAccent} />
        <Text style={[styles.countText, { color: overlayText }]}>
          {mappedCount} mapped request{mappedCount === 1 ? "" : "s"}
        </Text>
      </View>

      <View style={styles.rightActions}>
        {showSearchAreaButton ? (
          <Pressable
            onPress={onPressSearchArea}
            style={({ pressed }) => [
              styles.searchAreaButton,
              {
                backgroundColor: "#2B7D66",
                borderColor: "#3F9A7F",
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <Text style={styles.searchAreaText}>Search this area</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onPressRecenter}
          style={({ pressed }) => [
            styles.recenterButton,
            {
              backgroundColor: overlaySurface,
              borderColor: overlayBorder,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <Ionicons name="locate-outline" size={18} color={overlayText} />
        </Pressable>
      </View>
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
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
  },
  searchAreaButton: {
    minHeight: 42,
    paddingHorizontal: 16,
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
  searchAreaText: {
    color: "#E9F4EF",
    fontSize: 13,
    fontWeight: "800",
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
