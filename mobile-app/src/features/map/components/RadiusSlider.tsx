import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { RequestRadiusFilter } from "@/features/helpRequest/hooks/useGlobalFilters";

const RADIUS_OPTIONS: RequestRadiusFilter[] = ["5", "10", "25", "50", "100"];

type Props = {
  value: RequestRadiusFilter;
  onChange: (value: RequestRadiusFilter) => void;
  label?: string;
};

export const RadiusSlider = ({ value, onChange, label = "Radius" }: Props) => {
  const { palette } = useThemeContext();

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: palette.textPrimary }]}>{label}</Text>
        <Text style={[styles.valueText, { color: palette.primary }]}>
          {value === "ANY" ? "Anywhere" : `${value} km`}
        </Text>
      </View>

      <View style={styles.optionsRow}>
        {RADIUS_OPTIONS.map((radius) => {
          const active = value === radius;

          return (
            <Pressable
              key={radius}
              onPress={() => onChange(radius)}
              style={({ pressed }) => [
                styles.optionChip,
                {
                  backgroundColor: active ? palette.primary : palette.surface,
                  borderColor: active ? palette.primary : palette.border,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: active ? palette.textInverse : palette.textSecondary },
                ]}
              >
                {radius} km
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => onChange("ANY")}
        style={({ pressed }) => [
          styles.anyButton,
          {
            backgroundColor: value === "ANY" ? `${palette.primary}14` : palette.surfaceMuted,
            borderColor: value === "ANY" ? palette.primary : palette.border,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.anyText,
            {
              color: value === "ANY" ? palette.primary : palette.textSecondary,
            },
          ]}
        >
          Any distance
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: theme.spacing.xs,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  valueText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  anyButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  anyText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
