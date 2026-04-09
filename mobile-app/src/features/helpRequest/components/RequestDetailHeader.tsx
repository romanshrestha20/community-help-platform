import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { AppButton } from "@/components/ui/AppButton";
import { AppModal } from "@/components/ui/AppModal";
import { Card, Row, Stack } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";
import { HelpRequest } from "../types/helpRequest.types";
import {
  formatRequestBudget,
  REQUEST_CATEGORY_LABELS,
} from "../utils/requestDisplay";
import { getRelativePostedTime } from "../utils/requestTime";
import { RequestStatusBadge } from "./RequestStatusBadge";

type Props = {
  request: HelpRequest;
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

export const RequestDetailsHeader = ({ request }: Props) => {
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

  const categoryLabel =
    REQUEST_CATEGORY_LABELS[request.category] ?? request.category;

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

  return (
    <Card style={styles.card}>
      <Stack gap="md">
        <Row justify="space-between" align="center">
          <View style={[styles.categoryPill, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
            <Text style={[styles.categoryPillLabel, { color: palette.textSecondary }]}>{categoryLabel}</Text>
          </View>
          <RequestStatusBadge status={request.status} />
        </Row>

        <Text style={[styles.title, { color: palette.textPrimary }]}>{request.title}</Text>

        <View style={[styles.budgetPanel, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
          <Text style={[styles.budgetEyebrow, { color: palette.textSecondary }]}>Estimated budget</Text>
          <Text style={[styles.price, { color: palette.primary }]}>{budgetLabel}</Text>
          <Row justify="space-between" align="center" style={styles.bidRow}>
            <Text style={[styles.bidSummary, { color: palette.textPrimary }]}>{bidSummary}</Text>
            <Text style={[styles.bidSecondary, { color: palette.textSecondary }]}>{bidSecondary}</Text>
          </Row>
        </View>

        <View style={[styles.divider, { backgroundColor: palette.border }]} />

        <Row gap="sm" align="center" style={styles.posterRow}>
          <ProfileAvatar
            fullName={request.requesterName}
            size={46}
            onPress={() => setProfileModalVisible(true)}
          />
          <View style={styles.posterCopy}>
            <Text style={[styles.posterName, { color: palette.textPrimary }]}>Posted by {request.requesterName}</Text>
            <Text style={[styles.posterMeta, { color: palette.textSecondary }]}>Community member</Text>
            <Text style={[styles.posterHint, { color: palette.textSecondary }]}>Tap avatar to view profile</Text>
          </View>
        </Row>

        <Stack gap="sm">
          <View style={[styles.metaChip, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
            <Row gap="xs" align="center">
              <Ionicons name="location-outline" size={14} color={palette.textSecondary} />
              <Text style={[styles.metaText, { color: palette.textSecondary }]}>{locationLabel}</Text>
            </Row>
          </View>

          <View style={[styles.metaChip, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
            <Row gap="xs" align="center">
              <Ionicons name="time-outline" size={14} color={palette.textSecondary} />
              <Text style={[styles.metaText, { color: palette.textSecondary }]}>Posted {postedTime}</Text>
            </Row>
          </View>
        </Stack>

        <View style={[styles.descriptionPanel, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
          <Text style={[styles.sectionLabel, { color: palette.textPrimary }]}>What needs to be done</Text>

          <Stack gap="xs" style={styles.descriptionList}>
            {descriptionBullets.map((line, index) => (
              <Row key={`${line}-${index}`} gap="xs" align="flex-start" style={styles.descriptionRow}>
                <View style={[styles.bulletDot, { backgroundColor: palette.primary }]} />
                <Text style={[styles.descriptionItem, { color: palette.textSecondary }]}>{line}</Text>
              </Row>
            ))}
          </Stack>
        </View>
      </Stack>

      <AppModal
        visible={profileModalVisible}
        title="Requester Profile"
        onClose={() => setProfileModalVisible(false)}
        showCloseButton
        scrollable
        actions={(
          <AppButton
            title="Done"
            variant="ghost"
            fullWidth={false}
            onPress={() => setProfileModalVisible(false)}
          />
        )}
      >
        <View style={styles.profileAvatarWrap}>
          <ProfileAvatar fullName={request.requesterName} size={76} />
        </View>

        <Stack gap="xs">
          <View style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>Name</Text>
            <Text style={[styles.profileValue, { color: palette.textPrimary }]}>{request.requesterName}</Text>
          </View>

          <View style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>Role</Text>
            <Text style={[styles.profileValue, { color: palette.textPrimary }]}>Community member</Text>
          </View>

          <View style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>Location</Text>
            <Text style={[styles.profileValue, { color: palette.textPrimary }]}>{locationLabel}</Text>
          </View>

          <View style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>Request posted</Text>
            <Text style={[styles.profileValue, { color: palette.textPrimary }]}>{postedTime}</Text>
          </View>
        </Stack>
      </AppModal>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
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
  },
  budgetPanel: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    rowGap: 4,
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
    lineHeight: 38,
  },
  bidRow: {
    marginTop: 4,
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
  },
  posterRow: {
    marginTop: 2,
  },
  posterCopy: {
    flex: 1,
  },
  posterName: {
    fontSize: 15,
    fontWeight: "700",
  },
  posterMeta: {
    marginTop: 2,
    fontSize: 13,
  },
  posterHint: {
    marginTop: 3,
    fontSize: 12,
  },
  metaChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  metaText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  descriptionPanel: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  descriptionList: {
    marginTop: 8,
  },
  descriptionRow: {
    paddingRight: 8,
  },
  bulletDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    marginTop: 7,
  },
  descriptionItem: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  profileAvatarWrap: {
    alignItems: "center",
    marginBottom: 8,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
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