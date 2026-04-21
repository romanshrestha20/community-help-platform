import React, { useMemo, useState } from "react";
import {
  GestureResponderEvent,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
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

  const imagePreviews = request.images?.slice(0, 3) ?? [];
  const extraImageCount = Math.max((request.images?.length ?? 0) - imagePreviews.length, 0);
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

  const openPreview = (index: number) => {
    setPreviewIndex(index);
  };

  const closePreview = () => {
    setPreviewIndex(null);
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`Request: ${title}`}
      style={({ pressed }) => [
        styles.pressable,
        pressed && onPress ? styles.pressed : null,
      ]}
    >
      <Card
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: "transparent",
            shadowColor: "#142312",
          },
        ]}
      >
        <Stack gap="sm">
          <Row justify="space-between" align="flex-start" gap="sm">
            <View style={styles.titleWrap}>
              <Text
                numberOfLines={2}
                style={[styles.title, { color: palette.textPrimary }]}
              >
                {title}
              </Text>
            </View>

            <RequestStatusBadge status={request.status} />
          </Row>

          <Row align="center" gap="xs" style={styles.pillRow}>
            <View
              style={[
                styles.categoryPill,
                { backgroundColor: palette.surfaceMuted },
              ]}
            >
              <Text style={[styles.categoryText, { color: palette.textSecondary }]}>
                {categoryLabel}
              </Text>
            </View>

            <View
              style={[
                styles.metaPill,
                { backgroundColor: palette.surfaceMuted },
              ]}
            >
              <Text style={[styles.metaPillText, { color: palette.textSecondary }]}>
                {bidCount} bid{bidCount === 1 ? "" : "s"}
              </Text>
            </View>

            {distance ? (
              <View
                style={[
                  styles.metaPill,
                  { backgroundColor: `${palette.primary}14` },
                ]}
              >
                <Text style={[styles.metaPillText, { color: palette.primary }]}>
                  {distance} away
                </Text>
              </View>
            ) : null}
          </Row>

          <Text
            style={[
              styles.budget,
              { color: palette.primary },
            ]}
          >
            {isUnpaid ? budget.toUpperCase() : budget}
          </Text>

          <Text
            numberOfLines={2}
            style={[styles.description, { color: palette.textSecondary }]}
          >
            {description}
          </Text>




          {imagePreviews.length > 0 ? (
            imagePreviews.length === 1 ? (
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  openPreview(0);
                }}
                style={styles.singleImageWrapper}
              >
                <Image
                  source={{ uri: imagePreviews[0].url }}
                  style={[styles.singleImage, { backgroundColor: palette.surfaceMuted }]}
                  resizeMode="cover"
                />
              </Pressable>
            ) : imagePreviews.length === 2 ? (
              <View style={styles.imageRow}>
                {imagePreviews.map((image, index) => (
                  <Pressable
                    key={image.id}
                    onPress={(event) => {
                      event.stopPropagation();
                      openPreview(index);
                    }}
                    style={styles.imageWrapper}
                  >
                    <Image
                      source={{ uri: image.url }}
                      style={[styles.thumbnail, { backgroundColor: palette.surfaceMuted }]}
                      resizeMode="cover"
                    />
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.imageCollage}>
                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();
                    openPreview(0);
                  }}
                  style={styles.collagePrimary}
                >
                  <Image
                    source={{ uri: imagePreviews[0].url }}
                    style={[styles.collagePrimaryImage, { backgroundColor: palette.surfaceMuted }]}
                    resizeMode="cover"
                  />
                </Pressable>

                <View style={styles.collageSecondaryColumn}>
                  {imagePreviews.slice(1).map((image, index) => {
                    const previewIndexOffset = index + 1;
                    const isLastPreview = previewIndexOffset === imagePreviews.length - 1;
                    const showOverflowBadge = isLastPreview && extraImageCount > 0;

                    return (
                      <Pressable
                        key={image.id}
                        onPress={(event) => {
                          event.stopPropagation();
                          openPreview(previewIndexOffset);
                        }}
                        style={styles.collageSecondary}
                      >
                        <Image
                          source={{ uri: image.url }}
                          style={[styles.collageSecondaryImage, { backgroundColor: palette.surfaceMuted }]}
                          resizeMode="cover"
                        />
                        {showOverflowBadge ? (
                          <View
                            style={[
                              styles.imageOverlay,
                              { backgroundColor: "rgba(0,0,0,0.35)" },
                            ]}
                          >
                            <Text style={styles.imageOverlayText}>+{extraImageCount}</Text>
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )
          ) : null}

          <Row align="center" gap="sm">
            <ProfileAvatar
              uri={request.requesterAvatarUrl}
              fullName={request.requesterName}
              size={38}
            />
            <View style={styles.posterMetaWrap}>
              <Text
                numberOfLines={1}
                style={[styles.posterName, { color: palette.textPrimary }]}
              >
                {request.requesterName || "Community member"}
              </Text>
              {typeof (request as HelpRequest & { requesterRating?: number }).requesterRating === "number" ? (
                <Row align="center" gap="xs">
                  <Ionicons name="star" size={12} color={palette.accent} />
                  <Text
                    style={[styles.posterSubline, { color: palette.textSecondary }]}
                  >
                    {(request as HelpRequest & { requesterRating: number }).requesterRating.toFixed(1)}
                  </Text>
                </Row>
              ) : (
                <Text style={[styles.posterSubline, { color: palette.textSecondary }]}>
                  Community member
                </Text>
              )}
            </View>
          </Row>
          <View style={styles.metaList}>
            <Row align="center" gap="xs">
              <Ionicons
                name="location-outline"
                size={15}
                color={palette.textSecondary}
              />
              <Text
                numberOfLines={1}
                style={[styles.metaText, styles.metaFlex, { color: palette.textSecondary }]}
              >
                {location}
              </Text>
            </Row>

            <Row align="center" gap="xs">
              <Ionicons
                name="time-outline"
                size={15}
                color={palette.textSecondary}
              />
              <Text style={[styles.metaText, { color: palette.textSecondary }]}>
                {createdAt}
              </Text>
            </Row>
          </View>

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
                  icon={
                    <Ionicons
                      name="cash-outline"
                      size={16}
                      color={palette.textInverse}
                    />
                  }
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
        onClose={closePreview}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    width: "100%",
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
  budget: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: 26,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 20,
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
  imageRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  imageCollage: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    height: 156,
  },
  singleImageWrapper: {
    borderRadius: 18,
    overflow: "hidden",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  singleImage: {
    width: "100%",
    height: 172,
    borderRadius: 18,
  },
  imageWrapper: {
    position: "relative",
    flex: 1,
    overflow: "hidden",
    borderRadius: theme.radius.md,
  },
  collagePrimary: {
    flex: 1.35,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
  },
  collagePrimaryImage: {
    width: "100%",
    height: "100%",
    borderRadius: theme.radius.lg,
  },
  collageSecondaryColumn: {
    flex: 0.9,
    gap: 6,
  },
  collageSecondary: {
    flex: 1,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    position: "relative",
  },
  collageSecondaryImage: {
    width: "100%",
    height: "100%",
    borderRadius: theme.radius.md,
  },
  thumbnail: {
    width: "100%",
    height: 116,
    borderRadius: theme.radius.md,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.md,
  },
  imageOverlayText: {
    color: "#FFFFFF",
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  metaList: {
    gap: 6,
  },
  metaFlex: {
    flex: 1,
  },
  metaText: {
    fontSize: 11,
    lineHeight: 15,
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
