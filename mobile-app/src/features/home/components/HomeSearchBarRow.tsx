import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { SearchField } from "@/components/ui/SearchField";
import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  searchQuery: string;
  onChangeSearch: (value: string) => void;
  onPressFilter: () => void;
};

export function HomeSearchBarRow({
  searchQuery,
  onChangeSearch,
  onPressFilter,
}: Props) {
  const { palette } = useThemeContext();

  return (
    <View style={styles.searchRow}>
      <View style={styles.searchWrap}>
        <SearchField
          value={searchQuery}
          onChangeText={onChangeSearch}
          placeholder="Search requests..."
          containerStyle={[
            styles.searchField,
            { backgroundColor: palette.surface },
          ]}
        />
      </View>

      <Pressable
        onPress={onPressFilter}
        style={({ pressed }) => [
          styles.filterButton,
          {
            backgroundColor: palette.primary,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <Ionicons name="options-outline" size={24} color={palette.textInverse} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: theme.spacing.sm,
  },
  searchWrap: {
    flex: 1,
  },
  searchField: {
    minHeight: 54,
    borderRadius: 27,
  },
  filterButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#122013",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
});
