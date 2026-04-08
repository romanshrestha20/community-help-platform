import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Card, Row, Stack, theme } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { HelpRequest } from "../types/helpRequest.types";
import {
  formatRequestBudget,
  formatRequestCreatedAt,
  formatRequestLocation,
  REQUEST_CATEGORY_LABELS,
} from "../utils/requestDisplay";
import { RequestStatusBadge } from "./RequestStatusBadge";

type Props = {
  request: HelpRequest;
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
  const imagePreviews = request.images?.slice(0, 3) ?? [];
  const extraImageCount = Math.max((request.images?.length ?? 0) - imagePreviews.length, 0);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
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
              <Text style={[styles.title, { color: palette.textPrimary }]}>
                {request.title}
              </Text>

              <Text style={[styles.category, { color: palette.textSecondary }]}>
                {REQUEST_CATEGORY_LABELS[request.category] ?? request.category}
              </Text>
            </View>

            <RequestStatusBadge status={request.status} />
          </Row>

          <Text
            numberOfLines={3}
            style={[styles.description, { color: palette.textSecondary }]}
          >
            {request.description}
          </Text>

          {imagePreviews.length ? (
            <View style={styles.imageRow}>
              {imagePreviews.map((image, index) => {
                const isLastPreview = index === imagePreviews.length - 1;
                const showOverflowBadge = isLastPreview && extraImageCount > 0;

                return (
                  <View key={image.id} style={styles.imageWrapper}>
                    <Image
                      source={{ uri: image.url }}
                      style={[styles.thumbnail, { backgroundColor: palette.surfaceMuted }]}
                    />

                    {showOverflowBadge ? (
                      <View
                        style={[
                          styles.imageOverflowBadge,
                          { backgroundColor: palette.surfaceMuted },
                        ]}
                      >
                        <Text style={[styles.imageOverflowText, { color: palette.textPrimary }]}>+{extraImageCount}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : null}

          <View
            style={[
              styles.metaSection,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
              },
            ]}
          >
            <Row justify="space-between">
              <Text style={[styles.price, { color: palette.primary }]}>
                {formatRequestBudget(request)}
              </Text>

              <Text style={[styles.meta, { color: palette.textSecondary }]}>
                {request.bidCount} bid{request.bidCount === 1 ? "" : "s"}
              </Text>
            </Row>

            <Row justify="space-between">
              <Text
                numberOfLines={1}
                style={[styles.meta, styles.location, { color: palette.textSecondary }]}
              >
                {formatRequestLocation(request)}
              </Text>

              <Text style={[styles.meta, { color: palette.textSecondary }]}>
                {formatRequestCreatedAt(request.createdAt)}
              </Text>
            </Row>
          </View>

          {primaryActionLabel || secondaryActionLabel ? (
            <Row gap="sm">
              {secondaryActionLabel ? (
                <AppButton
                  title={secondaryActionLabel}
                  onPress={onSecondaryAction ?? (() => {})}
                  variant="secondary"
                  fullWidth={false}
                  disabled={secondaryActionDisabled}
                />
              ) : null}

              {primaryActionLabel ? (
                <AppButton
                  title={primaryActionLabel}
                  onPress={onPrimaryAction ?? (() => {})}
                  variant="ghost"
                  fullWidth={false}
                  disabled={primaryActionDisabled}
                />
              ) : null}
            </Row>
          ) : null}

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
  },
  card: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  headerContent: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  category: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  imageRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    flexWrap: "wrap",
  },
  imageWrapper: {
    position: "relative",
  },
  thumbnail: {
    width: 74,
    height: 74,
    borderRadius: theme.radius.md,
  },
  imageOverflowBadge: {
    position: "absolute",
    inset: 0,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.92,
  },
  imageOverflowText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  metaSection: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  price: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  meta: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  location: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  footer: {
    marginTop: theme.spacing.xxs,
  },
});