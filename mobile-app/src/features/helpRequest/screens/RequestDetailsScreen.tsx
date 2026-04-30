import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { Row, Screen, Stack, theme } from "@/design-system";
import { BidRequestModal } from "@/features/bid/components/BidRequestModal";
import { BidderProfileModal } from "@/features/bid/components/BidderProfileModal";
import { BidList } from "@/features/bid/components/BidList";
import { EditBidModal } from "@/features/bid/components/EditBidModal";
import type { Bid } from "@/features/bid/types/bid.types";
import { useFavorites } from "@/features/favorites/hooks/favorite.hook";
import {
  RequestEmptyState,
  RequestPhotoUploadSection,
} from "@/features/helpRequest/components";
import { useRequestDetails } from "@/features/helpRequest/hooks/useRequestDetails";
import type { HelpRequest, HelpRequestStatus } from "@/features/helpRequest/types/helpRequest.types";
import { formatRequestBudget, formatRequestLocation } from "@/features/helpRequest/utils/requestDisplay";
import { getRelativePostedTime } from "@/features/helpRequest/utils/requestTime";
import { getUrgentTimeRemainingLabel, isUrgentRequestActive } from "@/features/helpRequest/utils/urgent";
import {
  ReviewCard,
  ReviewComposerModal,
  StarRatingInput,
} from "@/features/reviews/components";
import { useReviews } from "@/features/reviews/hooks/useReviews";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";
import { goBackOrFallback } from "@/utils/navigation";
import { APP_ROUTES } from "@/config/routes";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

type Props = {
  requestId?: string;
};

type ViewState =
  | "missing-id"
  | "loading"
  | "fetch-error"
  | "owner-open-empty"
  | "owner-open-with-bids"
  | "owner-assigned"
  | "owner-completed-no-review"
  | "owner-completed-reviewed"
  | "owner-cancelled"
  | "helper-open-no-bid"
  | "helper-open-bid-pending"
  | "helper-assigned-to-me"
  | "helper-bid-rejected";

type HeaderTone = "open" | "assigned" | "completed" | "cancelled" | "dimmed";

const resolveViewState = (args: {
  hasRequestId: boolean;
  loading: boolean;
  hasRequest: boolean;
  request: HelpRequest | null;
  isOwner: boolean;
  myBid: Bid | null;
  helperId: string | null;
  currentUserId: string | null;
  existingReview: unknown;
  bidCount: number;
}): ViewState => {
  const {
    hasRequestId,
    loading,
    hasRequest,
    request,
    isOwner,
    myBid,
    helperId,
    currentUserId,
    existingReview,
    bidCount,
  } = args;

  if (!hasRequestId) return "missing-id";
  if (loading && !hasRequest) return "loading";
  if (!hasRequest || !request) return "fetch-error";

  const assignedToCurrentHelper = Boolean(
    !isOwner &&
    currentUserId &&
    helperId &&
    helperId === currentUserId &&
    (request.status === "ASSIGNED" || request.status === "COMPLETED")
  );

  const helperRejected = Boolean(
    !isOwner &&
    myBid &&
    (myBid.status === "REJECTED" ||
      ((request.status === "ASSIGNED" || request.status === "COMPLETED") &&
        helperId &&
        helperId !== currentUserId &&
        myBid.status !== "ACCEPTED"))
  );

  if (isOwner) {
    if (request.status === "OPEN") {
      return bidCount > 0 ? "owner-open-with-bids" : "owner-open-empty";
    }
    if (request.status === "ASSIGNED") return "owner-assigned";
    if (request.status === "COMPLETED") {
      return existingReview ? "owner-completed-reviewed" : "owner-completed-no-review";
    }
    return "owner-cancelled";
  }

  if (assignedToCurrentHelper || myBid?.status === "ACCEPTED") {
    return "helper-assigned-to-me";
  }

  if (helperRejected) {
    return "helper-bid-rejected";
  }

  if (request.status === "OPEN" && myBid?.status === "PENDING") {
    return "helper-open-bid-pending";
  }

  if (request.status === "OPEN") {
    return "helper-open-no-bid";
  }

  return "helper-bid-rejected";
};

const LoadingDots = () => {
  const { palette } = useThemeContext();
  const values = useRef([
    new Animated.Value(0.35),
    new Animated.Value(0.35),
    new Animated.Value(0.35),
  ]).current;

  useEffect(() => {
    const animations = values.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 140),
          Animated.timing(value, {
            toValue: 1,
            duration: 420,
            useNativeDriver: true,
            isInteraction: false,
          }),
          Animated.timing(value, {
            toValue: 0.35,
            duration: 420,
            useNativeDriver: true,
            isInteraction: false,
          }),
        ])
      )
    );

    animations.forEach((animation) => animation.start());

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [values]);

  return (
    <Row gap="xs" align="center" style={styles.loadingDotsRow}>
      {values.map((value, index) => (
        <Animated.View
          key={index}
          style={[
            styles.loadingDot,
            {
              backgroundColor: palette.primary,
              opacity: value,
            },
          ]}
        />
      ))}
    </Row>
  );
};

const formatRatingLabel = (rating?: number | null) => {
  if (typeof rating !== "number" || Number.isNaN(rating)) {
    return "Community member";
  }

  return `★ ${rating.toFixed(1)}`;
};

const formatBidCountLabel = (count: number) => `${count} bid${count === 1 ? "" : "s"}`;

const formatCityCountry = (request: HelpRequest) => {
  const city = request.city?.trim();
  const country = request.country?.trim();

  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  if (country) return country;

  return formatRequestLocation(request);
};

export const RequestDetailsScreen = ({ requestId }: Props) => {
  const params = useLocalSearchParams<{ id?: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { palette } = useThemeContext();
  const authUser = useAuthStore((state) => state.user);
  const [deleting, setDeleting] = useState(false);
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [helperProfileVisible, setHelperProfileVisible] = useState(false);
  const [editingBid, setEditingBid] = useState<Bid | null>(null);
  const [savingBid, setSavingBid] = useState(false);
  const [previewReviewRating, setPreviewReviewRating] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    offers: true,
    photos: true,
    activity: false,
    manage: false,
  });

  const activeRequestId = requestId || params.id;
  const isProfileRoute = pathname.startsWith(APP_ROUTES.PROFILE_REQUESTS);
  const isFavoritesRoute = pathname.startsWith(APP_ROUTES.FAVORITES);

  const {
    request,
    bids,
    loading,
    error,
    isOwner,
    myBid,
    fetchDetails,
    acceptBid,
    rejectBid,
    submitBid,
    updateMyBid,
    deleteMyBid,
    setRequestStatus,
    removeRequest,
    actionError,
    actionLoadingByBidId,
  } = useRequestDetails(activeRequestId || "");

  const { isFavorite, toggleFavorite, actionLoadingById } = useFavorites();
  const {
    createReview,
    updateReview,
    getCachedReviews,
    getUserReviews,
    loading: reviewActionLoading,
    loadingByUserId,
    error: reviewError,
  } = useReviews();

  const requestListRoute = isProfileRoute
    ? APP_ROUTES.PROFILE_REQUESTS
    : isFavoritesRoute
      ? APP_ROUTES.FAVORITES
      : APP_ROUTES.HOME_REQUESTS;

  const currentUserId = authUser?.id || authUser?.profile?.userId || null;
  const acceptedBid = useMemo(
    () => bids.find((bid) => bid.status === "ACCEPTED") ?? null,
    [bids]
  );
  const helperId =
    request?.assignedHelperId ??
    acceptedBid?.helperId ??
    (myBid?.status === "ACCEPTED" ? myBid.helperId : null) ??
    null;
  const requestIdValue = request?.id ?? "";
  const helperReviews = useMemo(
    () => (helperId ? getCachedReviews(helperId) : []),
    [getCachedReviews, helperId]
  );
  const existingReview = useMemo(() => {
    if (!currentUserId) return null;

    return (
      helperReviews.find(
        (review) =>
          review.helpRequest.id === requestIdValue &&
          review.reviewer.id === currentUserId
      ) ?? null
    );
  }, [currentUserId, helperReviews, requestIdValue]);

  const reviewLoading =
    reviewActionLoading || (helperId ? Boolean(loadingByUserId[helperId]) : false);
  const favoriteLoading = activeRequestId ? Boolean(actionLoadingById[activeRequestId]) : false;
  const favorited = activeRequestId ? isFavorite(activeRequestId) : false;
  const requestEditRoute = (id: string) =>
    isOwner ? APP_ROUTES.PROFILE_REQUEST_EDIT(id) : APP_ROUTES.HOME_REQUEST_EDIT(id);

  const viewState = resolveViewState({
    hasRequestId: Boolean(activeRequestId),
    loading,
    hasRequest: Boolean(request),
    request,
    isOwner,
    myBid,
    helperId,
    currentUserId,
    existingReview,
    bidCount: bids.length,
  });

  useEffect(() => {
    setPreviewReviewRating(existingReview?.rating ?? 0);
  }, [existingReview]);

  useEffect(() => {
    if (reviewModalVisible && request?.status !== "COMPLETED") {
      setReviewModalVisible(false);
    }
  }, [request?.status, reviewModalVisible]);

  const handleBack = useCallback(() => {
    goBackOrFallback({
      fallback: requestListRoute,
      replace: true,
    });
  }, [requestListRoute]);

  const handleDeleteRequest = () => {
    if (!request) return;

    Alert.alert("Delete request", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            const deleted = await removeRequest();
            if (!deleted) return;

            showSuccessToast("Request deleted successfully");
            handleBack();
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const toggleSection = useCallback((key: "offers" | "photos" | "activity" | "manage") => {
    setExpandedSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchDetails();
      if (helperId) {
        await getUserReviews(helperId, {
          limit: 10,
          forceRefresh: true,
        });
      }
    } finally {
      setRefreshing(false);
    }
  }, [fetchDetails, getUserReviews, helperId]);

  const handleStatusUpdate = useCallback(
    async (status: HelpRequestStatus) => {
      if (status === "COMPLETED") {
        return null;
      }

      return setRequestStatus(status);
    },
    [setRequestStatus]
  );

  const handleCompleteRequest = useCallback(async () => {
    const resolvedHelperId =
      request?.assignedHelperId ||
      helperId ||
      acceptedBid?.helperId ||
      myBid?.helperId ||
      null;

    if (!resolvedHelperId) {
      Alert.alert(
        "Assign a helper first",
        "Accept a bidder before marking this request as completed so you can leave a review."
      );
      return;
    }

    const updated = await setRequestStatus("COMPLETED");
    if (!updated) return;

    const completedHelperId =
      updated.assignedHelperId ||
      resolvedHelperId ||
      null;

    await fetchDetails();

    if (!completedHelperId || !currentUserId) return;

    const reviewResult = await getUserReviews(completedHelperId, {
      limit: 10,
      forceRefresh: true,
    });

    const alreadyReviewed = reviewResult?.reviews?.some(
      (review) =>
        review.helpRequest.id === updated.id &&
        review.reviewer.id === currentUserId
    );

    if (!alreadyReviewed) {
      setPreviewReviewRating(0);
      setReviewModalVisible(true);
    }
  }, [
    acceptedBid?.helperId,
    currentUserId,
    fetchDetails,
    getUserReviews,
    helperId,
    myBid?.helperId,
    request?.assignedHelperId,
    setRequestStatus,
  ]);

  const syncHelperReviews = useCallback(async () => {
    const targetHelperId =
      request?.assignedHelperId ||
      helperId ||
      acceptedBid?.helperId ||
      myBid?.helperId ||
      null;

    if (!targetHelperId) return null;

    return getUserReviews(targetHelperId, {
      limit: 10,
      forceRefresh: true,
    });
  }, [
    acceptedBid?.helperId,
    getUserReviews,
    helperId,
    myBid?.helperId,
    request?.assignedHelperId,
  ]);

  useEffect(() => {
    if (!request || request.status !== "COMPLETED") return;
    if (!isOwner) return;

    void syncHelperReviews();
  }, [isOwner, request, syncHelperReviews]);

  const handleOpenReviewModal = useCallback(async () => {
    if (request?.status !== "COMPLETED") {
      const latest = await fetchDetails();
      const latestStatus = latest?.status ?? request?.status;
      if (latestStatus !== "COMPLETED") {
        showErrorToast(
          "Request not completed",
          "Mark the request as completed first, then submit the review."
        );
      }
      return;
    }

    await syncHelperReviews();
    setReviewModalVisible(true);
  }, [fetchDetails, request?.status, syncHelperReviews]);

  const handleOpenBidModal = useCallback(() => {
    if (!request) return;
    setBidModalVisible(true);
  }, [request]);

  const handleOpenBidChat = useCallback(
    (bidRequestId: string) => {
      router.push(`/messages/chat?requestId=${bidRequestId}` as never);
    },
    [router]
  );

  const handleOpenHelperProfile = useCallback(() => {
    if (!acceptedBid) return;
    setHelperProfileVisible(true);
  }, [acceptedBid]);

  const handleOpenEditBidModal = useCallback((bid: Bid) => {
    setEditingBid(bid);
  }, []);

  const handleCloseEditBidModal = useCallback(() => {
    if (savingBid) return;
    setEditingBid(null);
  }, [savingBid]);

  const handleSubmitEditBid = useCallback(
    async (payload: { amount?: number; message?: string }) => {
      if (!editingBid) return;

      const amount =
        typeof payload.amount === "number" ? payload.amount : editingBid.amount;
      const message =
        typeof payload.message === "string" ? payload.message : editingBid.message ?? "";

      setSavingBid(true);
      try {
        const updated = await updateMyBid(editingBid.id, amount, message);
        if (!updated) return;

        setEditingBid(null);
        showSuccessToast("Bid updated successfully");
      } finally {
        setSavingBid(false);
      }
    },
    [editingBid, updateMyBid]
  );

  const renderInlineError = () =>
    actionError ? (
      <View
        style={[
          styles.inlineErrorCard,
          {
            backgroundColor: palette.dangerSoft,
            borderColor: palette.danger,
          },
        ]}
      >
        <Row gap="xs" align="center">
          <Ionicons name="warning-outline" size={16} color={palette.danger} />
          <Text style={[styles.inlineErrorText, { color: palette.danger }]}>
            {actionError}
          </Text>
        </Row>
      </View>
    ) : null;

  const renderUrgentInfo = () =>
    isUrgentActive ? (
      <View
        style={[
          styles.urgentInfoCard,
          {
            backgroundColor: `${palette.danger}12`,
            borderColor: `${palette.danger}55`,
          },
        ]}
      >
        <Row gap="xs" align="center">
          <Ionicons name="flash-outline" size={16} color={palette.danger} />
          <Text style={[styles.urgentInfoTitle, { color: palette.danger }]}>
            Urgent request priority
          </Text>
        </Row>
        <Text style={[styles.urgentInfoBody, { color: palette.textSecondary }]}>
          Prioritized in nearby feeds and maps. {request?.urgentExpiresAt ? `Expires ${urgentTimeLabel}.` : "No expiry set."}
        </Text>
      </View>
    ) : null;

  if (viewState === "missing-id") {
    return (
      <Screen centered>
        <RequestEmptyState
          title="Request not found"
          description="Missing request identifier in route params."
        />
      </Screen>
    );
  }

  if (viewState === "loading") {
    return (
      <Screen centered>
        <Stack gap="md" style={styles.centerState}>
          <View
            style={[
              styles.centerStateIcon,
              { backgroundColor: palette.primarySoft ?? palette.surfaceMuted },
            ]}
          >
            <ActivityIndicator color={palette.primary} size="small" />
          </View>
          <Text style={[styles.centerStateTitle, { color: palette.textPrimary }]}>
            Loading request
          </Text>
          <LoadingDots />
        </Stack>
      </Screen>
    );
  }

  if (viewState === "fetch-error") {
    return (
      <Screen centered>
        <Stack gap="md" style={styles.centerState}>
          <View
            style={[
              styles.centerStateIcon,
              { backgroundColor: palette.dangerSoft },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={22} color={palette.danger} />
          </View>
          <Text style={[styles.centerStateTitle, { color: palette.textPrimary }]}>
            Request unavailable
          </Text>
          <Text style={[styles.centerStateCopy, { color: palette.textSecondary }]}>
            {error || "The request may have been removed or could not be loaded."}
          </Text>
          <AppButton title="Retry" onPress={() => void fetchDetails()} fullWidth={false} />
        </Stack>
      </Screen>
    );
  }

  if (!request) {
    return null;
  }

  const helperDisplayName =
    acceptedBid?.helperName ||
    (myBid?.status === "ACCEPTED" ? myBid.helperName : null) ||
    "Assigned helper";

  const helperRatingLabel = formatRatingLabel(
    acceptedBid?.helperRating ?? myBid?.helperRating ?? null
  );
  const requesterRatingLabel = formatRatingLabel(
    (request as HelpRequest & { requesterRating?: number }).requesterRating ?? null
  );
  const isUrgentActive = isUrgentRequestActive(request);
  const urgentTimeLabel = getUrgentTimeRemainingLabel(request.urgentExpiresAt);
  const urgentHeroChip = isUrgentActive
    ? [{ icon: "alert-circle-outline" as const, label: `Urgent · ${urgentTimeLabel}`, emphasis: "warning" as const }]
    : [];
  const completedPriceLabel =
    request.status === "COMPLETED" && request.isPaid
      ? `${formatRequestBudget(request)} paid`
      : formatRequestBudget(request);

  const headerConfig: {
    tone: HeaderTone;
    statusLabel: string;
    headerBadgeLabel?: string;
    titleMuted?: boolean;
    chips: {
      icon: keyof typeof Ionicons.glyphMap;
      label: string;
      emphasis?: "accent" | "warning";
    }[];
    footer: {
      fullName: string;
      avatarUrl?: string | null;
      meta: string;
      label?: string;
    };
  } = (() => {
    switch (viewState) {
      case "owner-open-empty":
        return {
          tone: "open",
          statusLabel: "Open",
          chips: [
            ...urgentHeroChip,
            { icon: "location-outline", label: formatCityCountry(request) },
            { icon: "cash-outline", label: formatRequestBudget(request), emphasis: "accent" },
            { icon: "time-outline", label: "Just posted" },
          ],
          footer: {
            fullName: authUser?.fullName || authUser?.profile?.fullName || request.requesterName,
            avatarUrl: authUser?.avatarUrl ?? request.requesterAvatarUrl,
            meta: "Posted by you",
          },
        };
      case "owner-open-with-bids":
        return {
          tone: "open",
          statusLabel: `Open · ${formatBidCountLabel(bids.length)}`,
          headerBadgeLabel: formatBidCountLabel(bids.length),
          chips: [
            ...urgentHeroChip,
            { icon: "location-outline", label: formatCityCountry(request) },
            { icon: "cash-outline", label: formatRequestBudget(request), emphasis: "accent" },
            { icon: "time-outline", label: "Open now" },
          ],
          footer: {
            fullName: authUser?.fullName || authUser?.profile?.fullName || request.requesterName,
            avatarUrl: authUser?.avatarUrl ?? request.requesterAvatarUrl,
            meta: "Posted by you",
          },
        };
      case "owner-assigned":
        return {
          tone: "assigned",
          statusLabel: "Assigned",
          chips: [
            ...urgentHeroChip,
            { icon: "location-outline", label: formatCityCountry(request) },
            { icon: "cash-outline", label: formatRequestBudget(request), emphasis: "warning" },
            { icon: "checkmark-done-outline", label: "Helper notified" },
          ],
          footer: {
            fullName: helperDisplayName,
            avatarUrl: acceptedBid?.helperAvatarUrl,
            meta: `Accepted bid · ${helperRatingLabel}`,
          },
        };
      case "owner-completed-no-review":
      case "owner-completed-reviewed":
        return {
          tone: "completed",
          statusLabel: "Completed",
          chips: [
            ...urgentHeroChip,
            { icon: "location-outline", label: formatCityCountry(request) },
            { icon: "wallet-outline", label: completedPriceLabel, emphasis: "accent" },
            { icon: "time-outline", label: "Closed" },
          ],
          footer: {
            fullName: helperDisplayName,
            avatarUrl: acceptedBid?.helperAvatarUrl,
            meta: "Completed by",
          },
        };
      case "owner-cancelled":
        return {
          tone: "cancelled",
          statusLabel: "Cancelled",
          titleMuted: true,
          chips: [
            ...urgentHeroChip,
            { icon: "location-outline", label: formatCityCountry(request) },
            { icon: "close-circle-outline", label: "No further actions" },
          ],
          footer: {
            fullName: authUser?.fullName || authUser?.profile?.fullName || request.requesterName,
            avatarUrl: authUser?.avatarUrl ?? request.requesterAvatarUrl,
            meta: "Posted by you",
          },
        };
      case "helper-open-bid-pending":
        return {
          tone: "open",
          statusLabel: "Your bid sent",
          chips: [
            ...urgentHeroChip,
            { icon: "location-outline", label: formatCityCountry(request) },
            { icon: "cash-outline", label: formatRequestBudget(request), emphasis: "accent" },
            { icon: "time-outline", label: "Waiting for owner" },
          ],
          footer: {
            fullName: request.requesterName,
            avatarUrl: request.requesterAvatarUrl,
            meta: requesterRatingLabel,
          },
        };
      case "helper-assigned-to-me":
        return {
          tone: "assigned",
          statusLabel: "You're hired!",
          chips: [
            ...urgentHeroChip,
            { icon: "location-outline", label: formatCityCountry(request), emphasis: "warning" },
            { icon: "wallet-outline", label: completedPriceLabel, emphasis: "warning" },
          ],
          footer: {
            fullName: request.requesterName,
            avatarUrl: request.requesterAvatarUrl,
            meta: "Requester",
          },
        };
      case "helper-bid-rejected":
        return {
          tone: "dimmed",
          statusLabel: request.status === "CANCELLED" ? "Cancelled" : "Assigned to other",
          titleMuted: true,
          chips: [
            ...urgentHeroChip,
            { icon: "location-outline", label: formatCityCountry(request) },
            { icon: "close-circle-outline", label: "No longer available" },
          ],
          footer: {
            fullName: request.requesterName,
            avatarUrl: request.requesterAvatarUrl,
            meta: "Requester",
          },
        };
      case "helper-open-no-bid":
      default:
        return {
          tone: "open",
          statusLabel:
            request.bidCount > 0
              ? `Open · ${formatBidCountLabel(request.bidCount)}`
              : "Open",
          headerBadgeLabel: request.bidCount > 0 ? formatBidCountLabel(request.bidCount) : undefined,
          chips: [
            ...urgentHeroChip,
            { icon: "location-outline", label: formatCityCountry(request) },
            { icon: "cash-outline", label: formatRequestBudget(request), emphasis: "accent" },
            { icon: "time-outline", label: "Open now" },
          ],
          footer: {
            fullName: request.requesterName,
            avatarUrl: request.requesterAvatarUrl,
            meta: requesterRatingLabel,
          },
        };
    }
  })();

  const renderOffersCard = () => (
    <AccordionSection
      title={`Offers (${bids.length})`}
      subtitle={
        bids.length
          ? "Review incoming offers and choose a helper."
          : "Offers from helpers will appear here."
      }
      icon="receipt-outline"
      expanded={expandedSections.offers}
      onToggle={() => toggleSection("offers")}
      badgeLabel={bids.length ? `${bids.length}` : undefined}
    >
      <Stack gap="sm">
        {bids.length === 0 ? (
          <View
            style={[
              styles.emptySection,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
              },
            ]}
          >
            <Ionicons name="hourglass-outline" size={24} color={palette.textSecondary} />
            <Text style={[styles.emptySectionTitle, { color: palette.textPrimary }]}>
              No bids yet
            </Text>
            <Text style={[styles.emptySectionCopy, { color: palette.textSecondary }]}>
              It can take a few hours for the right helper to discover this request.
            </Text>
          </View>
        ) : (
          <BidList
            bids={bids}
            title="Incoming bids"
            listPadding="none"
            emptyMessage=""
            canRespond
            canModify={false}
            actionLoadingByBidId={actionLoadingByBidId}
            onBidAccept={async (bid) => {
              const accepted = await acceptBid(bid.id);
              if (accepted) {
                showSuccessToast("Helper assigned successfully");
              }
            }}
            onBidReject={(bid) => rejectBid(bid.id)}
            onBidMessage={(bid) => handleOpenBidChat(bid.helpRequestId)}
            onRetry={fetchDetails}
          />
        )}
      </Stack>
    </AccordionSection>
  );

  const renderPhotosCard = () =>
    request.images?.length ? (
      <AccordionSection
        title="Photos"
        subtitle="Reference images attached to this request."
        icon="images-outline"
        expanded={expandedSections.photos}
        onToggle={() => toggleSection("photos")}
        badgeLabel={`${request.images.length}`}
      >
        <RequestPhotoUploadSection
          title="Uploaded photos"
          description="Photos attached to this request."
          existingImages={request.images}
          selectedImages={[]}
          readOnly
        />
      </AccordionSection>
    ) : null;

  const renderActivityCard = () => (
    <AccordionSection
      title="Activity"
      subtitle="Request history and completion events."
      icon="time-outline"
      expanded={expandedSections.activity}
      onToggle={() => toggleSection("activity")}
    >
      <Stack gap="sm">
        <TimelineRow
          icon="create-outline"
          title="Request created"
          detail={getRelativePostedTime(request.createdAt)}
        />
        <TimelineRow
          icon="refresh-outline"
          title="Last updated"
          detail={getRelativePostedTime(request.updatedAt ?? request.createdAt)}
        />
        <TimelineRow
          icon="radio-button-on-outline"
          title="Current status"
          detail={request.status}
        />
        <TimelineRow
          icon="receipt-outline"
          title="Bid activity"
          detail={bids.length ? formatBidCountLabel(bids.length) : "No bids yet"}
        />
      </Stack>
    </AccordionSection>
  );

  const renderAcceptedOfferCard = () => {
    const bid = acceptedBid ?? (myBid?.status === "ACCEPTED" ? myBid : null);

    if (!bid) return null;

    return (
      <SurfaceSection>
        <Stack gap="md">
          <Row justify="space-between" align="flex-start" gap="sm">
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                Accepted Offer
              </Text>
              <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                Final helper and agreed offer for this completed request.
              </Text>
            </View>

            <View style={[styles.statusPill, { backgroundColor: palette.successSoft ?? palette.surfaceMuted }]}>
              <Ionicons name="checkmark-circle-outline" size={14} color={palette.success} />
              <Text style={[styles.statusPillText, { color: palette.success }]}>
                Completed
              </Text>
            </View>
          </Row>

          <View
            style={[
              styles.acceptedOfferCard,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
              },
            ]}
          >
            <Row gap="sm" align="center">
              <ProfileAvatar
                uri={bid.helperAvatarUrl}
                fullName={bid.helperName}
                size={46}
              />

              <View style={{ flex: 1 }}>
                <Text style={[styles.acceptedOfferName, { color: palette.textPrimary }]}>
                  {bid.helperName}
                </Text>

                <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                  {formatRatingLabel(bid.helperRating)} · Selected helper
                </Text>
              </View>

              <Text style={[styles.acceptedOfferAmount, { color: palette.primary }]}>
                €{bid.amount.toFixed(2)}
              </Text>
            </Row>

            {bid.message ? (
              <Text style={[styles.acceptedOfferMessage, { color: palette.textSecondary }]}>
                “{bid.message}”
              </Text>
            ) : null}

            <Row gap="sm">
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Message"
                  variant="secondary"
                  onPress={() => handleOpenBidChat(request.id)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="View Profile"
                  variant="ghost"
                  onPress={handleOpenHelperProfile}
                />
              </View>
            </Row>
          </View>
        </Stack>
      </SurfaceSection>
    );
  };

  const renderManageCard = (buttons: React.ReactNode, description: string) => (
    <AccordionSection
      title="Manage request"
      subtitle={description}
      icon="settings-outline"
      expanded={expandedSections.manage}
      onToggle={() => toggleSection("manage")}
    >
      <View style={styles.buttonGrid}>{buttons}</View>
    </AccordionSection>
  );

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={palette.primary}
        />
      }
    >
      <AppHeader
        title="Request Details"
        subtitle="Review status, bids, and next actions."
        showBackButton
        backButtonProps={{
          fallback: requestListRoute,
          variant: "secondary",
        }}
      />

      <Stack gap="lg">
        <DetailHero
          request={request}
          tone={headerConfig.tone}
          statusLabel={headerConfig.statusLabel}
          headerBadgeLabel={headerConfig.headerBadgeLabel}
          titleMuted={headerConfig.titleMuted}
          chips={headerConfig.chips}
          footer={headerConfig.footer}
          perspective={
            request.status === "COMPLETED"
              ? "Completed request"
              : isOwner
                ? "Your request"
                : "Helper view"
          }
          onPressFooter={acceptedBid ? handleOpenHelperProfile : undefined}
        />

        {renderUrgentInfo()}
        {renderInlineError()}

        {viewState === "owner-open-empty" || viewState === "owner-open-with-bids" ? (
          <>
            {renderOffersCard()}
            {renderPhotosCard()}
            {renderActivityCard()}
            {renderManageCard(
              <>
                <View style={styles.buttonCell}>
                  <AppButton
                    title="Edit"
                    variant="secondary"
                    onPress={() => router.push(requestEditRoute(request.id))}
                  />
                </View>
                <View style={styles.buttonCell}>
                  <AppButton
                    title="Delete"
                    variant="danger"
                    onPress={handleDeleteRequest}
                    loading={deleting}
                    disabled={deleting || loading}
                  />
                </View>
                <View style={styles.buttonCell}>
                  <AppButton
                    title="Cancel"
                    variant="ghost"
                    onPress={() => void handleStatusUpdate("CANCELLED")}
                    disabled={loading}
                  />
                </View>
              </>,
              "Edit details, cancel the request, or move it forward once you choose a helper."
            )}
          </>
        ) : null}

        {viewState === "owner-assigned" ? (
          <>
            <StatePanel
              icon="people-outline"
              title="Helper assigned"
              description="Your helper has been notified. The next meaningful step is completion once the job is done."
              tone="warning"
            >
              <View style={styles.buttonGrid}>
                <View style={styles.buttonCell}>
                  <AppButton
                    title="Mark Complete"
                    onPress={() => void handleCompleteRequest()}
                    disabled={loading}
                  />
                </View>
                <View style={styles.buttonCell}>
                  <AppButton
                    title="Message Helper"
                    variant="secondary"
                    onPress={() => handleOpenBidChat(request.id)}
                  />
                </View>
                <View style={styles.buttonCell}>
                  <AppButton
                    title="View helper profile"
                    variant="ghost"
                    onPress={handleOpenHelperProfile}
                    disabled={!acceptedBid}
                  />
                </View>
              </View>
            </StatePanel>
            {renderOffersCard()}
            {renderPhotosCard()}
            {renderActivityCard()}
            {renderManageCard(
              <>
                <View style={styles.buttonCell}>
                  <AppButton
                    title="Edit"
                    variant="secondary"
                    onPress={() => router.push(requestEditRoute(request.id))}
                  />
                </View>
                <View style={styles.buttonCell}>
                  <AppButton
                    title="Cancel Request"
                    variant="danger"
                    onPress={() => void handleStatusUpdate("CANCELLED")}
                    disabled={loading}
                  />
                </View>
              </>,
              "You can still update the wording or cancel the request if plans changed."
            )}
          </>
        ) : null}

        {viewState === "owner-completed-no-review" ? (
          <StatePanel
            icon="star-outline"
            title={`How did ${helperDisplayName} do?`}
            description="This request is closed. A review is the most valuable thing you can do now."
            tone="info"
          >
            <Stack gap="md">
              <Pressable onPress={() => void handleOpenReviewModal()}>
                <StarRatingInput
                  value={previewReviewRating}
                  onChange={(value) => {
                    setPreviewReviewRating(value);
                    void handleOpenReviewModal();
                  }}
                  size={36}
                  helperText="Tap any star to start your review."
                />
              </Pressable>
              <AppButton
                title="Leave a review"
                variant="ghost"
                onPress={() => void handleOpenReviewModal()}
                loading={reviewLoading}
                disabled={reviewLoading}
              />
            </Stack>
          </StatePanel>
        ) : null}

        {viewState === "owner-completed-reviewed" ? (
          <StatePanel
            icon="checkmark-done-outline"
            title="Review submitted"
            description="Your review is attached to this completed request."
            tone="info"
          >
            <Stack gap="sm">
              {existingReview ? (
                <ReviewCard review={existingReview} showRequestContext={false} />
              ) : null}
              <AppButton
                title="Edit review"
                variant="ghost"
                onPress={() => void handleOpenReviewModal()}
                loading={reviewLoading}
                disabled={reviewLoading}
              />
            </Stack>
          </StatePanel>
        ) : null}

        {viewState === "owner-completed-no-review" || viewState === "owner-completed-reviewed" ? (
          <>
            {renderAcceptedOfferCard()}
            {renderPhotosCard()}
            {renderActivityCard()}
          </>
        ) : null}

        {viewState === "owner-cancelled" ? (
          <>
            <InfoBanner
              icon="information-circle-outline"
              message="This request is cancelled. No further actions are available on this listing."
              tone="danger"
            />
            <SurfaceSection>
              <Stack gap="sm">
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                  Ready to try again?
                </Text>
                <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                  Repost the request with updated timing or details so new helpers can discover it.
                </Text>
                <AppButton
                  title="Repost Request"
                  onPress={() => router.push(requestEditRoute(request.id))}
                />
              </Stack>
            </SurfaceSection>
            {renderPhotosCard()}
            {renderActivityCard()}
          </>
        ) : null}

        {viewState === "helper-open-no-bid" ? (
          <>
            <SurfaceSection>
              <Stack gap="sm">
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                  Save this request
                </Text>
                <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                  Keep it in your saved list so you can come back if you need more time.
                </Text>
                <AppButton
                  title={favorited ? "Saved request" : "Save request"}
                  variant="secondary"
                  loading={favoriteLoading}
                  onPress={() => {
                    void toggleFavorite(request);
                  }}
                  icon={
                    <Ionicons
                      name={favorited ? "heart" : "heart-outline"}
                      size={16}
                      color={palette.textPrimary}
                    />
                  }
                />
              </Stack>
            </SurfaceSection>
            <StatePanel
              icon="cash-outline"
              title="Place your bid"
              description="Send your amount and a short pitch. Contact details stay private until acceptance."
              tone="success"
            >
              <AppButton title="Submit offer" onPress={handleOpenBidModal} disabled={loading} />
            </StatePanel>
            {renderPhotosCard()}
            {renderActivityCard()}
          </>
        ) : null}

        {viewState === "helper-open-bid-pending" && myBid ? (
          <>
            <SurfaceSection>
              <Stack gap="sm">
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                  Save this request
                </Text>
                <AppButton
                  title={favorited ? "Saved request" : "Save request"}
                  variant="secondary"
                  loading={favoriteLoading}
                  onPress={() => {
                    void toggleFavorite(request);
                  }}
                  icon={
                    <Ionicons
                      name={favorited ? "heart" : "heart-outline"}
                      size={16}
                      color={palette.textPrimary}
                    />
                  }
                />
              </Stack>
            </SurfaceSection>
            <StatePanel
              icon="receipt-outline"
              title="Your bid"
              description="Waiting for the requester to choose a helper."
              tone="success"
            >
              <Stack gap="sm">
                <Text style={[styles.amountText, { color: palette.success }]}>
                  €{myBid.amount.toFixed(2)}
                </Text>
                <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                  {myBid.message}
                </Text>
                <View
                  style={[
                    styles.messageBlock,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <Text style={[styles.messageLabel, { color: palette.textSecondary }]}>
                    Pending
                  </Text>
                  <Text style={[styles.messageText, { color: palette.textPrimary }]}>
                    Waiting for the requester to choose a helper.
                  </Text>
                </View>
                <View style={styles.buttonGrid}>
                  <View style={styles.buttonCell}>
                    <AppButton
                      title="Edit Bid"
                      variant="secondary"
                      onPress={() => handleOpenEditBidModal(myBid)}
                      disabled={Boolean(actionLoadingByBidId[myBid.id])}
                    />
                  </View>
                  <View style={styles.buttonCell}>
                    <AppButton
                      title="Withdraw"
                      variant="ghost"
                      onPress={() => deleteMyBid(myBid.id)}
                      disabled={Boolean(actionLoadingByBidId[myBid.id])}
                    />
                  </View>
                </View>
              </Stack>
            </StatePanel>
            {renderPhotosCard()}
            {renderActivityCard()}
          </>
        ) : null}

        {viewState === "helper-assigned-to-me" && myBid ? (
          <>
            <StatePanel
              icon="checkmark-circle-outline"
              title="Your job is confirmed"
              description="Head to the agreed location and message the requester if you need to confirm any final details."
              tone="warning"
            >
              <AppButton
                title="Message Requester"
                onPress={() => handleOpenBidChat(request.id)}
              />
            </StatePanel>
            <SurfaceSection>
              <Stack gap="sm">
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                  Bid overview
                </Text>
                <Text style={[styles.amountText, { color: palette.primary }]}>
                  €{myBid.amount.toFixed(2)}
                </Text>
                <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                  {myBid.message}
                </Text>
              </Stack>
            </SurfaceSection>
            {renderPhotosCard()}
            {renderActivityCard()}
          </>
        ) : null}

        {viewState === "helper-bid-rejected" ? (
          <>
            <InfoBanner
              icon="close-circle-outline"
              message="Your bid was not selected for this request."
              tone="danger"
            />
            <SurfaceSection>
              <Stack gap="sm">
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                  Keep the momentum
                </Text>
                <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                  Browse other requests nearby and put your energy into the next opportunity.
                </Text>
                <AppButton
                  title="Browse Requests"
                  onPress={() => router.replace(APP_ROUTES.HOME_REQUESTS)}
                />
              </Stack>
            </SurfaceSection>
            {renderPhotosCard()}
            {renderActivityCard()}
          </>
        ) : null}
      </Stack>

      <BidRequestModal
        visible={bidModalVisible}
        selectedRequest={request}
        onClose={() => setBidModalVisible(false)}
        loading={loading}
        error={actionError}
        onSubmit={async (payload) => {
          if (typeof payload.amount !== "number" || typeof payload.message !== "string") {
            return;
          }

          const created = await submitBid(payload.amount, payload.message);
          if (!created) return;

          setBidModalVisible(false);
          showSuccessToast("Bid submitted successfully");
        }}
      />

      <ReviewComposerModal
        visible={reviewModalVisible && request.status === "COMPLETED"}
        onClose={() => setReviewModalVisible(false)}
        helpRequestId={request.id}
        requestTitle={request.title}
        helperName={helperDisplayName}
        initialReview={existingReview}
        loading={reviewLoading}
        error={reviewError}
        onSubmit={async (payload) => {
          const latest = await fetchDetails();
          const latestStatus = latest?.status ?? request.status;
          if (latestStatus !== "COMPLETED") {
            showErrorToast(
              "Request not completed",
              "Mark the request as completed first, then submit the review."
            );
            setReviewModalVisible(false);
            return;
          }

          if (existingReview) {
            await updateReview(existingReview.id, payload);
          } else {
            await createReview(payload as Parameters<typeof createReview>[0]);
          }

          await syncHelperReviews();
          setReviewModalVisible(false);
        }}
      />

      <EditBidModal
        visible={Boolean(editingBid)}
        bid={editingBid}
        loading={savingBid}
        onClose={handleCloseEditBidModal}
        onSubmit={handleSubmitEditBid}
      />

      {acceptedBid ? (
        <BidderProfileModal
          visible={helperProfileVisible}
          bid={acceptedBid}
          onClose={() => setHelperProfileVisible(false)}
        />
      ) : null}
    </Screen>
  );
};

const getHeroTone = (tone: HeaderTone) => {
  switch (tone) {
    case "assigned":
      return {
        backgroundColor: "#1C2F4B",
        accentColor: "#F4D88B",
        accentText: "#6A4D06",
        mutedText: "#C3D0E4",
      };
    case "completed":
      return {
        backgroundColor: "#32264F",
        accentColor: "#DBD1FF",
        accentText: "#4E3A8A",
        mutedText: "#CFC6E9",
      };
    case "cancelled":
      return {
        backgroundColor: "#4A2B24",
        accentColor: "#F3C1B6",
        accentText: "#72372C",
        mutedText: "#DDB8AE",
      };
    case "dimmed":
      return {
        backgroundColor: "#3B4146",
        accentColor: "#F1C5BE",
        accentText: "#6F3832",
        mutedText: "#BFC8D0",
      };
    case "open":
    default:
      return {
        backgroundColor: "#163A2E",
        accentColor: "#D9F2E2",
        accentText: "#1A6B43",
        mutedText: "#B9D4C3",
      };
  }
};

const getDescriptionBullets = (description: string): string[] => {
  const cleaned = description
    .replace(/^need\s+help\s+with[:\s-]*/i, "")
    .replace(/^looking\s+for\s+/i, "")
    .trim();

  const parts = cleaned
    .split(/[\n.;]/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length > 1 ? parts : [cleaned || description.trim()].filter(Boolean);
};

const DetailHero = ({
  request,
  tone,
  statusLabel,
  headerBadgeLabel,
  titleMuted,
  chips,
  footer,
  perspective,
  onPressFooter,
}: {
  request: HelpRequest;
  tone: HeaderTone;
  statusLabel: string;
  headerBadgeLabel?: string;
  titleMuted?: boolean;
  chips: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    emphasis?: "accent" | "warning";
  }[];
  footer: {
    fullName: string;
    avatarUrl?: string | null;
    meta: string;
    label?: string;
  };
  perspective: string;
  onPressFooter?: () => void;
}) => {
  const { palette } = useThemeContext();
  const toneStyle = getHeroTone(tone);
  const urgentActive = isUrgentRequestActive(request);
  const urgentLabel = getUrgentTimeRemainingLabel(request.urgentExpiresAt);
  const bullets = useMemo(
    () => getDescriptionBullets(request.description),
    [request.description]
  );

  return (
    <View style={[styles.detailHero, { backgroundColor: toneStyle.backgroundColor }]}>
      <View style={styles.heroGlow} />

      <Row justify="space-between" align="flex-start" gap="sm" style={styles.heroTopRow}>
        <View style={styles.heroCategoryPill}>
          <Text style={styles.heroCategoryText}>{perspective}</Text>
        </View>

        <Row gap="xs" align="center" style={styles.heroBadgeRow}>
          {urgentActive ? (
            <View style={[styles.heroBadge, { backgroundColor: "#F8B4B4" }]}>
              <Text style={[styles.heroBadgeText, { color: "#7F1D1D" }]}>
                Urgent · {urgentLabel}
              </Text>
            </View>
          ) : null}
          {headerBadgeLabel ? (
            <View style={[styles.heroBadge, { backgroundColor: "#D7B461" }]}>
              <Text style={styles.heroBadgeText}>{headerBadgeLabel}</Text>
            </View>
          ) : null}
          <View style={[styles.heroBadge, { backgroundColor: toneStyle.accentColor }]}>
            <Text style={[styles.heroBadgeText, { color: toneStyle.accentText }]}>
              {statusLabel}
            </Text>
          </View>
        </Row>
      </Row>

      <Text
        style={[
          styles.heroTitle,
          {
            textDecorationLine: titleMuted ? "line-through" : "none",
            opacity: titleMuted ? 0.74 : 1,
          },
        ]}
      >
        {request.title}
      </Text>

      <View style={styles.heroChipWrap}>
        {chips.map((chip) => {
          const color =
            chip.emphasis === "accent"
              ? toneStyle.accentColor
              : chip.emphasis === "warning"
                ? "#F4D88B"
                : toneStyle.mutedText;

          return (
            <View key={`${chip.icon}-${chip.label}`} style={styles.heroChip}>
              <Ionicons name={chip.icon} size={14} color={color} />
              <Text style={[styles.heroChipText, { color }]} numberOfLines={1}>
                {chip.label}
              </Text>
            </View>
          );
        })}
      </View>

      <Pressable
        onPress={onPressFooter}
        disabled={!onPressFooter}
        style={({ pressed }) => [
          styles.heroPersonPanel,
          onPressFooter ? { opacity: pressed ? 0.86 : 1 } : null,
        ]}
      >
        <ProfileAvatar uri={footer.avatarUrl} fullName={footer.fullName} size={44} />
        <View style={styles.heroPersonCopy}>
          <Text style={styles.heroPersonName}>{footer.fullName}</Text>
          <Text style={[styles.heroPersonMeta, { color: toneStyle.mutedText }]}>
            {footer.meta}
          </Text>
        </View>
        <Ionicons name="person-circle-outline" size={20} color={toneStyle.mutedText} />
      </Pressable>

      <View style={styles.heroDescriptionPanel}>
        <Text style={styles.heroSectionLabel}>What needs to be done</Text>
        <Stack gap="xs" style={styles.heroDescriptionList}>
          {bullets.map((line, index) => (
            <Row key={`${line}-${index}`} gap="xs" align="flex-start">
              <View
                style={[
                  styles.heroBullet,
                  { backgroundColor: palette.primarySoft ?? toneStyle.accentColor },
                ]}
              />
              <Text style={styles.heroDescriptionText}>{line}</Text>
            </Row>
          ))}
        </Stack>
      </View>
    </View>
  );
};

const SurfaceSection = ({ children }: { children: React.ReactNode }) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.surfaceSection,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      {children}
    </View>
  );
};

const AccordionSection = ({
  title,
  subtitle,
  icon,
  expanded,
  onToggle,
  badgeLabel,
  children,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  expanded: boolean;
  onToggle: () => void;
  badgeLabel?: string;
  children: React.ReactNode;
}) => {
  const { palette } = useThemeContext();

  return (
    <SurfaceSection>
      <Pressable onPress={onToggle} style={({ pressed }) => [{ opacity: pressed ? 0.78 : 1 }]}>
        <Row justify="space-between" align="center" gap="sm">
          <Row gap="sm" align="center" style={styles.accordionCopy}>
            <View
              style={[
                styles.accordionIcon,
                {
                  backgroundColor: palette.surfaceMuted,
                  borderColor: palette.border,
                },
              ]}
            >
              <Ionicons name={icon} size={16} color={palette.primary} />
            </View>
            <View style={styles.accordionTextWrap}>
              <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>{title}</Text>
              <Text style={[styles.helperText, { color: palette.textSecondary }]}>{subtitle}</Text>
            </View>
          </Row>
          <Row gap="xs" align="center">
            {badgeLabel ? (
              <View style={[styles.accordionBadge, { backgroundColor: palette.surfaceMuted }]}>
                <Text style={[styles.accordionBadgeText, { color: palette.textSecondary }]}>
                  {badgeLabel}
                </Text>
              </View>
            ) : null}
            <Ionicons
              name={expanded ? "chevron-up-outline" : "chevron-down-outline"}
              size={18}
              color={palette.textSecondary}
            />
          </Row>
        </Row>
      </Pressable>

      {expanded ? <View style={styles.accordionBody}>{children}</View> : null}
    </SurfaceSection>
  );
};

const TimelineRow = ({
  icon,
  title,
  detail,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
}) => {
  const { palette } = useThemeContext();

  return (
    <Row gap="sm" align="center">
      <View
        style={[
          styles.timelineIcon,
          {
            backgroundColor: palette.surfaceMuted,
            borderColor: palette.border,
          },
        ]}
      >
        <Ionicons name={icon} size={14} color={palette.primary} />
      </View>
      <View style={styles.timelineCopy}>
        <Text style={[styles.timelineTitle, { color: palette.textPrimary }]}>{title}</Text>
        <Text style={[styles.timelineDetail, { color: palette.textSecondary }]}>{detail}</Text>
      </View>
    </Row>
  );
};

const StatePanel = ({
  icon,
  title,
  description,
  tone,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  tone: "success" | "warning" | "info";
  children: React.ReactNode;
}) => {
  const { palette } = useThemeContext();
  const color =
    tone === "success"
      ? palette.success
      : tone === "warning"
        ? palette.warning
        : palette.secondary;
  const backgroundColor =
    tone === "success"
      ? palette.successSoft ?? palette.surfaceMuted
      : tone === "warning"
        ? palette.warningSoft ?? palette.surfaceMuted
        : palette.secondarySoft ?? palette.surfaceMuted;

  return (
    <View
      style={[
        styles.statePanel,
        {
          backgroundColor,
          borderColor: color,
        },
      ]}
    >
      <Row gap="sm" align="flex-start">
        <View style={[styles.stateIcon, { backgroundColor: palette.surface }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={styles.stateCopy}>
          <Text style={[styles.primaryStateTitle, { color: palette.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.helperText, { color: palette.textSecondary }]}>
            {description}
          </Text>
        </View>
      </Row>
      <View style={styles.stateBody}>{children}</View>
    </View>
  );
};

const InfoBanner = ({
  icon,
  message,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
  tone: "danger";
}) => {
  const { palette } = useThemeContext();
  const color = tone === "danger" ? palette.danger : palette.textSecondary;

  return (
    <View
      style={[
        styles.infoBanner,
        {
          backgroundColor: palette.dangerSoft,
          borderColor: color,
        },
      ]}
    >
      <Row gap="xs" align="center">
        <Ionicons name={icon} size={16} color={color} />
        <Text style={[styles.inlineErrorText, { color }]}>{message}</Text>
      </Row>
    </View>
  );
};

const styles = StyleSheet.create({
  centerState: {
    alignItems: "center",
    maxWidth: 280,
  },
  centerStateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  centerStateTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: "center",
  },
  centerStateCopy: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
    textAlign: "center",
  },
  loadingDotsRow: {
    justifyContent: "center",
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailHero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 18,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  heroGlow: {
    position: "absolute",
    top: -70,
    right: -52,
    width: 198,
    height: 198,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  heroTopRow: {
    zIndex: 1,
  },
  heroCategoryPill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  heroCategoryText: {
    color: "#EAF5EE",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  heroBadgeRow: {
    flexShrink: 1,
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },
  heroBadge: {
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
  },
  heroBadgeText: {
    color: "#2B2110",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "800",
  },
  heroTitle: {
    zIndex: 1,
    color: "#F6FAF7",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroChipWrap: {
    zIndex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  heroChip: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroChipText: {
    maxWidth: 260,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  heroPersonPanel: {
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 18,
    padding: theme.spacing.sm,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroPersonCopy: {
    flex: 1,
  },
  heroPersonName: {
    color: "#F6FAF7",
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: "800",
  },
  heroPersonMeta: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  heroDescriptionPanel: {
    zIndex: 1,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 18,
    padding: theme.spacing.md,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroSectionLabel: {
    color: "#F6FAF7",
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: "800",
  },
  heroDescriptionList: {
    marginTop: theme.spacing.xs,
  },
  heroBullet: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 7,
  },
  heroDescriptionText: {
    flex: 1,
    color: "rgba(246,250,247,0.68)",
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 21,
    fontStyle: "italic",
  },
  surfaceSection: {
    borderWidth: 0.5,
    borderRadius: 18,
    padding: theme.spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  accordionCopy: {
    flex: 1,
  },
  accordionIcon: {
    width: 36,
    height: 36,
    borderWidth: 0.5,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  accordionTextWrap: {
    flex: 1,
  },
  accordionBadge: {
    borderRadius: theme.radius.fill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  accordionBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  accordionBody: {
    marginTop: theme.spacing.md,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderWidth: 0.5,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineCopy: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  timelineDetail: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 18,
  },
  inlineErrorCard: {
    borderWidth: 0.5,
    borderRadius: 14,
    padding: theme.spacing.md,
  },
  inlineErrorText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
  },
  urgentInfoCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  urgentInfoTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  urgentInfoBody: {
    fontSize: theme.typography.fontSize.xs + 1,
    lineHeight: theme.typography.lineHeight.xs + 4,
  },
  sectionCard: {
    borderRadius: 16,
  },
  primaryStateCard: {
    borderRadius: 18,
  },
  infoBanner: {
    borderWidth: 0.5,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  statePanel: {
    borderWidth: 0.5,
    borderRadius: 18,
    padding: theme.spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  stateIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  stateCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  stateBody: {
    marginTop: theme.spacing.md,
  },
  sectionPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    columnGap: 6,
  },
  sectionPillText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  acceptedOfferCard: {
    borderWidth: 0.5,
    borderRadius: 16,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  acceptedOfferName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: "800",
  },
  acceptedOfferAmount: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "800",
  },
  acceptedOfferMessage: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 21,
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  primaryStateTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: 30,
  },
  helperText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
  },
  emptySection: {
    borderWidth: 0.5,
    borderRadius: 16,
    alignItems: "center",
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  emptySectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  emptySectionCopy: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
    textAlign: "center",
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  buttonCell: {
    flexBasis: "48%",
    flexGrow: 1,
  },
  amountText: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
  },
  messageBlock: {
    borderWidth: 0.5,
    borderRadius: 14,
    padding: theme.spacing.md,
    gap: theme.spacing.xxs,
  },
  messageLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  messageText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
  },
});

export default RequestDetailsScreen;
