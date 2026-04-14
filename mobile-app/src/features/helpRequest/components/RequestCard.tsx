import React from "react";
import {
  GestureResponderEvent,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Card, Row, Stack, theme } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useFavorites } from "@/features/favorites/hooks/favorite.hook";
import { HelpRequest } from "../types/helpRequest.types";
import {
  formatRequestBudget,
  formatRequestCreatedAt,
  formatRequestLocation,
  REQUEST_CATEGORY_LABELS,
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
  footer,
}: Props) => {
  const { palette } = useThemeContext();
  const { isFavorite, toggleFavorite, actionLoadingById } = useFavorites();

  const imagePreviews = request.images?.slice(0, 3) ?? [];
  const extraImageCount = Math.max((request.images?.length ?? 0) - imagePreviews.length, 0);
  const favoriteLoading = Boolean(actionLoadingById[request.id]);
  const favorited = isFavorite(request.id);

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
  const categoryLabel = REQUEST_CATEGORY_LABELS[request.category] ?? request.category;
  const bidCount = request.bidCount ?? 0;

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
            borderColor: palette.border,
          },
        ]}
      >
        <Stack gap="md">
          <Row justify="space-between" align="flex-start">
            <View style={styles.headerContent}>
              <Text
                numberOfLines={2}
                style={[styles.title, { color: palette.textPrimary }]}
              >
                {title}
              </Text>

              <View style={[styles.categoryPill, { backgroundColor: palette.surfaceMuted }]}>
                <Text style={[styles.categoryText, { color: palette.textSecondary }]}>
                  {categoryLabel}
                </Text>
              </View>
            </View>

            <RequestStatusBadge status={request.status} />
          </Row>

          <Row justify="space-between" align="center">
            <Text style={[styles.budget, { color: palette.primary }]}>{budget}</Text>
            <Text style={[styles.bidCount, { color: palette.textSecondary }]}>
              {bidCount} bid{bidCount === 1 ? "" : "s"}
            </Text>
          </Row>

          <Text
            numberOfLines={2}
            style={[styles.description, { color: palette.textSecondary }]}
          >
            {description}
          </Text>

          {imagePreviews.length > 0 ? (
            <View style={styles.imageRow}>
              {imagePreviews.map((image, index) => {
                const isLastPreview = index === imagePreviews.length - 1;
                const showOverflowBadge = isLastPreview && extraImageCount > 0;

                return (
                  <View key={image.id} style={styles.imageWrapper}>
                    <Image
                      source={{ uri: image.url }}
                      style={[
                        styles.thumbnail,
                        { backgroundColor: palette.surfaceMuted },
                      ]}
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
                  </View>
                );
              })}
            </View>
          ) : null}

          <View style={styles.metaList}>
            <Row align="center" gap="xs">
              <Ionicons name="location-outline" size={16} color={palette.textSecondary} />
              <Text
                numberOfLines={1}
                style={[styles.metaText, styles.metaFlex, { color: palette.textSecondary }]}
              >
                {location}
              </Text>
            </Row>

            <Row align="center" gap="md">
              {distance ? (
                <Row align="center" gap="xs">
                  <Ionicons name="navigate-outline" size={16} color={palette.primary} />
                  <Text style={[styles.metaText, { color: palette.primary }]}>
                    {distance}
                  </Text>
                </Row>
              ) : null}

              <Row align="center" gap="xs">
                <Ionicons name="time-outline" size={16} color={palette.textSecondary} />
                <Text style={[styles.metaText, { color: palette.textSecondary }]}>
                  {createdAt}
                </Text>
              </Row>
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
              <AppButton
                title={favorited ? "Saved" : "Save"}
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

            </Row>
          )}

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Stack>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    width: "100%",
  },
  pressed: {
    opacity: 0.96,
    transform: [{ scale: 0.995 }],
  },
  card: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  headerContent: {
    flex: 1,
    paddingRight: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  categoryPill: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.fill,
  },
  categoryText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  budget: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  bidCount: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
  imageRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  imageWrapper: {
    position: "relative",
    flex: 1,
    overflow: "hidden",
    borderRadius: theme.radius.md,
  },
  thumbnail: {
    width: "100%",
    height: 88,
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
    gap: theme.spacing.sm,
  },
  metaFlex: {
    flex: 1,
  },
  metaText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  actionRow: {
    flexWrap: "wrap",
  },
  footer: {
    marginTop: theme.spacing.xxs,
  },
});
