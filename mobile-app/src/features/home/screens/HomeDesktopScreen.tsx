import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";

import { APP_ROUTES } from "@/config/routes";
import { WebAppShell } from "@/components/layout/WebAppShell";
import { WebSidebar, SidebarItem } from "@/components/layout/WebSidebar";
import { WebTopNav } from "@/components/layout/WebTopNav";
import { HomeDashboardHeader } from "@/components/home/HomeDashboardHeader";
import { HomeStatsGrid } from "@/components/home/HomeStatsGrid";
import { RequestFilterBar } from "@/components/requests/RequestFilterBar";
import {
  RightRequestFilterSidebar,
  RequestFilterValue,
} from "@/components/requests/RightRequestFilterSidebar";
import { WebRequestCard } from "@/components/requests/WebRequestCard";
import { CreateRequestDrawer } from "@/components/requests/CreateRequestDrawer";
import { BidRequestModal } from "@/features/bid/components";
import { useCategories } from "@/features/category/hooks/category.hook";
import { useHomeScreen } from "@/features/home/hooks";
import { HomeEmptyState } from "@/features/home/components/HomeEmptyState";
import { HelpRequest } from "@/features/helpRequest/types/helpRequest.types";
import { isUrgentRequestActive } from "@/features/helpRequest/utils/urgent";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { calculateDistance } from "@/utils/distance";

const STATIC_CATEGORIES = [
  "All",
  "Urgent",
  "Errands",
  "Transportation",
  "Pet Care",
  "Home & Garden",
  "Tech Support",
  "Moving",
  "Shopping",
];

export const HomeDesktopScreen = () => {
  const { width } = useWindowDimensions();
  const isTablet = width < 1360;
  const collapsedSidebar = width < 1360;
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { categories } = useCategories();
  const { value: userLocation } = useLocationPicker({ autoUseCurrentLocationOnMount: true });

  const {
    helperRequests,
    myBids,
    openBidModal,
    bidModalVisible,
    selectedRequest,
    closeBidModal,
    handleSubmitBid,
    submittingBid,
    bidError,
  } = useHomeScreen();

  const [category, setCategory] = useState("All");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [createOpen, setCreateOpen] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [feedSearchQuery, setFeedSearchQuery] = useState("");
  const [distanceFilter, setDistanceFilter] = useState<"ANY" | "1" | "5" | "10" | "25">("ANY");
  const [requestTypeFilter, setRequestTypeFilter] = useState<"ALL" | "PAID" | "UNPAID" | "URGENT_ONLY">("ALL");
  const initialDesktopFilters: RequestFilterValue = {
    category: "All",
    distance: "10",
    requestType: "ALL",
    sortBy: "NEWEST",
  };
  const [draftDesktopFilters, setDraftDesktopFilters] = useState<RequestFilterValue>(initialDesktopFilters);
  const [appliedDesktopFilters, setAppliedDesktopFilters] = useState<RequestFilterValue>(initialDesktopFilters);

  const visibleRequests = useMemo(() => {
    const filtered = helperRequests.filter((request) => {
      if (request.status !== "OPEN") return false;

      const query = (feedSearchQuery || globalSearchQuery).trim().toLowerCase();
      const matchesQuery =
        !query ||
        [request.title, request.description, request.category?.name, request.city, request.requesterName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const desktopCategory = appliedDesktopFilters.category;
      const effectiveCategory = isTablet ? category : desktopCategory;
      const effectiveRequestType = isTablet ? requestTypeFilter : appliedDesktopFilters.requestType;
      const effectiveDistance = isTablet ? distanceFilter : appliedDesktopFilters.distance;
      const categoryMatch =
        effectiveCategory === "All" ||
        (effectiveCategory === "Urgent"
          ? isUrgentRequestActive(request)
          : request.category?.name === effectiveCategory);

      const urgentMatch =
        (!urgentOnly && effectiveRequestType !== "URGENT_ONLY") || isUrgentRequestActive(request);

      const typeMatch =
        effectiveRequestType === "ALL" ||
        (effectiveRequestType === "PAID" ? request.isPaid : false) ||
        (effectiveRequestType === "UNPAID" ? !request.isPaid : false) ||
        (effectiveRequestType === "URGENT_ONLY" ? isUrgentRequestActive(request) : false);

      const distanceMatch = (() => {
        if (effectiveDistance === "ANY") return true;
        if (
          !userLocation ||
          request.location?.latitude == null ||
          request.location?.longitude == null
        ) {
          return false;
        }

        const distanceKm = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          request.location.latitude,
          request.location.longitude
        );

        return distanceKm <= Number(effectiveDistance);
      })();

      return matchesQuery && categoryMatch && urgentMatch && typeMatch && distanceMatch;
    });
    const desktopSortBy = appliedDesktopFilters.sortBy;
    const effectiveSortBy = isTablet ? "NEWEST" : desktopSortBy;
    const sorted = [...filtered].sort((a, b) => {
      if (effectiveSortBy === "NEWEST") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (effectiveSortBy === "BUDGET") {
        const aBudget = typeof a.budget === "number" ? a.budget : 0;
        const bBudget = typeof b.budget === "number" ? b.budget : 0;
        return bBudget - aBudget;
      }
      const getDistanceValue = (request: HelpRequest) => {
        if (
          !userLocation ||
          request.location?.latitude == null ||
          request.location?.longitude == null
        ) {
          return Number.MAX_SAFE_INTEGER;
        }
        return calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          request.location.latitude,
          request.location.longitude
        );
      };
      return getDistanceValue(a) - getDistanceValue(b);
    });
    return sorted;
  }, [
    appliedDesktopFilters,
    category,
    distanceFilter,
    feedSearchQuery,
    globalSearchQuery,
    helperRequests,
    requestTypeFilter,
    urgentOnly,
    userLocation,
    isTablet,
  ]);

  const urgentCount = useMemo(
    () => visibleRequests.filter((request) => isUrgentRequestActive(request)).length,
    [visibleRequests]
  );

  const ratingValue = useMemo(() => {
    const rawRating = (user?.profile as { ratingAverage?: number } | undefined)?.ratingAverage;
    if (typeof rawRating !== "number") return "-";
    return rawRating.toFixed(1);
  }, [user?.profile]);

  const stats = [
    { label: "Open nearby", value: String(visibleRequests.length), icon: "location-outline" as const },
    { label: "Urgent requests", value: String(urgentCount), icon: "flash-outline" as const },
    { label: "My active bids", value: String(myBids?.length ?? 0), icon: "cash-outline" as const },
    { label: "Rating", value: ratingValue === "-" ? "Not rated yet" : ratingValue, icon: "star-outline" as const },
  ];

  const mainItems: SidebarItem[] = [
    { key: "home", label: "Home", icon: "home-outline", onPress: () => router.push(APP_ROUTES.HOME) },
    { key: "browse", label: "Browse Requests", icon: "search-outline", onPress: () => router.push(APP_ROUTES.HOME_REQUESTS) },
    { key: "map", label: "Map", icon: "map-outline", onPress: () => setViewMode("map") },
    { key: "messages", label: "Messages", icon: "chatbubble-outline", onPress: () => router.push("/messages") },
  ];
  const activityItems: SidebarItem[] = [
    { key: "my-requests", label: "My Requests", icon: "list-outline", onPress: () => router.push(APP_ROUTES.PROFILE_REQUESTS) },
    { key: "my-bids", label: "My Bids", icon: "cash-outline", onPress: () => router.push(APP_ROUTES.PROFILE_BIDS) },
    { key: "saved", label: "Saved", icon: "bookmark-outline", onPress: () => router.push(APP_ROUTES.FAVORITES) },
    { key: "notifications", label: "Notifications", icon: "notifications-outline", onPress: () => router.push("/notifications") },
  ];
  const accountItems: SidebarItem[] = [
    { key: "profile", label: "Profile", icon: "person-outline", onPress: () => router.push(APP_ROUTES.PROFILE) },
    { key: "settings", label: "Settings", icon: "settings-outline", onPress: () => router.push(APP_ROUTES.PROFILE_PRIVACY) },
  ];

  const locationLabel = userLocation?.city || user?.profile?.address?.city || "Helsinki";
  const categoryOptions = [
    "All",
    "Urgent",
    "Errands",
    "Transportation",
    "Pet Care",
    "Home & Garden",
    "Tech Support",
    "Moving",
  ];
  const desktopActiveFilterCount = [
    draftDesktopFilters.category !== "All",
    draftDesktopFilters.distance !== "10",
    draftDesktopFilters.requestType !== "ALL",
    draftDesktopFilters.sortBy !== "NEWEST",
  ].filter(Boolean).length;
  const handleSubmitGlobalSearch = (query: string) => {
    if (!query) return;
    router.push({ pathname: APP_ROUTES.HOME_REQUESTS, params: { q: query } } as never);
  };

  return (
    <WebAppShell
      topNav={
        <WebTopNav
          locationLabel={locationLabel}
          globalSearchQuery={globalSearchQuery}
          onChangeGlobalSearch={setGlobalSearchQuery}
          onPostRequest={() => setCreateOpen(true)}
          onSubmitGlobalSearch={handleSubmitGlobalSearch}
          onPressHome={() => router.push(APP_ROUTES.HOME)}
          onPressLocation={() => router.push(APP_ROUTES.LOCATION_PICKER)}
          onPressNotifications={() => router.push("/notifications")}
          onPressMessages={() => router.push("/messages")}
          onPressProfile={() => router.push(APP_ROUTES.PROFILE)}
          fullName={user?.fullName || user?.profile?.fullName}
          avatarUrl={user?.avatarUrl}
        />
      }
      sidebar={
        <WebSidebar
          sections={[
            { key: "main", label: "Main", items: mainItems },
            { key: "activity", label: "Activity", items: activityItems },
            { key: "account", label: "Account", items: accountItems },
          ]}
          activeKey="home"
          collapsed={collapsedSidebar}
        />
      }
      rightPanel={
        !isTablet ? (
          <RightRequestFilterSidebar
            value={draftDesktopFilters}
            categories={categoryOptions}
            activeCount={desktopActiveFilterCount}
            onChange={setDraftDesktopFilters}
            onApply={() => setAppliedDesktopFilters(draftDesktopFilters)}
            onClear={() => {
              setDraftDesktopFilters(initialDesktopFilters);
              setAppliedDesktopFilters(initialDesktopFilters);
            }}
          />
        ) : undefined
      }
      rightPanelWidth={360}
    >
      <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent}>
        <HomeDashboardHeader
          firstName={user?.fullName?.split(" ")[0] || user?.profile?.fullName?.split(" ")[0] || "Roman"}
          openCount={visibleRequests.length}
          locationLabel={locationLabel}
        />

        <HomeStatsGrid stats={stats} />

        {isTablet ? (
          <RequestFilterBar
            searchQuery={feedSearchQuery}
            onChangeSearch={setFeedSearchQuery}
            categories={Array.from(new Set([...STATIC_CATEGORIES, ...categories.map((item) => item.name)]))}
            activeCategory={category}
            onSelectCategory={(next) => {
              setCategory(next);
              setUrgentOnly(next === "Urgent");
            }}
            urgentOnly={urgentOnly}
            onToggleUrgent={() => setUrgentOnly((prev) => !prev)}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            showMoreFilters={showMoreFilters}
            onToggleMoreFilters={() => setShowMoreFilters((prev) => !prev)}
          />
        ) : null}

        {visibleRequests.length === 0 ? (
          <HomeEmptyState
            onCreateRequest={() => setCreateOpen(true)}
            onBrowseAll={() => {
              setFeedSearchQuery("");
              setGlobalSearchQuery("");
              setCategory("All");
              setUrgentOnly(false);
              setDistanceFilter("ANY");
              setRequestTypeFilter("ALL");
              setDraftDesktopFilters(initialDesktopFilters);
              setAppliedDesktopFilters(initialDesktopFilters);
            }}
          />
        ) : (
          <View style={styles.grid}>
            {visibleRequests.map((request) => (
              <WebRequestCard
                key={request.id}
                request={request}
                userLocation={userLocation}
                onPressDetails={() => {
                  router.push(APP_ROUTES.HOME_REQUEST_DETAILS(request.id));
                }}
                onPressRequester={() => {
                  router.push(APP_ROUTES.HOME_REQUEST_DETAILS(request.id));
                }}
                onPressBid={() => openBidModal(request)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <CreateRequestDrawer
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onOpenFullForm={() => {
          setCreateOpen(false);
          router.push(APP_ROUTES.HOME_REQUESTS);
        }}
      />

      <BidRequestModal
        visible={bidModalVisible}
        selectedRequest={selectedRequest}
        onClose={closeBidModal}
        onSubmit={handleSubmitBid}
        loading={submittingBid}
        error={bidError}
      />
    </WebAppShell>
  );
};

const styles = StyleSheet.create({
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    gap: 14,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});
