import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { usePathname, useRouter } from "expo-router";

import { AppBackButton } from "@/components/ui/AppBackButton";
import { AppButton } from "@/components/ui/AppButton";
import { AppDropdown } from "@/components/ui/AppDropDown";
import { AppModal } from "@/components/ui/AppModal";
import { ScreenView, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { RequestList } from "@/features/helpRequest/components/RequestList";
import {
  GlobalFilters,
  applyRequestFiltersAndSort,
} from "@/features/helpRequest/hooks/useGlobalFilters";
import { useRequestList } from "@/features/helpRequest/hooks/useRequestList";
import {
  buildRequestSearchParams,
  useRequestSearch,
} from "@/features/helpRequest/hooks/useRequestSearch";
import {
  HelpRequestStatus,
} from "@/features/helpRequest/types/helpRequest.types";
import { APP_ROUTES } from "@/config/routes";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";
import { useCategories } from "@/features/category/hooks/category.hook";
import { RequestMapView } from "@/features/map/components/RequestMapView";
import { MapRequestFilters } from "@/features/map/types/map.types";
import { BidRequestModal } from "@/features/bid/components/BidRequestModal";
import { useBidRequestFlow } from "@/features/bid/hooks";
import { isRequestOpenForBidding } from "@/features/helpRequest/utils/requestValidation";
import { useDebounce } from "@/hooks/useDebounce";
import { RadiusSlider } from "@/features/map/components/RadiusSlider";

type ChipProps = {
  active?: boolean;
  label: string;
  onPress: () => void;
};

const FilterChip = ({ active = false, label, onPress }: ChipProps) => {
  const { palette } = useThemeContext();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        {
          backgroundColor: active ? palette.primary : palette.surfaceMuted,
          borderColor: active ? palette.primary : palette.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          { color: active ? palette.textInverse : palette.textPrimary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const ViewModeToggle = ({
  value,
  onChange,
}: {
  value: "list" | "map";
  onChange: (value: "list" | "map") => void;
}) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.viewToggleWrap,
        {
          backgroundColor: palette.surfaceMuted,
          borderColor: palette.border,
        },
      ]}
    >
      <Pressable
        onPress={() => onChange("list")}
        style={[
          styles.viewToggleButton,
          {
            backgroundColor: value === "list" ? palette.surface : "transparent",
          },
        ]}
      >
        <Ionicons
          name="list-outline"
          size={16}
          color={value === "list" ? palette.textPrimary : palette.textSecondary}
        />
        <Text
          style={[
            styles.viewToggleText,
            {
              color:
                value === "list" ? palette.textPrimary : palette.textSecondary,
            },
          ]}
        >
          List
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange("map")}
        style={[
          styles.viewToggleButton,
          {
            backgroundColor: value === "map" ? palette.surface : "transparent",
          },
        ]}
      >
        <Ionicons
          name="map-outline"
          size={16}
          color={value === "map" ? palette.textPrimary : palette.textSecondary}
        />
        <Text
          style={[
            styles.viewToggleText,
            {
              color:
                value === "map" ? palette.textPrimary : palette.textSecondary,
            },
          ]}
        >
          Map
        </Text>
      </Pressable>
    </View>
  );
};

const FiltersModal = ({
  visible,
  onClose,
  filters,
  updateFilter,
  resetFilters,
}: {
  visible: boolean;
  onClose: () => void;
  filters: GlobalFilters;
  updateFilter: <K extends "status" | "categoryId" | "sortBy" | "radiusKm">(
    key: K,
    value: GlobalFilters[K]
  ) => void;
  resetFilters: () => void;
}) => {
  const { categories } = useCategories();

  return (
    <AppModal
      visible={visible}
      title="Filter requests"
      onClose={onClose}
      actions={
        <>
          <AppButton title="Reset" variant="ghost" onPress={resetFilters} />
          <AppButton title="Done" variant="primary" onPress={onClose} />
        </>
      }
    >
      <View style={styles.modalContent}>
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
          onSelect={(v) =>
            updateFilter("status", v as "ALL" | HelpRequestStatus)
          }
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
          onSelect={(v) =>
            updateFilter("categoryId", v as GlobalFilters["categoryId"])
          }
          options={[
            { label: "All", value: "ALL" },
            ...categories.map((category) => ({
              label: category.name,
              value: category.id,
            })),
          ]}
        />
        <RadiusSlider
          value={filters.radiusKm}
          onChange={(value) => updateFilter("radiusKm", value)}
        />
      </View>
    </AppModal>
  );
};

export const BrowseRequestsScreen = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { palette } = useThemeContext();
  const {
    filters,
    updateFilter,
    resetFilters,
    searchQuery,
    setSearchQuery,
    resetSearch,
  } = useRequestSearch();
  const { categories } = useCategories();
  const [filtersVisible, setFiltersVisible] = useState(false);
  const isMapRoute = pathname.endsWith("/requests/map");
  const [viewMode, setViewMode] = useState<"list" | "map">(isMapRoute ? "map" : "list");
  const {
    bidModalVisible,
    selectedRequest,
    submittingBid,
    bidError,
    openBidModal,
    closeBidModal,
    handleSubmitBid,
  } = useBidRequestFlow({
    onSuccess: () => refreshRequests(),
  });

  const { value: userLocation } = useLocationPicker({
    autoUseCurrentLocationOnMount: true,
  });
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const hasCoordinates =
    userLocation?.latitude != null &&
    userLocation?.longitude != null &&
    Number.isFinite(userLocation.latitude) &&
    Number.isFinite(userLocation.longitude);

  const requestParams = useMemo(
    () =>
      buildRequestSearchParams(filters, debouncedSearchQuery, {
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
      }),
    [
      debouncedSearchQuery,
      filters,
      userLocation?.latitude,
      userLocation?.longitude,
    ]
  );

  const { requests, loading, refreshing, refreshRequests } = useRequestList({
    scope: "browse",
    params: requestParams,
    useNearbyEndpoint: filters.radiusKm !== "ANY" && hasCoordinates,
  });

  const medicalCategory = categories.find(
    (category) => category.name.trim().toLowerCase() === "medical"
  );

  const isNearbyActive = filters.radiusKm !== "ANY";
  const isMedicalActive = Boolean(
    medicalCategory && filters.categoryId === medicalCategory.id
  );
  const allActive = filters.categoryId === "ALL" && filters.radiusKm === "ANY";

  const filteredRequests = useMemo(
    () =>
      applyRequestFiltersAndSort(requests, filters, {
        searchQuery: debouncedSearchQuery,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
      }),
    [
      debouncedSearchQuery,
      filters,
      requests,
      userLocation?.latitude,
      userLocation?.longitude,
    ]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== "ALL") count += 1;
    if (filters.categoryId !== "ALL") count += 1;
    if (filters.radiusKm !== "ANY") count += 1;
    if (filters.sortBy !== "NEWEST") count += 1;
    if (searchQuery.trim()) count += 1;
    return count;
  }, [filters, searchQuery]);

  const mapFilters = useMemo<MapRequestFilters>(
    () => ({
      latitude: userLocation?.latitude,
      longitude: userLocation?.longitude,
      categoryId: filters.categoryId === "ALL" ? null : filters.categoryId,
      status: filters.status,
      search: debouncedSearchQuery.trim() || undefined,
      radiusKm: filters.radiusKm === "ANY" ? undefined : Number(filters.radiusKm),
    }),
    [
      filters.categoryId,
      filters.radiusKm,
      filters.status,
      debouncedSearchQuery,
      userLocation?.latitude,
      userLocation?.longitude,
    ]
  );

  const handleResetAll = () => {
    resetSearch();
  };

  useEffect(() => {
    setViewMode(isMapRoute ? "map" : "list");
  }, [isMapRoute]);

  const handleChangeViewMode = (nextView: "list" | "map") => {
    setViewMode(nextView);

    if (nextView === "map" && !isMapRoute) {
      router.replace(APP_ROUTES.HOME_REQUESTS_MAP);
      return;
    }

    if (nextView === "list" && isMapRoute) {
      router.replace(APP_ROUTES.HOME_REQUESTS);
    }
  };

  return (
    <ScreenView>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <AppBackButton
            title=""
            iconOnly
            variant="secondary"
            size="sm"
            fallback={APP_ROUTES.HOME}
          />
          <View style={styles.headerTitleWrap}>
            <View style={styles.headerTitleRow}>
              <Ionicons
                name="location-outline"
                size={18}
                color={palette.primary}
              />
              <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>
                Browse Requests
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: palette.textSecondary }]}>
              Find nearby requests from other community members.
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.searchCard,
          {
            backgroundColor: palette.surface,
            shadowColor: palette.shadow,
          },
        ]}
      >
        <View style={styles.searchInputShell}>
          <Ionicons
            name="search-outline"
            size={18}
            color={palette.textSecondary}
          />
          <TextInput
            placeholder="Search by title, category, or location"
            placeholderTextColor={palette.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
            style={[styles.searchInput, { color: palette.textPrimary }]}
          />
        </View>

        <View style={styles.resultSummaryRow}>
          <Text style={[styles.resultSummaryText, { color: palette.textSecondary }]}>
            {loading && !requests.length
              ? "Loading requests..."
              : `${filteredRequests.length} request${filteredRequests.length === 1 ? "" : "s"} shown`}
          </Text>
          {searchQuery !== debouncedSearchQuery ? (
            <Text style={[styles.resultSummaryText, { color: palette.primary }]}>
              Updating...
            </Text>
          ) : null}
        </View>

        <View style={styles.chipRow}>
          <FilterChip
            label="All"
            active={allActive}
            onPress={() => {
              updateFilter("categoryId", "ALL");
              updateFilter("radiusKm", "ANY");
            }}
          />
          <FilterChip
            label="Nearby"
            active={isNearbyActive}
            onPress={() =>
              updateFilter("radiusKm", isNearbyActive || !hasCoordinates ? "ANY" : "10")
            }
          />
          {medicalCategory ? (
            <FilterChip
              label="Medical"
              active={isMedicalActive}
              onPress={() => {
                updateFilter(
                  "categoryId",
                  isMedicalActive ? "ALL" : medicalCategory.id
                );
              }}
            />
          ) : null}
        </View>


        <View style={styles.secondaryActionsRow}>
          <ViewModeToggle value={viewMode} onChange={handleChangeViewMode} />

          <Pressable
            onPress={() => setFiltersVisible(true)}
            style={({ pressed }) => [
              styles.secondaryAction,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons
              name="options-outline"
              size={16}
              color={palette.textSecondary}
            />
            <Text
              style={[
                styles.secondaryActionText,
                { color: palette.textSecondary },
              ]}
            >
              Filter
              {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleResetAll}
            disabled={activeFilterCount === 0}
            style={({ pressed }) => [
              styles.secondaryAction,
              { opacity: activeFilterCount === 0 ? 0.45 : pressed ? 0.7 : 1 },
            ]}
          >
            <Text
              style={[
                styles.secondaryActionText,
                { color: palette.textSecondary },
              ]}
            >
              Reset
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {viewMode === "list" ? (
          <RequestList
            requests={filteredRequests}
            loading={loading}
            userLocation={userLocation}
            onPressItem={(item) =>
              router.push(APP_ROUTES.HOME_REQUEST_DETAILS(item.id))
            }
            onBidItem={openBidModal}
            isBidActionDisabled={(item) => !isRequestOpenForBidding(item.status)}
            showFavoriteAction
            favoriteActionLabel="Favorite"
            bidActionLabel="Submit Bid"
            refreshing={refreshing}
            onRefresh={refreshRequests}
            emptyTitle={
              searchQuery
                ? "No requests match your search"
                : "No requests match your filters"
            }
            emptyDescription={
              searchQuery
                ? "Try a different search keyword or reset all filters."
                : filters.radiusKm !== "ANY" && !hasCoordinates
                  ? "Enable location or use Any distance to browse more requests."
                  : "Try widening your radius or resetting filters."
            }
            emptyActionLabel="Reset"
            onPressEmptyAction={handleResetAll}
          />
        ) : (
          <RequestMapView
            filters={mapFilters}
            onOpenRequest={(requestId) =>
              router.push(APP_ROUTES.HOME_REQUEST_DETAILS(requestId))
            }
            onBidRequest={openBidModal}
          />
        )}
      </View>

      <FiltersModal
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        filters={filters}
        updateFilter={updateFilter}
        resetFilters={resetFilters}
      />

      <BidRequestModal
        visible={bidModalVisible}
        selectedRequest={selectedRequest}
        onClose={closeBidModal}
        onSubmit={handleSubmitBid}
        loading={submittingBid}
        error={bidError}
      />
    </ScreenView>
  );
};

export default BrowseRequestsScreen;

const styles = StyleSheet.create({
  header: {
    marginBottom: theme.spacing.md,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: theme.spacing.sm,
  },
  headerTitleWrap: {
    flex: 1,
    paddingTop: 2,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  headerSubtitle: {
    marginTop: 8,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
    fontWeight: theme.typography.fontWeight.medium,
  },
  searchCard: {
    borderRadius: 24,
    padding: 16,
    marginBottom: theme.spacing.md,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  searchInputShell: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: "#ECE7DC",
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  resultSummaryRow: {
    minHeight: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  resultSummaryText: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  filterChip: {
    minHeight: 36,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.fill,
    justifyContent: "center",
    alignItems: "center",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  secondaryActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 12,
  },
  inlineRadiusWrap: {
    borderWidth: 1,
    borderRadius: 16,
    padding: theme.spacing.sm,
    marginBottom: 12,
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
  },
  secondaryActionText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  viewToggleWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.radius.fill,
    padding: 4,
    borderWidth: 1,
  },
  viewToggleButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: theme.radius.fill,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
  },
  viewToggleText: {
    fontSize: 13,
    fontWeight: "700",
  },
  contentContainer: {
    flex: 1,
  },
  modalContent: {
    gap: theme.spacing.sm,
  },
});
