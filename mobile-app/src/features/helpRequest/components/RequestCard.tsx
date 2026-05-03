import React, { useMemo, useState } from "react";
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ImagePreviewModal, PreviewImageItem } from "@/components/ui/ImagePreviewModal";
import { Card, Row, Stack, theme } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useFavorites } from "@/features/favorites/hooks/favorite.hook";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";
import { HelpRequest } from "../types/helpRequest.types";
import {
  formatRequestBudget,
  formatRequestCreatedAt,
  formatRequestLocation,
  getRequestCategoryLabel,
} from "../utils/requestDisplay";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { AppLocation } from "@/features/location/types/location.types";
import { getDistanceToRequest } from "@/utils/distance";
import { getUrgentTimeRemainingLabel, isUrgentRequestActive } from "../utils/urgent";
import { RequestPhotoCarousel } from "./RequestPhotoCarousel";

type Props = {
  request: HelpRequest;
  userLocation?: AppLocation | null;
  onPress?: () => void;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  primaryActionDisabled?: boolean;
  secondaryActionDisabled?: boolean;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  showFavoriteAction?: boolean;
  favoriteActionLabel?: string;
  showBidAction?: boolean;
  bidActionLabel?: string;
  bidActionDisabled?: boolean;
  onBidAction?: () => void;
  footer?: React.ReactNode;
};

export const RequestCard = ({
  request,
  userLocation,
  onPress,
  primaryActionLabel,
  secondaryActionLabel,
  primaryActionDisabled,
  secondaryActionDisabled,
  onPrimaryAction,
  onSecondaryAction,
  showFavoriteAction = false,
  favoriteActionLabel = "Save",
  showBidAction = false,
  bidActionLabel = "Submit Bid",
  bidActionDisabled = false,
  onBidAction,
  footer,
}: Props) => {
  const { palette } = useThemeContext();
  const { isFavorite, toggleFavorite, actionLoadingById } = useFavorites();
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const favoriteLoading = Boolean(actionLoadingById[request.id]);
  const favorited = isFavorite(request.id);

  const previewImages = useMemo<PreviewImageItem[]>(
    () =>
      (request.images ?? [])
        .map((image) => ({ uri: image.url }))
        .filter((image) => Boolean(image.uri)),
    [request.images]
  );

  const distance =
    userLocation &&
    request.location &&
    userLocation.latitude != null &&
    userLocation.longitude != null &&
    request.location.latitude != null &&
    request.location.longitude != null
      ? getDistanceToRequest(
          userLocation.latitude,
          userLocation.longitude,
          request.location.latitude,
          request.location.longitude
        )
      : null;

  const title = request.title?.trim() || "Untitled request";
  const description = request.description?.trim() || "No description provided.";
  const location = formatRequestLocation(request);
  const createdAt = formatRequestCreatedAt(request.createdAt);
  const budget = formatRequestBudget(request);
  const categoryLabel = getRequestCategoryLabel(request);
  const bidCount = request.bidCount ?? 0;
  const isUnpaid = !request.isPaid;
  const isUrgentActive = request.status === "OPEN" && isUrgentRequestActive(request);

  const infoEntries = [
    { icon: "location-outline" as const, value: location, highlight: false },
    { icon: "time-outline" as const, value: createdAt, highlight: false },
    { icon: "wallet-outline" as const, value: budget, highlight: true },
    {
      icon: "chatbubble-ellipses-outline" as const,
      value: `${bidCount} bid${bidCount === 1 ? "" : "s"}`,
      highlight: false,
    },
  ];

  const handlePrimaryAction = (event?: GestureResponderEvent) => {
    event?.stopPropagation();
    onPrimaryAction?.();
  };

  const handleSecondaryAction = (event?: GestureResponderEvent) => {
    event?.stopPropagation();
    onSecondaryAction?.();
  };

  const handleFavoriteToggle = (event?: GestureResponderEvent) => {
    event?.stopPropagation();
    void toggleFavorite(request);
  };

  const handleBidAction = (event?: GestureResponderEvent) => {
    event?.stopPropagation();
    onBidAction?.();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`Request: ${title}`}
      style={({ pressed }) => [styles.pressable, pressed && onPress ? styles.pressed : null]}
    >
      <Card
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: isUrgentActive ? `${palette.danger}66` : "transparent",
            shadowColor: "#142312",
            borderWidth: isUrgentActive ? 1 : 0,
          },
        ]}
      >
        <Stack gap="sm">
          <Row justify="space-between" align="flex-start" gap="sm">
            <View style={styles.titleWrap}>
              <Text numberOfLines={2} style={[styles.title, { color: palette.textPrimary }]}> 
                {title}
              </Text>
            </View>

            <RequestStatusBadge status={request.status} urgent={isUrgentActive} />
          </Row>

          {isUrgentActive ? (
            <View style={[styles.urgentPill, { backgroundColor: `${palette.danger}16`, borderColor: `${palette.danger}44` }]}>
              <Ionicons name="alert-circle" size={13} color={palette.danger} />
              <Text style={[styles.urgentPillText, { color: palette.danger }]}>
                Urgent · {getUrgentTimeRemainingLabel(request.urgentExpiresAt)}
              </Text>
            </View>
          ) : null}

          <Row align="center" gap="xs" style={styles.pillRow}>
            <View style={[styles.categoryPill, { backgroundColor: palette.surfaceMuted }]}>
              <Text style={[styles.categoryText, { color: palette.textSecondary }]}>{categoryLabel}</Text>
            </View>

            <View style={[styles.metaPill, { backgroundColor: palette.surfaceMuted }]}>
              <Text style={[styles.metaPillText, { color: palette.textSecondary }]}>
                {bidCount} bid{bidCount === 1 ? "" : "s"}
              </Text>
            </View>

            {distance ? (
              <View style={[styles.metaPill, { backgroundColor: `${palette.primary}14` }]}>
                <Text style={[styles.metaPillText, { color: palette.primary }]}>{distance} away</Text>
              </View>
            ) : null}
          </Row>

          <Text numberOfLines={2} style={[styles.description, { color: palette.textSecondary }]}>
            {description}
          </Text>

          <View
            style={[
              styles.infoSection,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={[styles.infoSectionTitle, { color: palette.textPrimary }]}>Important info</Text>
            <View style={styles.infoGrid}>
              {infoEntries.map((entry) => (
                <View key={`${entry.icon}-${entry.value}`} style={styles.infoGridItem}>
                  <Ionicons
                    name={entry.icon}
                    size={14}
                    color={entry.highlight ? palette.primary : palette.textSecondary}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.infoGridText,
                      { color: entry.highlight ? palette.primary : palette.textSecondary },
                    ]}
                  >
                    {entry.highlight && isUnpaid ? entry.value.toUpperCase() : entry.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.carouselWrap}>
            <RequestPhotoCarousel
              images={request.images ?? []}
              height={172}
              onPressImage={(index) => setPreviewIndex(index)}
            />
          </View>

          <Row align="center" gap="sm">
            <ProfileAvatar uri={request.requesterAvatarUrl} fullName={request.requesterName} size={38} />
            <View style={styles.posterMetaWrap}>
              <Text numberOfLines={1} style={[styles.posterName, { color: palette.textPrimary }]}>
                {request.requesterName || "Community member"}
              </Text>
              {typeof (request as HelpRequest & { requesterRating?: number }).requesterRating === "number" ? (
                <Row align="center" gap="xs">
                  <Ionicons name="star" size={12} color={palette.accent} />
                  <Text style={[styles.posterSubline, { color: palette.textSecondary }]}>
                    {(request as HelpRequest & { requesterRating: number }).requesterRating.toFixed(1)}
                  </Text>
                </Row>
              ) : (
                <Text style={[styles.posterSubline, { color: palette.textSecondary }]}>Community member</Text>
              )}
            </View>
          </Row>

          {(primaryActionLabel || secondaryActionLabel) && (
            <Row gap="sm" style={styles.actionRow}>
              {secondaryActionLabel ? (
                <AppButton
                  title={secondaryActionLabel}
                  onPress={handleSecondaryAction}
                  variant="secondary"
                  fullWidth={false}
                  disabled={secondaryActionDisabled}
                />
              ) : null}

              {primaryActionLabel ? (
                <AppButton
                  title={primaryActionLabel}
                  onPress={handlePrimaryAction}
                  variant="primary"
                  fullWidth={false}
                  disabled={primaryActionDisabled}
                />
              ) : null}
            </Row>
          )}

          {(showBidAction || showFavoriteAction) && (
            <Row gap="sm" justify="flex-end" style={styles.quickActionRow}>
              {showBidAction ? (
                <AppButton
                  title={bidActionLabel}
                  onPress={handleBidAction}
                  variant="primary"
                  fullWidth={false}
                  disabled={bidActionDisabled}
                  icon={<Ionicons name="cash-outline" size={16} color={palette.textInverse} />}
                />
              ) : null}

              {showFavoriteAction ? (
                <AppButton
                  title={favorited ? "Saved" : favoriteActionLabel}
                  onPress={handleFavoriteToggle}
                  variant="secondary"
                  fullWidth={false}
                  disabled={favoriteLoading}
                  loading={favoriteLoading}
                  icon={
                    !favoriteLoading ? (
                      <Ionicons
                        name={favorited ? "heart" : "heart-outline"}
                        size={16}
                        color={palette.textPrimary}
                      />
                    ) : undefined
                  }
                />
              ) : null}
            </Row>
          )}

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Stack>
      </Card>

      <ImagePreviewModal
        visible={previewIndex !== null}
        images={previewImages}
        initialIndex={previewIndex ?? 0}
        title={title}
        onClose={() => setPreviewIndex(null)}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    width: "100%",
  },
  urgentPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  urgentPillText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  pressed: {
    opacity: 0.98,
    transform: [{ scale: 0.97 }],
  },
  card: {
    borderWidth: 0,
    borderRadius: 20,
    padding: 14,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  titleWrap: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  pillRow: {
    flexWrap: "wrap",
  },
  categoryPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.fill,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.medium,
  },
  description: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 20,
  },
  infoSection: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: 8,
  },
  infoSectionTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoGridItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoGridText: {
    flex: 1,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  carouselWrap: {
    marginTop: theme.spacing.xxs,
    marginBottom: theme.spacing.xxs,
  },
  posterMetaWrap: {
    flex: 1,
    minWidth: 0,
  },
  posterName: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  posterSubline: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.xs,
  },
  metaPill: {
    borderRadius: theme.radius.fill,
    paddingHorizontal: 9,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  actionRow: {
    flexWrap: "wrap",
  },
  quickActionRow: {
    flexWrap: "wrap",
    marginTop: theme.spacing.xxs,
  },
  footer: {
    marginTop: theme.spacing.xxs,
  },
});
