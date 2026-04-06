import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { ThemeMode } from "@/types/tabBar";
import { useThemeStore } from "../store/theme.store";
import { useThemeContext } from "../hooks/useThemeContext";

const options: ThemeMode[] = ["light", "dark", "system"];

export const ThemeModeCard = () => {
  const { palette } = useThemeContext();
  const { themeMode, isHydrated, setThemeMode } = useThemeStore();

  if (!isHydrated) {
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
        <ActivityIndicator />
      </View>
    );
  }

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
      <Text style={[styles.title, { color: palette.textPrimary }]}>Appearance</Text>
      <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
        Choose how the app looks on your device.
      </Text>

      <View style={styles.row}>
        {options.map((option) => {
          const active = themeMode === option;

          return (
            <Pressable
              key={option}
              onPress={() => setThemeMode(option)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? palette.primary : palette.surfaceMuted,
                  borderColor: active ? palette.primary : palette.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: active ? palette.textInverse : palette.textPrimary,
                  },
                ]}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "700",
  },
});