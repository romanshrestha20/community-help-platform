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
import { HelpRequestStatus } from "@/features/helpRequest/types/helpRequest.types";
import { APP_ROUTES } from "@/config/routes";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";
import { useCategories } from "@/features/category/hooks/category.hook";
import { RequestMapView } from "@/features/map/components/RequestMapView";
import { BidRequestModal } from "@/features/bid/components/BidRequestModal";
import { useBidRequestFlow } from "@/features/bid/hooks";
import { isRequestOpenForBidding } from "@/features/helpRequest/utils/requestValidation";
import { useDebounce } from "@/hooks/useDebounce";
import { RadiusSlider } from "@/features/map/components/RadiusSlider";
import { isUrgentRequestActive } from "@/features/helpRequest/utils/urgent";

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
  const { palette } = useThemeContext();

  return (
    <AppModal
      visible={visible}
      title="Filter requests"
      onClose={onClose}
      actions={
        <>
          <AppButton title="Reset" variant="ghost" onPress={resetFilters} />
          <AppButton title="Apply filter" variant="primary" onPress={onClose} />
        </>
      }
    >
      <View style={styles.modalContent}>
        <View
          style={[
            styles.modalSection,
            {
              backgroundColor: palette.surfaceMuted,
              borderColor: palette.border,
              shadowColor: palette.shadow,
            },
          ]}
        >
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
        </View>
        <View
          style={[
            styles.modalSection,
            {
              backgroundColor: palette.surfaceMuted,
              borderColor: palette.border,
              shadowColor: palette.shadow,
            },
          ]}
        >
          <RadiusSlider
            value={filters.radiusKm}
            onChange={(value) => updateFilter("radiusKm", value)}
          />
        </View>
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
    useNearbyEndpoint: true,
  });

  const isNearbyActive = filters.radiusKm !== "ANY";
  const allActive =
    filters.categoryId === "ALL" &&
    filters.radiusKm === "ANY" &&
    !filters.urgentOnly;
  const urgentOnlyActive = filters.urgentOnly;

  const publicFeedRequests = useMemo(
    () => requests.filter((request) => request.status === "OPEN"),
    [requests]
  );

  const filteredRequests = useMemo(
    () =>
      applyRequestFiltersAndSort(publicFeedRequests, filters, {
        searchQuery: debouncedSearchQuery,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
      }),
    [
      debouncedSearchQuery,
      filters,
      publicFeedRequests,
      userLocation?.latitude,
      userLocation?.longitude,
    ]
  );
  const urgentOpenCount = useMemo(
    () => publicFeedRequests.filter((request) => isUrgentRequestActive(request)).length,
    [publicFeedRequests]
  );
  const locationLabel =
    userLocation?.city?.trim() ||
    userLocation?.addressLine1?.trim() ||
    "Nearby";

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== "ALL") count += 1;
    if (filters.categoryId !== "ALL") count += 1;
    if (filters.urgentOnly) count += 1;
    if (filters.radiusKm !== "ANY") count += 1;
    if (filters.sortBy !== "NEWEST") count += 1;
    if (searchQuery.trim()) count += 1;
    return count;
  }, [filters, searchQuery]);

  const handleResetAll = () => {
    resetFilters();
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
                Nearby Requests
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: palette.textSecondary }]}>
              {locationLabel} · {filteredRequests.length} open request
              {filteredRequests.length === 1 ? "" : "s"}
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
              : `${filteredRequests.length} open request${filteredRequests.length === 1 ? "" : "s"} shown`}
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
              updateFilter("urgentOnly", false);
            }}
          />
          <FilterChip
            label="Nearby"
            active={isNearbyActive}
            onPress={() =>
              updateFilter("radiusKm", isNearbyActive || !hasCoordinates ? "ANY" : "10")
            }
          />
          <FilterChip
            label="Urgent"
            active={urgentOnlyActive}
            onPress={() => updateFilter("urgentOnly", !urgentOnlyActive)}
          />
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

          {activeFilterCount > 0 ? (
            <Pressable
              onPress={handleResetAll}
              style={({ pressed }) => [
                styles.secondaryAction,
                { opacity: pressed ? 0.7 : 1 },
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
          ) : null}
        </View>
      </View>

      <View style={styles.contentContainer}>
        {urgentOpenCount > 0 ? (
          <View style={[styles.urgentBanner, { borderColor: `${palette.danger}66`, backgroundColor: `${palette.danger}12` }]}>
            <Ionicons name="flash" size={16} color={palette.danger} />
            <Text style={[styles.urgentBannerText, { color: palette.danger }]}>
              {urgentOpenCount} urgent request{urgentOpenCount === 1 ? "" : "s"} prioritized near you
            </Text>
          </View>
        ) : null}
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
            requests={filteredRequests}
            loading={loading}
            userLocation={userLocation}
            onSearchArea={refreshRequests}
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
    marginBottom: theme.spacing.xs,
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
    marginTop: 4,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
    fontWeight: "600",
  },
  searchCard: {
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: theme.spacing.sm,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  searchInputShell: {
    minHeight: 46,
    borderRadius: 18,
    backgroundColor: "#ECE7DC",
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
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
    marginBottom: 8,
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
    marginBottom: 8,
  },
  filterChip: {
    minHeight: 34,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
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
    justifyContent: "flex-start",
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
  urgentBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: theme.spacing.sm,
  },
  urgentBannerText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  modalContent: {
    gap: theme.spacing.sm,
  },
  modalSection: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
});
