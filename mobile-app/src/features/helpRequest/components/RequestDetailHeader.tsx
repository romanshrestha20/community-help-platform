import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { AppButton } from "@/components/ui/AppButton";
import { AppModal } from "@/components/ui/AppModal";
import { Card, Row, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";
import { HelpRequest } from "../types/helpRequest.types";
import {
  formatRequestBudget,
  getRequestCategoryLabel,
} from "../utils/requestDisplay";
import { getRelativePostedTime } from "../utils/requestTime";
import { RequestStatusBadge } from "./RequestStatusBadge";

type Props = {
  request: HelpRequest;
  isOwner?: boolean;
  actionContent?: React.ReactNode;
  stateLabel?: string;
  stateTitle?: string;
  stateDescription?: string;
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

  if (parts.length <= 1) {
    return [cleaned || description.trim()].filter(Boolean);
  }

  return parts;
};

export const RequestDetailsHeader = ({
  request,
  isOwner = false,
  actionContent,
  stateLabel,
  stateTitle,
  stateDescription,
}: Props) => {
  const { palette } = useThemeContext();
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const postedTime = useMemo(
    () => getRelativePostedTime(request.createdAt),
    [request.createdAt]
  );

  const descriptionBullets = useMemo(
    () => getDescriptionBullets(request.description),
    [request.description]
  );

  const categoryLabel = getRequestCategoryLabel(request);

  const locationLabel =
    request.location?.formattedAddress ||
    request.location?.addressLine1 ||
    [request.city, request.country].filter(Boolean).join(", ") ||
    "Location not provided";

  const bidSummary =
    request.bidCount === 0
      ? "No bids yet"
      : `${request.bidCount} bid${request.bidCount === 1 ? "" : "s"}`;

  const bidSecondary =
    request.status === "OPEN"
      ? request.bidCount === 0
        ? "Be the first to place a bid"
        : "Open for bids"
      : "Bidding closed";

  const budgetLabel = useMemo(() => formatRequestBudget(request), [request]);

  const showBottomZone = Boolean(stateTitle || actionContent);

  return (
    <Card style={styles.card}>
      <Stack gap="md">
        <Row justify="space-between" align="center" style={styles.topRow}>
          <View
            style={[
              styles.categoryPill,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
              },
            ]}
          >
            <Text
              style={[
                styles.categoryPillLabel,
                { color: palette.textSecondary },
              ]}
            >
              {categoryLabel}
            </Text>
          </View>

          <RequestStatusBadge status={request.status} />
        </Row>

        <Text style={[styles.title, { color: palette.textPrimary }]}>
          {request.title}
        </Text>

        <View
          style={[
            styles.budgetPanel,
            {
              backgroundColor: palette.surfaceMuted,
              borderColor: palette.border,
            },
          ]}
        >
          <Text
            style={[styles.budgetEyebrow, { color: palette.textSecondary }]}
          >
            Estimated budget
          </Text>

          <Text style={[styles.price, { color: palette.primary }]}>
            {budgetLabel}
          </Text>

          <View style={styles.bidRow}>
            {isOwner && request.status === "OPEN" ? (
              <Text style={[styles.bidSummary, { color: palette.textPrimary }]}>
                {bidSummary}
              </Text>
            ) : (
              <View />
            )}

            <Text style={[styles.bidSecondary, { color: palette.textSecondary }]}>
              {bidSecondary}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: palette.border }]} />

        <Pressable
          onPress={() => setProfileModalVisible(true)}
          style={({ pressed }) => [
            styles.posterRow,
            { opacity: pressed ? 0.82 : 1 },
          ]}
        >
          <ProfileAvatar
            uri={request.requesterAvatarUrl}
            fullName={request.requesterName}
            size={48}
          />

          <View style={styles.posterCopy}>
            <Text style={[styles.posterName, { color: palette.textPrimary }]}>
              Posted by {request.requesterName}
            </Text>
            <Text style={[styles.posterMeta, { color: palette.textSecondary }]}>
              Community member
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={palette.textSecondary}
          />
        </Pressable>

        <View style={styles.metaBlock}>
          <Row gap="xs" align="center" style={styles.metaRow}>
            <Ionicons
              name="location-outline"
              size={14}
              color={palette.textSecondary}
            />
            <Text style={[styles.metaText, { color: palette.textSecondary }]}>
              {locationLabel}
            </Text>
          </Row>

          <Row gap="xs" align="center" style={styles.metaRow}>
            <Ionicons
              name="time-outline"
              size={14}
              color={palette.textSecondary}
            />
            <Text style={[styles.metaText, { color: palette.textSecondary }]}>
              Posted {postedTime}
            </Text>
          </Row>
        </View>

        <View
          style={[
            styles.descriptionPanel,
            {
              backgroundColor: palette.surfaceMuted,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: palette.textPrimary }]}>
            What needs to be done
          </Text>

          <Stack gap="xs" style={styles.descriptionList}>
            {descriptionBullets.map((line, index) => (
              <Row
                key={`${line}-${index}`}
                gap="xs"
                align="flex-start"
                style={styles.descriptionRow}
              >
                <View
                  style={[
                    styles.bulletDot,
                    { backgroundColor: palette.primary },
                  ]}
                />
                <Text
                  style={[
                    styles.descriptionItem,
                    { color: palette.textSecondary },
                  ]}
                >
                  {line}
                </Text>
              </Row>
            ))}
          </Stack>
        </View>

        {showBottomZone ? (
          <View style={styles.bottomZone}>
            {stateTitle ? (
              <View
                style={[
                  styles.statePanel,
                  {
                    backgroundColor: palette.surfaceSecondary,
                    borderColor: palette.border,
                  },
                ]}
              >
                {stateLabel ? (
                  <Text style={[styles.stateLabel, { color: palette.primary }]}>
                    {stateLabel}
                  </Text>
                ) : null}

                <Text style={[styles.stateTitle, { color: palette.textPrimary }]}>
                  {stateTitle}
                </Text>

                {stateDescription ? (
                  <Text
                    style={[
                      styles.stateDescription,
                      { color: palette.textSecondary },
                    ]}
                  >
                    {stateDescription}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {actionContent ? (
              <View
                style={[
                  styles.actionDock,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                  },
                ]}
              >
                {actionContent}
              </View>
            ) : null}
          </View>
        ) : null}
      </Stack>

      <AppModal
        visible={profileModalVisible}
        title="Requester Profile"
        onClose={() => setProfileModalVisible(false)}
        showCloseButton
        scrollable
        actions={
          <AppButton
            title="Done"
            variant="ghost"
            fullWidth={false}
            onPress={() => setProfileModalVisible(false)}
          />
        }
      >
        <View style={styles.profileAvatarWrap}>
          <ProfileAvatar
            uri={request.requesterAvatarUrl}
            fullName={request.requesterName}
            size={76}
          />
        </View>

        <Stack gap="sm">
          <View style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>
              Name
            </Text>
            <Text style={[styles.profileValue, { color: palette.textPrimary }]}>
              {request.requesterName}
            </Text>
          </View>

          <View style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>
              Role
            </Text>
            <Text style={[styles.profileValue, { color: palette.textPrimary }]}>
              Community member
            </Text>
          </View>

          <View style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>
              Location
            </Text>
            <Text style={[styles.profileValue, { color: palette.textPrimary }]}>
              {request.requesterLocation || locationLabel}
            </Text>
          </View>

          <View style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>
              Request posted
            </Text>
            <Text style={[styles.profileValue, { color: palette.textPrimary }]}>
              {postedTime}
            </Text>
          </View>
        </Stack>
      </AppModal>
    </Card>
  );
};

const HALF_XXS = theme.spacing.xxs / 2;
const CHIP_PADDING_Y = theme.spacing.xxs + HALF_XXS;
const CHIP_PADDING_X = theme.spacing.xs + HALF_XXS;
const PANEL_RADIUS = theme.radius.lg + HALF_XXS;
const PANEL_PADDING_X = theme.spacing.sm + HALF_XXS;
const BULLET_SIZE = theme.spacing.xs - 1;
const BULLET_OFFSET_TOP = theme.spacing.xs - 1;

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    padding: theme.spacing.md,
  },

  topRow: {
    alignItems: "center",
  },

  categoryPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: CHIP_PADDING_Y,
    borderRadius: theme.radius.fill,
    borderWidth: 1,
    maxWidth: "72%",
  },
  categoryPillLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  title: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "800",
    marginTop: 2,
  },

  budgetPanel: {
    borderRadius: PANEL_RADIUS,
    borderWidth: 1,
    paddingHorizontal: PANEL_PADDING_X,
    paddingVertical: theme.spacing.md,
    rowGap: theme.spacing.xxs,
  },
  budgetEyebrow: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  price: {
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
    marginTop: 2,
  },
  bidRow: {
    marginTop: theme.spacing.xs,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.sm,
    flexWrap: "wrap",
  },
  bidSummary: {
    fontSize: 15,
    fontWeight: "700",
  },
  bidSecondary: {
    fontSize: 13,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    marginVertical: theme.spacing.xxs,
  },

  posterRow: {
    marginTop: HALF_XXS,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  posterCopy: {
    flex: 1,
  },
  posterName: {
    fontSize: 15,
    fontWeight: "700",
  },
  posterMeta: {
    marginTop: HALF_XXS,
    fontSize: 13,
  },

  metaBlock: {
    gap: theme.spacing.xs,
    marginTop: -2,
  },
  metaRow: {
    alignItems: "center",
  },
  metaText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  descriptionPanel: {
    borderWidth: 1,
    borderRadius: PANEL_RADIUS,
    paddingHorizontal: PANEL_PADDING_X,
    paddingVertical: theme.spacing.md,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  descriptionList: {
    marginTop: theme.spacing.sm,
  },
  descriptionRow: {
    paddingRight: theme.spacing.xs,
  },
  bulletDot: {
    width: BULLET_SIZE,
    height: BULLET_SIZE,
    borderRadius: theme.radius.fill,
    marginTop: BULLET_OFFSET_TOP,
  },
  descriptionItem: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },

  bottomZone: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  statePanel: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.xxs,
  },
  stateLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  stateDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },

  actionDock: {
    alignItems: "stretch",
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.sm,
  },

  profileAvatarWrap: {
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  profileLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  profileValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "600",
  },
});