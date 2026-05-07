import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Swipeable } from "react-native-gesture-handler";

import { Card, Row, Stack, spacing, typography } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";
import { VerificationBadgeList } from "@/features/user/components/VerificationBadgeList";
import { Bid } from "../types/bid.types";
import { BidStatusBadge } from "./BidStatusBadge";
import { BidderProfileModal } from "./BidderProfileModal";
import { formatBidAmount, formatBidCreatedAt } from "../utils/bidDisplay";

type Props = {
  bid: Bid;
  onPress?: () => void;
  onViewProfile?: () => void;
  isRequestOwner?: boolean;
  canRespond?: boolean;
  canModify?: boolean;
  disableRespondActions?: boolean;
  loading?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onUpdate?: () => void;
  onDelete?: () => void;
  onMessage?: () => void;
  isSwipeOpen?: boolean;
  onSwipeOpen?: (bidId: string) => void;
  onSwipeClose?: (bidId: string) => void;
};

type SwipeAction = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  backgroundColor: string;
  textColor: string;
  onPress: () => void;
  disabled?: boolean;
};

export const BidCard = ({
  bid,
  onPress,
  onViewProfile,
  isRequestOwner = false,
  canRespond = false,
  canModify = false,
  disableRespondActions = false,
  loading = false,
  onAccept,
  onReject,
  onUpdate,
  onDelete,
  onMessage,
  isSwipeOpen = false,
  onSwipeOpen,
  onSwipeClose,
}: Props) => {
  const isDesktopWeb = Platform.OS === "web";
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const swipeableRef = useRef<Swipeable | null>(null);
  const { palette } = useThemeContext();

  const helperName = bid.helperName || "Community member";
  const helperRating = bid.helperRating ?? 0;
  const helperTotalReviews = bid.helperTotalReviews ?? 0;
  const helperCompletedHelps = bid.helperCompletedHelps ?? 0;
  const hasReviewSummary = helperTotalReviews > 0;
  const helperVerificationBadges = bid.helperVerificationBadges ?? [];

  const requesterActions = isRequestOwner || canRespond;
  const helperActions = !requesterActions && canModify;
  const canAccept = requesterActions && bid.status === "PENDING" && Boolean(onAccept);
  const canReject = requesterActions && bid.status === "PENDING" && Boolean(onReject);
  const canEdit = helperActions && bid.status === "PENDING" && Boolean(onUpdate);
  const canDelete = helperActions && bid.status === "PENDING" && Boolean(onDelete);
  const canMessage = bid.status === "ACCEPTED" && Boolean(onMessage);
  const messageLabel = "Open chat";

  useEffect(() => {
    if (!isSwipeOpen) {
      swipeableRef.current?.close();
    }
  }, [isSwipeOpen]);

  const openProfileModal = () => {
    setProfileModalVisible(true);
    onViewProfile?.();
  };

  const swipeActions = useMemo<SwipeAction[]>(() => {
    const actions: SwipeAction[] = [];

    if (canAccept && onAccept) {
      actions.push({
        key: "accept",
        label: "Accept",
        icon: "checkmark-circle-outline",
        backgroundColor: palette.success,
        textColor: palette.textInverse,
        onPress: onAccept,
        disabled: disableRespondActions || loading,
      });
    }

    if (canReject && onReject) {
      actions.push({
        key: "reject",
        label: "Reject",
        icon: "close-circle-outline",
        backgroundColor: palette.surfaceMuted,
        textColor: palette.textPrimary,
        onPress: onReject,
        disabled: disableRespondActions || loading,
      });
    }

    if (canEdit && onUpdate) {
      actions.push({
        key: "edit",
        label: "Edit",
        icon: "create-outline",
        backgroundColor: palette.surfaceMuted,
        textColor: palette.textPrimary,
        onPress: onUpdate,
        disabled: loading,
      });

    }

    if (canDelete && onDelete) {
      actions.push({
        key: "delete",
        label: "Delete",
        icon: "trash-outline",
        backgroundColor: palette.danger,
        textColor: palette.textInverse,
        onPress: onDelete,
        disabled: loading,
      });
    }

    if (canMessage && onMessage) {
      actions.push({
        key: "message",
        label: messageLabel,
        icon: "chatbubble-outline",
        backgroundColor: palette.primary,
        textColor: palette.textInverse,
        onPress: onMessage,
        disabled: loading,
      });
    }

    return actions;
  }, [
    canAccept,
    canDelete,
    canEdit,
    canMessage,
    canReject,
    disableRespondActions,
    loading,
    onAccept,
    onDelete,
    onMessage,
    onReject,
    onUpdate,
    palette.danger,
    palette.primary,
    palette.success,
    palette.surfaceMuted,
    palette.textInverse,
    palette.textPrimary,
    messageLabel,
  ]);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (swipeActions.length === 0) {
      return <View />;
    }

    const translateX = dragX.interpolate({
      inputRange: [-220, -40, 0],
      outputRange: [0, 8, 18],
      extrapolate: "clamp",
    });
    const scale = progress.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0.92, 0.98, 1],
      extrapolate: "clamp",
    });
    const opacity = progress.interpolate({
      inputRange: [0, 0.2, 1],
      outputRange: [0.35, 0.7, 1],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.swipeActionsWrap,
          {
            opacity,
            transform: [{ translateX }, { scale }],
          },
        ]}
      >
        {swipeActions.map((action) => (
          <Pressable
            key={action.key}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            disabled={action.disabled}
            onPress={() => {
              swipeableRef.current?.close();
              action.onPress();
            }}
            style={({ pressed }) => [
              styles.swipeAction,
              {
                backgroundColor: action.backgroundColor,
                opacity: action.disabled ? 0.5 : pressed ? 0.82 : 1,
              },
            ]}
          >
            <Ionicons name={action.icon} size={18} color={action.textColor} />
            <Text style={[styles.swipeActionLabel, { color: action.textColor }]}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </Animated.View>
    );
  };

  const cardBody = (
    <Pressable onPress={onPress} disabled={!onPress}>
      {({ pressed }) => (
        <Card
          style={[
            styles.card,
            {
              borderColor: palette.border,
              backgroundColor: palette.surface,
              opacity: pressed ? 0.96 : 1,
            },
          ]}
        >
          <Stack gap="md">
            {(bid.helpRequestTitle || bid.requesterName) ? (
              <View style={styles.requestContext}>
                {bid.helpRequestTitle ? (
                  <Text style={[styles.requestTitle, { color: palette.textPrimary }]} numberOfLines={1}>
                    Request: {bid.helpRequestTitle}
                  </Text>
                ) : null}
                {bid.requesterName ? (
                  <Text style={[styles.requestMeta, { color: palette.textSecondary }]} numberOfLines={1}>
                    Posted by {bid.requesterName}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {/* HEADER */}
            <Row justify="space-between" align="flex-start">
              <Row align="center" gap="sm" style={{ flex: 1 }}>
                <ProfileAvatar
                  uri={bid.helperAvatarUrl}
                  fullName={helperName}
                  size={42}
                />

                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.name, { color: palette.textPrimary }]}
                    numberOfLines={1}
                  >
                    {helperName}
                  </Text>

                  <VerificationBadgeList badges={helperVerificationBadges} compact />

                  {hasReviewSummary ? (
                    <Text
                      style={[styles.reviewMeta, { color: palette.textSecondary }]}
                      numberOfLines={1}
                    >
                      <Text style={{ color: palette.warning, fontWeight: "700" }}>
                        {helperRating.toFixed(1)} ★
                      </Text>{" "}
                      ({helperTotalReviews} review
                      {helperTotalReviews === 1 ? "" : "s"}) ·{" "}
                      {helperCompletedHelps} completed help
                      {helperCompletedHelps === 1 ? "" : "s"}
                    </Text>
                  ) : (
                    <Text
                      style={[styles.reviewMeta, { color: palette.textSecondary }]}
                    >
                      No reviews yet
                    </Text>
                  )}

                  <Text
                    style={[styles.meta, { color: palette.textSecondary }]}
                  >
                    <Text style={{ color: palette.primary, fontWeight: "700" }}>
                      {formatBidAmount(bid.amount)}
                    </Text>{" "}
                    · {formatBidCreatedAt(bid.createdAt)}
                  </Text>
                </View>
              </Row>

              <BidStatusBadge status={bid.status} />
            </Row>

            <Text
              style={[styles.message, { color: palette.textPrimary }]}
              numberOfLines={3}
            >
              {bid.message || "No message provided."}
            </Text>

            <Row justify="space-between" align="center">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`View ${helperName}'s profile`}
                onPress={openProfileModal}
                style={({ pressed }) => [
                  styles.profileLinkRow,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Ionicons name="person-circle-outline" size={16} color={palette.primary} />
                <Text style={[styles.profileLinkText, { color: palette.primary }]}>View profile</Text>
              </Pressable>
              {isDesktopWeb ? (
              <View style={styles.inlineActions}>
                {onPress ? (
                  <Pressable onPress={onPress} style={[styles.inlineActionBtn, { borderColor: palette.border }]}>
                    <Text style={[styles.inlineActionText, { color: palette.textPrimary }]}>View request</Text>
                  </Pressable>
                ) : null}
                {canEdit && onUpdate ? (
                  <Pressable onPress={onUpdate} style={[styles.inlineActionBtn, { borderColor: palette.border }]}>
                    <Text style={[styles.inlineActionText, { color: palette.textPrimary }]}>Edit bid</Text>
                  </Pressable>
                ) : null}
                {canDelete && onDelete ? (
                  <Pressable onPress={onDelete} style={[styles.inlineActionBtn, { borderColor: palette.border }]}>
                    <Text style={[styles.inlineActionText, { color: palette.danger }]}>Withdraw</Text>
                  </Pressable>
                ) : null}
              </View>
              ) : null}
            </Row>

            {bid.status === "ACCEPTED" ? (
              <Text style={[styles.acceptedLabel, { color: palette.success }]}>
                {requesterActions ? "You accepted this offer" : "Your offer was accepted"}
              </Text>
            ) : null}
          </Stack>
        </Card>
      )}
    </Pressable>
  );

  return (
    <>
      {swipeActions.length > 0 ? (
        <Swipeable
          ref={swipeableRef}
          overshootRight={false}
          rightThreshold={24}
          friction={1.8}
          renderRightActions={renderRightActions}
          onSwipeableWillOpen={() => onSwipeOpen?.(bid.id)}
          onSwipeableClose={() => onSwipeClose?.(bid.id)}
        >
          {cardBody}
        </Swipeable>
      ) : (
        cardBody
      )}

      <BidderProfileModal
        visible={profileModalVisible}
        bid={bid}
        onClose={() => setProfileModalVisible(false)}
      />


    </>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md,
  },
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: "700",
  },
  meta: {
    marginTop: 2,
    fontSize: typography.fontSize.sm,
  },
  reviewMeta: {
    marginTop: 4,
    fontSize: typography.fontSize.sm,
  },
  requestContext: {
    gap: 2,
  },
  requestTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: "700",
  },
  requestMeta: {
    fontSize: typography.fontSize.xs,
    fontWeight: "500",
  },
  message: {
    fontSize: typography.fontSize.md,
    lineHeight: 22,
  },
  profileLinkRow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    columnGap: spacing.xs,
  },
  profileLinkText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "700",
  },
  swipeHintText: {
    fontSize: typography.fontSize.xs,
    fontWeight: "600",
  },
  swipeActionsWrap: {
    flexDirection: "row",
    alignItems: "stretch",
    marginLeft: spacing.sm,
    overflow: "hidden",
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  swipeAction: {
    minWidth: 84,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    rowGap: spacing.xxs,
  },
  swipeActionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: "700",
  },
  acceptedLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
  },
  inlineActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineActionBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inlineActionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: "700",
  },
});
