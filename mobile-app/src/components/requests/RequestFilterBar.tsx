import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  searchQuery: string;
  onChangeSearch: (value: string) => void;
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  urgentOnly: boolean;
  onToggleUrgent: () => void;
  viewMode: "grid" | "map";
  onChangeViewMode: (value: "grid" | "map") => void;
  showMoreFilters: boolean;
  onToggleMoreFilters: () => void;
};

export const RequestFilterBar = ({
  searchQuery,
  onChangeSearch,
  categories,
  activeCategory,
  onSelectCategory,
  urgentOnly,
  onToggleUrgent,
  viewMode,
  onChangeViewMode,
  showMoreFilters,
  onToggleMoreFilters,
}: Props) => {
  const { palette } = useThemeContext();
  const basicCategories = categories.slice(0, 8);
  const advancedCategories = categories.slice(8);

  return (
    <View style={[styles.wrap, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <View style={[styles.searchWrap, { backgroundColor: palette.surfaceMuted }]}>
        <Ionicons name="search-outline" size={16} color={palette.textSecondary} />
        <TextInput
          value={searchQuery}
          onChangeText={onChangeSearch}
          placeholder="Filter requests in this feed"
          placeholderTextColor={palette.textMuted}
          style={[styles.searchInput, { color: palette.textPrimary }]}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {basicCategories.map((category) => {
          const active = activeCategory === category;
          return (
            <Pressable
              key={category}
              onPress={() => onSelectCategory(category)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: active ? palette.primary : pressed ? palette.surface : palette.surfaceMuted,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: active ? palette.textInverse : palette.textSecondary }]}>{category}</Text>
            </Pressable>
          );
        })}
        {advancedCategories.length ? (
          <Pressable
            onPress={onToggleMoreFilters}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: pressed ? palette.surface : palette.surfaceMuted,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: palette.textSecondary }]}>
              {showMoreFilters ? "Less filters" : "More filters"}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {showMoreFilters ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {advancedCategories.map((category) => {
            const active = activeCategory === category;
            return (
              <Pressable
                key={category}
                onPress={() => onSelectCategory(category)}
                style={[styles.chip, { backgroundColor: active ? palette.primary : palette.surfaceMuted }]}
              >
                <Text style={[styles.chipText, { color: active ? palette.textInverse : palette.textSecondary }]}>{category}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <View style={styles.rightRow}>
        <Pressable
          onPress={onToggleUrgent}
          style={({ pressed }) => [
            styles.toggle,
            {
              borderColor: urgentOnly ? palette.danger : palette.border,
              backgroundColor: pressed ? palette.surfaceMuted : "transparent",
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[styles.toggleText, { color: urgentOnly ? palette.danger : palette.textSecondary }]}>Urgent only</Text>
        </Pressable>
       
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  searchWrap: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
  },
  chipsRow: {
    gap: 8,
  },
  chip: {
    height: 30,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggle: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 30,
    justifyContent: "center",
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "700",
  },
  viewSwitch: {
    padding: 3,
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
  },
  switchBtn: {
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 999,
    justifyContent: "center",
  },
  switchText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
