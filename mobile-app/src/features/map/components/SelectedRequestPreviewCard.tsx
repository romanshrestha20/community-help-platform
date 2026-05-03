import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { theme } from "@/design-system";
import { MapRequestItem } from "@/features/map/types/map.types";
import {
  formatRequestBudget,
  formatRequestLocation,
  getRequestCategoryLabel,
} from "@/features/helpRequest/utils/requestDisplay";
import { getRelativePostedTime } from "@/features/helpRequest/utils/requestTime";
import { isRequestOpenForBidding } from "@/features/helpRequest/utils/requestValidation";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { formatDistance } from "@/utils/distance";

type Props = {
  request: MapRequestItem;
  isOwner: boolean;
  onDetails: () => void;
  onPrimary: () => void;
};

export const SelectedRequestPreviewCard = ({
  request,
  isOwner,
  onDetails,
  onPrimary,
}: Props) => {
  const { palette } = useThemeContext();
  const isOpen = isRequestOpenForBidding(request.status);
  const canSubmitOffer = isOpen && !isOwner;

  const primaryLabel = isOwner
    ? request.status === "OPEN"
      ? "Edit"
      : "View request"
    : canSubmitOffer
      ? "Submit offer"
      : "View details";

  return (
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <Pressable onPress={onDetails} style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text numberOfLines={1} style={[styles.title, { color: palette.textPrimary }]}>
            {request.title}
          </Text>
          <Text style={[styles.meta, { color: palette.textSecondary }]}>
            {getRequestCategoryLabel(request)}
            {typeof request.distanceKm === "number" ? ` · ${formatDistance(request.distanceKm)} away` : ""}
          </Text>
        </View>
        <Text style={[styles.budget, { color: palette.primary }]}>
          {formatRequestBudget(request)}
        </Text>
      </Pressable>

      <Text numberOfLines={1} style={[styles.location, { color: palette.textSecondary }]}>
        {formatRequestLocation(request)}
      </Text>

      <Text style={[styles.aux, { color: palette.textMuted }]}>
        {getRelativePostedTime(request.createdAt)} · {request.bidCount} bid{request.bidCount === 1 ? "" : "s"}
      </Text>

      <View style={styles.actions}>
        <View style={styles.action}>
          <AppButton title="Details" variant="secondary" onPress={onDetails} />
        </View>
        <View style={styles.actionPrimary}>
          <AppButton title={primaryLabel} onPress={onPrimary} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  meta: {
    marginTop: 2,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  budget: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
  },
  location: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  aux: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  action: {
    flex: 1,
  },
  actionPrimary: {
    flex: 1.4,
  },
});

