import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card, Row, Screen, Stack, theme } from "@/design-system";
import { BidRequestModal } from "@/features/bid/components/BidRequestModal";
import { BidList } from "@/features/bid/components/BidList";
import { EditBidModal } from "@/features/bid/components/EditBidModal";
import type { Bid } from "@/features/bid/types/bid.types";
import { useFavorites } from "@/features/favorites/hooks/favorite.hook";
import {
  RequestDetailsHeader,
  RequestEmptyState,
  RequestPhotoUploadSection,
} from "@/features/helpRequest/components";
import { useRequestDetails } from "@/features/helpRequest/hooks/useRequestDetails";
import type { HelpRequest, HelpRequestStatus } from "@/features/helpRequest/types/helpRequest.types";
import { formatRequestBudget, formatRequestLocation } from "@/features/helpRequest/utils/requestDisplay";
import { isRequestOpenForBidding } from "@/features/helpRequest/utils/requestValidation";
import {
  ReviewCard,
  ReviewComposerModal,
  StarRatingInput,
} from "@/features/reviews/components";
import { useReviews } from "@/features/reviews/hooks/useReviews";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { goBackOrFallback } from "@/utils/navigation";
import { APP_ROUTES } from "@/config/routes";
import { showSuccessToast } from "@/utils/toast";

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

export const RequestDetailsScreen = ({ requestId }: Props) => {
  const params = useLocalSearchParams<{ id?: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { palette } = useThemeContext();
  const authUser = useAuthStore((state) => state.user);
  const [deleting, setDeleting] = useState(false);
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [editingBid, setEditingBid] = useState<Bid | null>(null);
  const [savingBid, setSavingBid] = useState(false);
  const [previewReviewRating, setPreviewReviewRating] = useState(0);

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
  const helperId = request?.assignedHelperId ?? null;
  const requestIdValue = request?.id ?? "";
  const acceptedBid = useMemo(
    () => bids.find((bid) => bid.status === "ACCEPTED") ?? null,
    [bids]
  );
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

  const handleStatusUpdate = useCallback(
    async (status: HelpRequestStatus) => {
      const updated = await setRequestStatus(status);

      if (
        updated &&
        status === "COMPLETED" &&
        (updated.assignedHelperId || helperId)
      ) {
        const reviewResult = await getUserReviews(updated.assignedHelperId || helperId!, {
          limit: 10,
          forceRefresh: true,
        });

        const alreadyReviewed = reviewResult?.reviews?.some(
          (review) =>
            review.helpRequest.id === requestIdValue &&
            review.reviewer.id === currentUserId
        );

        if (!alreadyReviewed) {
          setReviewModalVisible(true);
        }
      }

      return updated;
    },
    [currentUserId, getUserReviews, helperId, requestIdValue, setRequestStatus]
  );

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

  const syncHelperReviews = useCallback(async () => {
    if (!helperId) return null;

    return getUserReviews(helperId, {
      limit: 10,
      forceRefresh: true,
    });
  }, [getUserReviews, helperId]);

  const handleOpenReviewModal = useCallback(async () => {
    await syncHelperReviews();
    setReviewModalVisible(true);
  }, [syncHelperReviews]);

  const renderInlineError = () =>
    actionError ? (
      <Card
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
      </Card>
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
  const completedPriceLabel =
    request.status === "COMPLETED" && request.isPaid
      ? `${formatRequestBudget(request)} paid`
      : formatRequestBudget(request);

  const headerConfig: {
    tone: HeaderTone;
    statusLabel: string;
    headerBadgeLabel?: string;
    titleMuted?: boolean;
    chips: Array<{
      icon: keyof typeof Ionicons.glyphMap;
      label: string;
      emphasis?: "accent" | "warning";
    }>;
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
            { icon: "location-outline", label: formatRequestLocation(request) },
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
            { icon: "location-outline", label: formatRequestLocation(request) },
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
            { icon: "location-outline", label: formatRequestLocation(request) },
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
            { icon: "location-outline", label: formatRequestLocation(request) },
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
            { icon: "location-outline", label: formatRequestLocation(request) },
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
            { icon: "location-outline", label: formatRequestLocation(request) },
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
            { icon: "location-outline", label: formatRequestLocation(request), emphasis: "warning" },
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
            { icon: "location-outline", label: formatRequestLocation(request) },
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
            { icon: "location-outline", label: formatRequestLocation(request) },
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

  const renderManageCard = (options: {
    title: string;
    description: string;
    buttons: React.ReactNode;
  }) => (
    <Card style={[styles.sectionCard, { borderColor: palette.border }]}>
      <Stack gap="sm">
        <View
          style={[
            styles.sectionPill,
            {
              backgroundColor: palette.surfaceMuted,
              borderColor: palette.border,
            },
          ]}
        >
          <Ionicons name="settings-outline" size={14} color={palette.textSecondary} />
          <Text style={[styles.sectionPillText, { color: palette.textSecondary }]}>
            Manage request
          </Text>
        </View>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
          {options.title}
        </Text>
        <Text style={[styles.helperText, { color: palette.textSecondary }]}>
          {options.description}
        </Text>
        {options.buttons}
      </Stack>
    </Card>
  );

  const renderOffersCard = () => (
    <Card style={[styles.sectionCard, { borderColor: palette.border }]}>
      <Stack gap="sm">
        <View
          style={[
            styles.sectionPill,
            {
              backgroundColor: palette.surfaceMuted,
              borderColor: palette.border,
            },
          ]}
        >
          <Ionicons name="receipt-outline" size={14} color={palette.textSecondary} />
          <Text style={[styles.sectionPillText, { color: palette.textSecondary }]}>
            Bidder offers
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
          Bidder offers
        </Text>

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
            onBidAccept={(bid) => acceptBid(bid.id)}
            onBidReject={(bid) => rejectBid(bid.id)}
            onBidMessage={(bid) => handleOpenBidChat(bid.helpRequestId)}
            onRetry={fetchDetails}
          />
        )}
      </Stack>
    </Card>
  );

  return (
    <Screen>
      <AppHeader
        title="Request Details"
        subtitle="Review status, bids, and next actions."
        showBackButton
        backButtonProps={{
          fallback: requestListRoute,
          variant: "secondary",
        }}
      />

      <RequestDetailsHeader
        request={request}
        tone={headerConfig.tone}
        statusLabel={headerConfig.statusLabel}
        headerBadgeLabel={headerConfig.headerBadgeLabel}
        titleMuted={headerConfig.titleMuted}
        chips={headerConfig.chips}
        footer={headerConfig.footer}
      />

      {request.images?.length ? (
        <RequestPhotoUploadSection
          title="Uploaded photos"
          description="Photos attached to this request."
          existingImages={request.images}
          selectedImages={[]}
          readOnly
        />
      ) : null}

      {viewState === "owner-open-empty" || viewState === "owner-open-with-bids" ? (
        <>
          {renderInlineError()}
          {renderManageCard({
            title: "Manage your request",
            description:
              "Edit the details, cancel the request, or move it forward once you choose a helper.",
            buttons: (
              <View style={styles.buttonGrid}>
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
                    title="Mark Assigned"
                    onPress={() => void handleStatusUpdate("ASSIGNED")}
                    disabled={loading}
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
              </View>
            ),
          })}
          {renderOffersCard()}
        </>
      ) : null}

      {viewState === "owner-assigned" ? (
        <>
          {renderInlineError()}
          <Card
            style={[
              styles.primaryStateCard,
              {
                backgroundColor: palette.warningSoft ?? palette.surfaceMuted,
                borderColor: palette.warning,
              },
            ]}
          >
            <Stack gap="sm">
              <Text style={[styles.primaryStateTitle, { color: palette.textPrimary }]}>
                Helper assigned
              </Text>
              <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                Your helper has been notified. The next meaningful step is completion once the job
                is done.
              </Text>
              <View style={styles.buttonGrid}>
                <View style={styles.buttonCell}>
                  <AppButton
                    title="Mark Complete"
                    onPress={() => void handleStatusUpdate("COMPLETED")}
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
              </View>
            </Stack>
          </Card>
          {renderManageCard({
            title: "Manage the in-progress request",
            description:
              "You can still update the wording or cancel the request if plans changed.",
            buttons: (
              <View style={styles.buttonGrid}>
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
              </View>
            ),
          })}
        </>
      ) : null}

      {viewState === "owner-completed-no-review" ? (
        <>
          {renderInlineError()}
          <Card
            style={[
              styles.primaryStateCard,
              {
                backgroundColor: palette.secondarySoft ?? palette.surfaceMuted,
                borderColor: palette.secondary,
              },
            ]}
          >
            <Stack gap="md">
              <Text style={[styles.primaryStateTitle, { color: palette.textPrimary }]}>
                How did {helperDisplayName} do?
              </Text>
              <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                This request is closed. A review is the most valuable thing you can do now.
              </Text>
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
                onPress={() => void handleOpenReviewModal()}
                loading={reviewLoading}
                disabled={reviewLoading}
              />
            </Stack>
          </Card>
        </>
      ) : null}

      {viewState === "owner-completed-reviewed" ? (
        <>
          {renderInlineError()}
          <Card
            style={[
              styles.primaryStateCard,
              {
                backgroundColor: palette.secondarySoft ?? palette.surfaceMuted,
                borderColor: palette.secondary,
              },
            ]}
          >
            <Stack gap="sm">
              <Text style={[styles.primaryStateTitle, { color: palette.textPrimary }]}>
                Review submitted
              </Text>
              {existingReview ? (
                <ReviewCard review={existingReview} showRequestContext={false} />
              ) : null}
              <AppButton
                title="Edit review"
                variant="secondary"
                onPress={() => void handleOpenReviewModal()}
                loading={reviewLoading}
                disabled={reviewLoading}
              />
            </Stack>
          </Card>
        </>
      ) : null}

      {viewState === "owner-cancelled" ? (
        <>
          <Card
            style={[
              styles.infoBanner,
              {
                backgroundColor: palette.dangerSoft,
                borderColor: palette.danger,
              },
            ]}
          >
            <Row gap="xs" align="center">
              <Ionicons name="information-circle-outline" size={16} color={palette.danger} />
              <Text style={[styles.inlineErrorText, { color: palette.danger }]}>
                This request is cancelled. No further actions are available on this listing.
              </Text>
            </Row>
          </Card>
          <Card style={[styles.sectionCard, { borderColor: palette.border }]}>
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
          </Card>
        </>
      ) : null}

      {viewState === "helper-open-no-bid" ? (
        <>
          {renderInlineError()}
          <Card style={[styles.sectionCard, { borderColor: palette.border }]}>
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
          </Card>
          <Card
            style={[
              styles.primaryStateCard,
              {
                borderColor: palette.primary,
                backgroundColor: palette.primarySoft ?? palette.surfaceMuted,
              },
            ]}
          >
            <Stack gap="sm">
              <Text style={[styles.primaryStateTitle, { color: palette.textPrimary }]}>
                Place your bid
              </Text>
              <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                Send your amount and a short pitch. Contact details stay private until acceptance.
              </Text>
              <AppButton title="Submit offer" onPress={handleOpenBidModal} disabled={loading} />
            </Stack>
          </Card>
        </>
      ) : null}

      {viewState === "helper-open-bid-pending" && myBid ? (
        <>
          {renderInlineError()}
          <Card style={[styles.sectionCard, { borderColor: palette.border }]}>
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
          </Card>
          <Card
            style={[
              styles.primaryStateCard,
              {
                backgroundColor: palette.successSoft ?? palette.surfaceMuted,
                borderColor: palette.success,
              },
            ]}
          >
            <Stack gap="sm">
              <Text style={[styles.primaryStateTitle, { color: palette.textPrimary }]}>
                Your bid
              </Text>
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
          </Card>
        </>
      ) : null}

      {viewState === "helper-assigned-to-me" && myBid ? (
        <>
          {renderInlineError()}
          <Card
            style={[
              styles.primaryStateCard,
              {
                backgroundColor: palette.warningSoft ?? palette.surfaceMuted,
                borderColor: palette.warning,
              },
            ]}
          >
            <Stack gap="sm">
              <Text style={[styles.primaryStateTitle, { color: palette.textPrimary }]}>
                Your job is confirmed
              </Text>
              <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                Head to the agreed location and message the requester if you need to confirm any
                final details.
              </Text>
              <AppButton
                title="Message Requester"
                onPress={() => handleOpenBidChat(request.id)}
              />
            </Stack>
          </Card>
          <Card style={[styles.sectionCard, { borderColor: palette.border }]}>
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
          </Card>
        </>
      ) : null}

      {viewState === "helper-bid-rejected" ? (
        <>
          <Card
            style={[
              styles.infoBanner,
              {
                backgroundColor: palette.dangerSoft,
                borderColor: palette.danger,
              },
            ]}
          >
            <Row gap="xs" align="center">
              <Ionicons name="close-circle-outline" size={16} color={palette.danger} />
              <Text style={[styles.inlineErrorText, { color: palette.danger }]}>
                Your bid was not selected for this request.
              </Text>
            </Row>
          </Card>
          <Card style={[styles.sectionCard, { borderColor: palette.border }]}>
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
          </Card>
        </>
      ) : null}

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
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        helpRequestId={request.id}
        requestTitle={request.title}
        helperName={helperDisplayName}
        initialReview={existingReview}
        loading={reviewLoading}
        error={reviewError}
        onSubmit={async (payload) => {
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
    </Screen>
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
  inlineErrorCard: {
    borderRadius: 14,
  },
  inlineErrorText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
  },
  sectionCard: {
    borderRadius: 16,
  },
  primaryStateCard: {
    borderRadius: 18,
  },
  infoBanner: {
    borderRadius: 14,
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
    borderWidth: 1,
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
    borderWidth: 1,
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
