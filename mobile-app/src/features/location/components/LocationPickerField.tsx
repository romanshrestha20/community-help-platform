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

export function formatShortAddress(location: AppLocation | null): string {
  if (!location) return "Select your current location";

  const primaryParts = [
    location.addressLine1,
    [location.postalCode, location.city].filter(Boolean).join(" "),
  ].filter((part) => typeof part === "string" && part.trim().length > 0);

  if (primaryParts.length > 0) {
    return primaryParts.join(", ");
  }

  const secondaryParts = [location.state, location.country].filter(
    (part) => typeof part === "string" && part.trim().length > 0
  );

  if (secondaryParts.length > 0) {
    return secondaryParts.join(", ");
  }

  if (location.formattedAddress?.trim()) {
    return location.formattedAddress.trim();
  }

  return "Select your current location";
}

export function hasUsableLocation(location: AppLocation | null): boolean {
  if (!location) return false;

  return Boolean(
    location.addressLine1?.trim() ||
      location.city?.trim() ||
      location.state?.trim() ||
      location.country?.trim() ||
      location.postalCode?.trim() ||
      location.formattedAddress?.trim()
  );
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

  const formattedAddress = useMemo(() => formatShortAddress(value), [value]);
  const hasSelectedLocation = useMemo(() => hasUsableLocation(value), [value]);
  const showSuggestions = showStreetSearch && streetQuery.trim().length >= 2;

  return (
    <View style={styles.container}>
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

          <View
            style={
              isWideLayout ? styles.buttonWrapperWide : styles.buttonWrapperStacked
            }
          >
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
                <Text
                  style={[styles.helperTextInline, { color: palette.textSecondary }]}
                >
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
                        backgroundColor: pressed
                          ? palette.surfaceMuted
                          : "transparent",
                      },
                      index === suggestions.length - 1 &&
                        styles.lastSuggestionItem,
                    ]}
                  >
                    <View
                      style={[
                        styles.iconBadge,
                        { backgroundColor: palette.surfaceMuted },
                      ]}
                    >
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color={palette.primary}
                      />
                    </View>

                    <View style={styles.suggestionTextBlock}>
                      <Text
                        style={[
                          styles.suggestionTitle,
                          { color: palette.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {[item.addressLine1, item.postalCode, item.city]
                          .filter(Boolean)
                          .join(", ")}
                      </Text>

                      {!!(item.state || item.country) && (
                        <Text
                          style={[
                            styles.suggestionSubtitle,
                            { color: palette.textSecondary },
                          ]}
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
            ) : (
              <View style={styles.stateRow}>
                <Ionicons
                  name="search-outline"
                  size={16}
                  color={palette.textSecondary}
                />
                <Text
                  style={[styles.helperTextInline, { color: palette.textSecondary }]}
                >
                  No matching addresses found
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.selectedAddressCard,
          {
            backgroundColor: palette.surface,
            borderColor: hasSelectedLocation ? palette.border : palette.border,
          },
        ]}
      >
        <View style={styles.selectedAddressHeader}>
          <View
            style={[
              styles.selectedIconBadge,
              {
                backgroundColor: palette.surfaceMuted,
              },
            ]}
          >
            <Ionicons
              name={hasSelectedLocation ? "checkmark-circle" : "location-outline"}
              size={18}
              color={hasSelectedLocation ? palette.success : palette.textSecondary}
            />
          </View>

          <View style={styles.selectedAddressTextBlock}>
            <Text
              style={[styles.selectedAddressLabel, { color: palette.textSecondary }]}
            >
              {hasSelectedLocation ? "Selected address" : "Location"}
            </Text>
            <Text
              style={[
                styles.valueText,
                {
                  color: hasSelectedLocation
                    ? palette.textPrimary
                    : palette.textSecondary,
                },
              ]}
            >
              {formattedAddress}
            </Text>
          </View>
        </View>
      </View>

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
          <Ionicons
            name="alert-circle-outline"
            size={16}
            color={palette.danger}
          />
          <Text style={[styles.errorText, { color: palette.danger }]}>
            {error}
          </Text>
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
    fontWeight:
      theme.typography.fontWeight.semibold ??
      theme.typography.fontWeight.medium,
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