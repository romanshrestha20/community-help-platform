import React, { useMemo } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { theme } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { AppLocation, LocationSuggestion } from "../types/location.types";

type Props = {
  value: AppLocation | null;
  loading?: boolean;
  error?: string | null;
  onUseCurrentLocation: () => Promise<void>;

  streetQuery?: string;
  onStreetQueryChange?: (value: string) => void;
  suggestions?: LocationSuggestion[];
  suggestionsLoading?: boolean;
  onSelectSuggestion?: (suggestion: LocationSuggestion) => Promise<void> | void;
};

export function formatShortAddress({ location }: { location: AppLocation | null; }): string {
  if (!location) return "No location selected";

  const primaryParts = [
    location.addressLine1,
    [location.postalCode, location.city].filter(Boolean).join(" "),
  ].filter((part) => typeof part === "string" && part.trim().length > 0);

  // Prefer showing street address if available, 
  // otherwise fallback to state/country or formatted address
  if (primaryParts.length > 0) {
    return primaryParts.join(", ");
  }

  // If no street address, try state and country
  const secondaryParts = [location.state, location.country].filter(
    (part) => typeof part === "string" && part.trim().length > 0
  );

  // If we have state or country info, show that
  if (secondaryParts.length > 0) {
    return secondaryParts.join(", ");
  }

  if (location.formattedAddress && location.formattedAddress.trim().length > 0) {
    // Example:
    return location.formattedAddress;
  }

  return "Current location selected";
}

export default function LocationPickerField({
  value,
  loading = false,
  error,
  onUseCurrentLocation,
  streetQuery = "",
  onStreetQueryChange,
  suggestions = [],
  suggestionsLoading = false,
  onSelectSuggestion,
}: Props) {
  const { palette } = useThemeContext();
  const { width } = useWindowDimensions();

  const isWideLayout = width >= 700;
  const showStreetSearch =
    typeof onStreetQueryChange === "function" &&
    typeof onSelectSuggestion === "function";

  const formattedAddress = useMemo(() => formatShortAddress({ location: value }), [value]);

  const showSuggestions = showStreetSearch && streetQuery.trim().length >= 2;

  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <Text style={[styles.label, { color: palette.textPrimary }]}>Location</Text>
        <Text style={[styles.caption, { color: palette.textSecondary }]}>
          Search your street address or use your current location.
        </Text>
      </View>

      <View
        style={[
          styles.searchCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
      >
        <View
          style={[
            styles.topRow,
            isWideLayout ? styles.topRowWide : styles.topRowStacked,
          ]}
        >
          <View style={styles.inputWrapper}>
            <AppInput
              label="Street address"
              placeholder="Type street name"
              value={streetQuery}
              onChangeText={onStreetQueryChange}
            />
          </View>

          <View style={isWideLayout ? styles.buttonWrapperWide : styles.buttonWrapperStacked}>
            <AppButton
              title={loading ? "Detecting..." : "Use current location"}
              onPress={onUseCurrentLocation}
              loading={loading}
              disabled={loading}
              fullWidth={!isWideLayout}
              icon={
                !loading ? (
                  <Ionicons
                    name="locate"
                    size={18}
                    color={palette.textInverse}
                  />
                ) : undefined
              }
            />
          </View>
        </View>

        {showSuggestions ? (
          <View
            style={[
              styles.dropdown,
              {
                backgroundColor: palette.background,
                borderColor: palette.border,
              },
            ]}
          >
            {suggestionsLoading ? (
              <View style={styles.stateRow}>
                <ActivityIndicator size="small" />
                <Text style={[styles.helperTextInline, { color: palette.textSecondary }]}>
                  Searching addresses...
                </Text>
              </View>
            ) : suggestions.length > 0 ? (
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <Pressable
                    onPress={() => onSelectSuggestion?.(item)}
                    style={({ pressed }) => [
                      styles.suggestionItem,
                      {
                        borderBottomColor: palette.border,
                        backgroundColor: pressed ? palette.surfaceMuted : "transparent",
                      },
                      index === suggestions.length - 1 && styles.lastSuggestionItem,
                    ]}
                  >
                    <View style={[styles.iconBadge, { backgroundColor: palette.surfaceMuted }]}>
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color={palette.primary}
                      />
                    </View>

                    <View style={styles.suggestionTextBlock}>
                      <Text
                        style={[styles.suggestionTitle, { color: palette.textPrimary }]}
                        numberOfLines={1}
                      >
                        {[item.addressLine1, item.postalCode, item.city]
                          .filter(Boolean)
                          .join(", ")}
                      </Text>

                      {!!(item.state || item.country) && (
                        <Text
                          style={[styles.suggestionSubtitle, { color: palette.textSecondary }]}
                          numberOfLines={1}
                        >
                          {[item.state, item.country].filter(Boolean).join(", ")}
                        </Text>
                      )}
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={palette.textSecondary}
                    />
                  </Pressable>
                )}
              />
            ) : !value ? (
              <View style={styles.stateRow}>
                <Ionicons
                  name="search-outline"
                  size={16}
                  color={palette.textSecondary}
                />
                <Text style={[styles.helperTextInline, { color: palette.textSecondary }]}>
                  No matching addresses found
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {value ? (
        <View
          style={[
            styles.selectedAddressCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          <View style={styles.selectedAddressHeader}>
            <View
              style={[
                styles.selectedIconBadge,
                { backgroundColor: palette.surfaceMuted },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={palette.success}
              />
            </View>

            <View style={styles.selectedAddressTextBlock}>
              <Text
                style={[styles.selectedAddressLabel, { color: palette.textSecondary }]}
              >
                Selected address
              </Text>
              <Text style={[styles.valueText, { color: palette.textPrimary }]}>
                {formattedAddress}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {error ? (
        <View
          style={[
            styles.errorBox,
            {
              backgroundColor: palette.dangerSoft ?? palette.surface,
              borderColor: palette.danger,
            },
          ]}
        >
          <Ionicons name="alert-circle-outline" size={16} color={palette.danger} />
          <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  headerBlock: {
    gap: 4,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold ?? theme.typography.fontWeight.medium,
  },
  caption: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 18,
  },
  searchCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  topRow: {
    gap: theme.spacing.sm,
  },
  topRowWide: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  topRowStacked: {
    flexDirection: "column",
  },
  inputWrapper: {
    flex: 1,
  },
  buttonWrapperWide: {
    minWidth: 180,
  },
  buttonWrapperStacked: {
    width: "100%",
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 14,
    maxHeight: 240,
    overflow: "hidden",
  },
  suggestionItem: {
    minHeight: 60,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  lastSuggestionItem: {
    borderBottomWidth: 0,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionTextBlock: {
    flex: 1,
    gap: 2,
  },
  suggestionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  suggestionSubtitle: {
    fontSize: theme.typography.fontSize.xs,
  },
  stateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  helperTextInline: {
    fontSize: theme.typography.fontSize.xs,
  },
  selectedAddressCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: theme.spacing.sm,
  },
  selectedAddressHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  selectedIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  selectedAddressTextBlock: {
    flex: 1,
    gap: 2,
  },
  selectedAddressLabel: {
    fontSize: theme.typography.fontSize.xs,
  },
  valueText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold ?? theme.typography.fontWeight.medium,
    lineHeight: 20,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 18,
  },
});