import React, { useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { Stack, theme } from "@/design-system";
import { AppDropdown } from "@/components/ui/AppDropDown";
import { AppButton } from "@/components/ui/AppButton";
import Ionicons from "@expo/vector-icons/Ionicons";
import { GlobalFilters } from "@/features/helpRequest/hooks/useGlobalFilters";
import { HelpRequestStatus } from "@/features/helpRequest/types/helpRequest.types";
import { AppModal } from "@/components/ui/AppModal";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useCategories } from "@/features/category/hooks/category.hook";

interface Props {
  filters: GlobalFilters;
  updateFilter: <K extends "status" | "categoryId" | "sortBy" | "radiusKm">(
    key: K,
    value: GlobalFilters[K]
  ) => void;
  resetFilters: () => void;
}

export const RequestFilters = ({ filters, updateFilter, resetFilters }: Props) => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 600; // Example breakpoint
  const [modalVisible, setModalVisible] = useState(false);
  const { palette } = useThemeContext();
  const { categories } = useCategories();

  const Dropdowns = (
    <Stack gap="sm" style={styles.dropdownGroup}>
      <AppDropdown
        label="Sort"
        value={filters.sortBy}
        onSelect={(v) => updateFilter("sortBy", v as GlobalFilters["sortBy"])}
        options={[
          { label: "Newest", value: "NEWEST" },
          { label: "Oldest", value: "OLDEST" },
          { label: "Most Bids", value: "MOST_BIDS" },
        ]}
      />
      <AppDropdown
        label="Status"
        value={filters.status}
        onSelect={(v) => updateFilter("status", v as "ALL" | HelpRequestStatus)}
        options={[
          { label: "All", value: "ALL" },
          { label: "Open", value: "OPEN" },
          { label: "Assigned", value: "ASSIGNED" },
          { label: "Completed", value: "COMPLETED" },
          { label: "Cancelled", value: "CANCELLED" },
        ]}
      />
      <AppDropdown
        label="Category"
        value={filters.categoryId}
        onSelect={(v) => updateFilter("categoryId", v as GlobalFilters["categoryId"])}
        options={[
          { label: "All", value: "ALL" },
          ...categories.map((category) => ({
            label: category.name,
            value: category.id,
          })),
        ]}
      />
      <AppDropdown
        label="Radius"
        value={filters.radiusKm}
        onSelect={(v) => updateFilter("radiusKm", v as GlobalFilters["radiusKm"])}
        options={[
          { label: "Any distance", value: "ANY" },
          { label: "Within 5 km", value: "5" },
          { label: "Within 10 km", value: "10" },
          { label: "Within 25 km", value: "25" },
          { label: "Within 50 km", value: "50" },
          { label: "Within 100 km", value: "100" },
        ]}
      />
      <AppButton onPress={resetFilters} title="Reset" variant="ghost" />
    </Stack>
  );

  if (isSmallScreen) {
    return (
      <View style={styles.inlineActions}>
        <AppButton
          title="Filter"
          onPress={() => setModalVisible(true)}
          variant="ghost"
          fullWidth={false}
          icon={<Ionicons name="options-outline" size={16} color={palette.textPrimary} />}
        />
        <AppButton title="Reset" onPress={resetFilters} variant="ghost" fullWidth={false} />
        <AppModal
          visible={modalVisible}
          title="Filters"
          onClose={() => setModalVisible(false)}
          actions={
            <AppButton title="Close" variant="ghost" onPress={() => setModalVisible(false)} />
          }
        >
          {Dropdowns}
        </AppModal>
      </View>
    );
  }

  return <View style={styles.rowContainer}>{Dropdowns}</View>;
};

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.xs,
  },
  inlineActions: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: theme.spacing.xs,
    marginVertical: theme.spacing.xs,
  },
  dropdownGroup: {
    flex: 1,
    minWidth: 50,
    gap: theme.spacing.sm,
  },
});
