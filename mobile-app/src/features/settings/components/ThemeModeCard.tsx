import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { ThemeMode } from "@/types/tabBar";
import { theme } from "@/design-system";
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
        <ActivityIndicator color={palette.primary} />
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
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: theme.typography.letterSpacing.tight,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.fill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  chipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
});
