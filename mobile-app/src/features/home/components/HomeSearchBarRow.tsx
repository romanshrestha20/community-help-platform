import React from "react";
import { StyleSheet, View } from "react-native";

import { SearchField } from "@/components/ui/SearchField";
import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  searchQuery: string;
  onChangeSearch: (value: string) => void;
};

export function HomeSearchBarRow({
  searchQuery,
  onChangeSearch,
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
});
