import React, { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";

import { Screen, theme } from "@/design-system";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { BidRequestModal } from "@/features/bid/components";
import { useCategories } from "@/features/category/hooks/category.hook";
import { RequestCardSkeleton } from "@/features/helpRequest/components/RequestCardSkeleton";
import { HelpRequest } from "@/features/helpRequest/types/helpRequest.types";
import { formatRequestBudget } from "@/features/helpRequest/utils/requestDisplay";
import { getRelativePostedTime } from "@/features/helpRequest/utils/requestTime";
import {
  HomeCompactRequestCard,
  HomeEmptyState,
  HomeFilterChip,
  HomeGreetingHero,
  HomeSearchBarRow,
  HomeUrgentBanner,
} from "@/features/home/components";
import { useHomeScreen } from "@/features/home/hooks";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { APP_ROUTES } from "@/config/routes";
import { getDistanceToRequest } from "@/utils/distance";
import { isUrgentRequestActive } from "@/features/helpRequest/utils/urgent";
import { getMe, resendEmailVerification } from "@/features/auth/api/auth.api";
import { HomeDesktopScreen } from "@/features/home/screens/HomeDesktopScreen";

const matchesSearch = (request: HelpRequest, query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [
    request.title,
    request.description,
    request.requesterName,
    request.location?.formattedAddress,
    request.location?.addressLine1,
    request.city,
    request.country,
    request.category?.name,
    request.category?.slug,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
};

function HomeMobileScreen() {
  const router = useRouter();
  const { palette } = useThemeContext();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const deferVerification = useAuthStore((state) => state.deferVerification);
  const { categories } = useCategories();
  const { value: userLocation } = useLocationPicker({
    autoUseCurrentLocationOnMount: true,
  });
  const [searchQuery, setSearchQuery] = useState("");

  const {
    filters,
    updateFilter,
    helperRequests,
    loading,
    bidModalVisible,
    selectedRequest,
    submittingBid,
    bidError,
    closeBidModal,
    handleSubmitBid,
  } = useHomeScreen();
  const [verificationBannerVisible, setVerificationBannerVisible] = useState(true);

  const requiresVerification = Boolean(user && !user.isEmailVerified);

  const firstName =
    user?.fullName?.split(" ")[0] ||
    user?.profile?.fullName?.split(" ")[0] ||
    "Friend";

  const selectedCategoryId = filters.categoryId ?? "ALL";
  const urgentOnlyActive = filters.urgentOnly;

  const visibleRequests = useMemo(() => {
    return helperRequests.filter((request) => {
      if (request.status !== "OPEN") {
        return false;
      }

      const matchesCategory =
        selectedCategoryId === "ALL" || request.categoryId === selectedCategoryId;

      return matchesCategory && matchesSearch(request, searchQuery);
    });
  }, [helperRequests, searchQuery, selectedCategoryId]);

  const urgentRequest = useMemo(() => {
    return [...visibleRequests]
      .filter((request) => request.status === "OPEN" && isUrgentRequestActive(request))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
  }, [visibleRequests]);

  return (
    <Screen contentContainerStyle={styles.container}>
      <HomeGreetingHero
        firstName={firstName}
        locationLabel={user?.profile?.address?.city || "Nearby"}
        requestCount={visibleRequests.length}
        avatarUrl={user?.avatarUrl}
        fullName={user?.fullName || user?.profile?.fullName}
      />

      {requiresVerification && verificationBannerVisible ? (
        <View
          style={[
            styles.verifyBanner,
            { backgroundColor: palette.surfaceSecondary, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.verifyTitle, { color: palette.textPrimary }]}>
            Verify your email to unlock full actions
          </Text>
          <Text style={[styles.verifyBody, { color: palette.textSecondary }]}>
            You can browse normally, but posting requests, bidding, and chat require verification.
          </Text>
          <View style={styles.verifyActions}>
            <Pressable
              onPress={() => router.push(APP_ROUTES.AUTH_VERIFY_EMAIL)}
              style={[styles.verifyChip, { borderColor: palette.primary }]}
            >
              <Text style={[styles.verifyChipText, { color: palette.primary }]}>Verify now</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                deferVerification(true);
                setVerificationBannerVisible(false);
              }}
              style={[styles.verifyChip, { borderColor: palette.borderStrong }]}
            >
              <Text style={[styles.verifyChipText, { color: palette.textSecondary }]}>Later</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                await resendEmailVerification().catch(() => undefined);
                const me = await getMe().catch(() => null);
                if (me?.success && me.data) {
                  setUser(me.data);
                }
              }}
              style={[styles.verifyChip, { borderColor: palette.borderStrong }]}
            >
              <Text style={[styles.verifyChipText, { color: palette.textSecondary }]}>I have verified</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <HomeSearchBarRow
        searchQuery={searchQuery}
        onChangeSearch={setSearchQuery}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRail}
      >
        <HomeFilterChip
          label="All"
          active={selectedCategoryId === "ALL" && !urgentOnlyActive}
          onPress={() => {
            updateFilter("categoryId", "ALL");
            updateFilter("urgentOnly", false);
          }}
        />
        <HomeFilterChip
          label="Urgent"
          active={urgentOnlyActive}
          onPress={() => updateFilter("urgentOnly", !urgentOnlyActive)}
        />
        {categories.slice(0, 2).map((category) => (
          <HomeFilterChip
            key={category.id}
            label={category.name}
            active={selectedCategoryId === category.id}
            onPress={() => updateFilter("categoryId", category.id)}
          />
        ))}
      </ScrollView>

      {urgentRequest ? (
        <HomeUrgentBanner
          title={urgentRequest.title}
          meta={`${
            userLocation &&
            urgentRequest.location?.latitude != null &&
            urgentRequest.location?.longitude != null
              ? `${getDistanceToRequest(
                  userLocation.latitude,
                  userLocation.longitude,
                  urgentRequest.location.latitude,
                  urgentRequest.location.longitude
                )} away`
              : "Nearby"
          } · ${formatRequestBudget(urgentRequest)}`}
          onPressView={() => router.push(APP_ROUTES.HOME_REQUEST_DETAILS(urgentRequest.id))}
        />
      ) : null}

      <View style={styles.feedHeader}>
        <Text style={[styles.feedHeaderTitle, { color: palette.textPrimary }]}>
          Nearby requests
        </Text>

        <Pressable onPress={() => router.push(APP_ROUTES.HOME_REQUESTS)}>
          <Text style={[styles.feedHeaderLink, { color: palette.primary }]}>See all</Text>
        </Pressable>
      </View>

      {loading && visibleRequests.length === 0 ? (
        <View style={styles.requestList}>
          {Array.from({ length: 3 }).map((_, index) => (
            <RequestCardSkeleton key={`home-request-skeleton-${index}`} compact />
          ))}
        </View>
      ) : visibleRequests.length === 0 ? (
        <View style={styles.emptyStateWrap}>
          <HomeEmptyState
            onCreateRequest={() => router.push(APP_ROUTES.HOME_REQUESTS)}
            onBrowseAll={() => router.push(APP_ROUTES.HOME_REQUESTS)}
          />
        </View>
      ) : (
        <View style={styles.requestList}>
          {visibleRequests.slice(0, 6).map((request) => {
            const userDistance =
              userLocation &&
              request.location?.latitude != null &&
              request.location?.longitude != null
                ? getDistanceToRequest(
                    userLocation.latitude,
                    userLocation.longitude,
                    request.location.latitude,
                    request.location.longitude
                  )
                : null;

            return (
              <HomeCompactRequestCard
                key={request.id}
                request={request}
                userDistance={userDistance}
                postedLabel={getRelativePostedTime(request.createdAt)
                  .replace(/^Posted /, "")
                  .replace("just now", "now")}
                onPress={() => router.push(APP_ROUTES.HOME_REQUEST_DETAILS(request.id))}
              />
            );
          })}
        </View>
      )}

      <BidRequestModal
        visible={bidModalVisible}
        selectedRequest={selectedRequest}
        onClose={closeBidModal}
        onSubmit={handleSubmitBid}
        loading={submittingBid}
        error={bidError}
      />
    </Screen>
  );
}

export default function Home() {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 1024;

  return isDesktopWeb ? <HomeDesktopScreen /> : <HomeMobileScreen />;
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xl * 2,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chipRail: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.xs,
    alignItems: "center",
  },
  feedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  verifyBanner: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  verifyTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  verifyBody: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 18,
  },
  verifyActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xxs,
  },
  verifyChip: {
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  verifyChipText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  feedHeaderTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: -0.3,
  },
  feedHeaderLink: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  requestList: {
    gap: theme.spacing.md,
  },
  emptyStateWrap: {
    marginTop: theme.spacing.xs,
  },
});
