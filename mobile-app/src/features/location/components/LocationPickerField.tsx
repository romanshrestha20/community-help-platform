import React, { useMemo } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { theme } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { AppLocation, LocationSuggestion } from "../types/location.types";
import { formatCompactAddress, shortenPlainAddress } from "../utils/address";

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
  const showStreetSearch =
    typeof onStreetQueryChange === "function" &&
    typeof onSelectSuggestion === "function";

  const formattedAddress = useMemo(
    () => formatCompactAddress(value, "Select your current location"),
    [value]
  );
  const hasSelectedLocation = useMemo(() => hasUsableLocation(value), [value]);
  const showSuggestions = showStreetSearch && streetQuery.trim().length >= 2;
  const showNoMatches =
    showSuggestions && !suggestionsLoading && suggestions.length === 0 && !hasSelectedLocation;
  const showSuggestionDropdown =
    showSuggestions && (suggestionsLoading || suggestions.length > 0 || showNoMatches);
  const selectedBackground = hasSelectedLocation
    ? (palette.successSoft ?? palette.surfaceMuted)
    : palette.surface;

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


        <View style={styles.topRowStacked}>
          <View style={styles.inputWrapper}>
            <AppInput
              label="Street address"
              placeholder="Type street name"
              value={streetQuery}
              onChangeText={onStreetQueryChange}
              containerStyle={styles.streetInputContainer}
            />
          </View>

          <View style={styles.buttonWrapperStacked}>
            <AppButton
              title={loading ? "Detecting..." : "Use current location"}
              onPress={onUseCurrentLocation}
              loading={loading}
              disabled={loading}
              fullWidth
              variant="secondary"
              icon={
                !loading ? (
                  <Ionicons
                    name="locate"
                    size={theme.typography.fontSize.md}
                    color={palette.textPrimary}
                  />
                ) : undefined
              }
            />
          </View>
        </View>

        {showSuggestionDropdown ? (
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
                        size={theme.typography.fontSize.md}
                        color={palette.primary}
                      />
                    </View>

                    <View style={styles.suggestionTextBlock}>
                      {(() => {
                        const suggestionTitle = formatCompactAddress(
                          item,
                          item.label || "Address unavailable"
                        );
                        const suggestionSubtitle = shortenPlainAddress(
                          item.formattedAddress,
                          ""
                        );
                        const showSubtitle =
                          suggestionSubtitle.length > 0 && suggestionSubtitle !== suggestionTitle;

                        return (
                          <>
                            <Text
                              style={[
                                styles.suggestionTitle,
                                { color: palette.textPrimary },
                              ]}
                              numberOfLines={1}
                            >
                              {suggestionTitle}
                            </Text>

                            {showSubtitle ? (
                              <Text
                                style={[
                                  styles.suggestionSubtitle,
                                  { color: palette.textSecondary },
                                ]}
                                numberOfLines={1}
                              >
                                {suggestionSubtitle}
                              </Text>
                            ) : null}
                          </>
                        );
                      })()}
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={theme.typography.fontSize.md}
                      color={palette.textSecondary}
                    />
                  </Pressable>
                )}
              />
            ) : showNoMatches ? (
              <View style={styles.stateRow}>
                <Ionicons
                  name="search-outline"
                  size={theme.typography.fontSize.md}
                  color={palette.textSecondary}
                />
                <Text
                  style={[styles.helperTextInline, { color: palette.textSecondary }]}
                >
                  No matching addresses found
                </Text>
              </View>
            ) : null
            }
          </View>
        ) : null}
        <View
          style={[
            styles.selectedAddressCard,
            {
              backgroundColor: selectedBackground,
              borderColor: hasSelectedLocation ? palette.success : palette.border,
            },
          ]}
        >
          <View style={styles.selectedAddressHeader}>
            <View
              style={[
                styles.selectedIconBadge,
                {
                  backgroundColor: hasSelectedLocation
                    ? (palette.successSoft ?? palette.surfaceMuted)
                    : palette.surfaceMuted,
                },
              ]}
            >
              <Ionicons
                name={hasSelectedLocation ? "checkmark-circle" : "location-outline"}
                size={theme.typography.fontSize.md}
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
            size={theme.typography.fontSize.md}
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
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  headerBlock: {
    gap: theme.spacing.xxs,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  sectionDescription: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
  },
  topRowStacked: {
    flexDirection: "column",
    gap: theme.spacing.sm,
  },
  inputWrapper: {
    minWidth: 0,
  },
  streetInputContainer: {
    marginBottom: 0,
  },
  buttonWrapperStacked: {
    width: "100%",
    justifyContent: "flex-end",
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    maxHeight: 220,
    overflow: "hidden",
  },
  suggestionItem: {
    minHeight: 52,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  lastSuggestionItem: {
    borderBottomWidth: 0,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionTextBlock: {
    flex: 1,
    gap: theme.spacing.xxs,
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
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  helperTextInline: {
    fontSize: theme.typography.fontSize.xs,
  },
  selectedAddressCard: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  selectedAddressHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.xs,
  },
  selectedIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  selectedAddressTextBlock: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  selectedAddressLabel: {
    fontSize: theme.typography.fontSize.xs,
  },
  valueText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight:
      theme.typography.fontWeight.semibold ??
      theme.typography.fontWeight.medium,
    lineHeight: 18,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.xs,
  },
  errorText: {
    flex: 1,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 18,
  },
});