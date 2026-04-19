import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";
import { HelpRequest } from "@/features/helpRequest/types/helpRequest.types";
import {
  formatRequestBudget,
  getRequestCategoryLabel,
} from "@/features/helpRequest/utils/requestDisplay";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = {
  request: HelpRequest;
  userDistance: string | null;
  postedLabel: string;
  onPress: () => void;
};

export function HomeCompactRequestCard({
  request,
  userDistance,
  postedLabel,
  onPress,
}: Props) {
  const { palette } = useThemeContext();
  const categoryLabel = getRequestCategoryLabel(request);
  const isOpen = request.status === "OPEN";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.requestCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          shadowColor: palette.shadow,
          opacity: pressed ? 0.97 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.requestCardAccent,
          {
            backgroundColor: isOpen ? palette.primary : palette.warning,
          },
        ]}
      />

      <View style={styles.requestCardTop}>
        <View
          style={[
            styles.categoryBadge,
            {
              backgroundColor: palette.surfaceMuted,
            },
          ]}
        >
          <Text style={[styles.categoryBadgeText, { color: palette.textSecondary }]}>
            {categoryLabel}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isOpen ? palette.successSurface : palette.warningSoft,
            },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              { color: isOpen ? palette.primary : palette.warning },
            ]}
          >
            {isOpen ? "Open" : "Assigned"}
          </Text>
        </View>
      </View>

      <Text style={[styles.requestTitle, { color: palette.textPrimary }]} numberOfLines={2}>
        {request.title}
      </Text>

      <View style={styles.requestMetaRow}>
        <View style={styles.requestMetaItem}>
          <Ionicons name="location-outline" size={16} color={palette.textMuted} />
          <Text style={[styles.requestMetaText, { color: palette.textSecondary }]}>
            {userDistance ?? "Nearby"}
          </Text>
        </View>

        <View style={styles.requestMetaItem}>
          <Ionicons name="time-outline" size={16} color={palette.textMuted} />
          <Text style={[styles.requestMetaText, { color: palette.textSecondary }]}>
            {postedLabel}
          </Text>
        </View>

        <Text style={[styles.requestBudget, { color: palette.primary }]}>
          {formatRequestBudget(request)}
        </Text>
      </View>

      <View style={[styles.requestDivider, { backgroundColor: palette.border }]} />

      <View style={styles.requestBottom}>
        <View style={styles.requestOwner}>
          <ProfileAvatar
            uri={request.requesterAvatarUrl}
            fullName={request.requesterName}
            size={36}
          />
          <Text style={[styles.requestOwnerName, { color: palette.textPrimary }]}>
            {request.requesterName || "Community member"}
          </Text>
        </View>

        <View
          style={[
            styles.bidsPill,
            {
              backgroundColor: palette.background,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={[styles.bidsPillText, { color: palette.textSecondary }]}>
            {request.bidCount} bid{request.bidCount === 1 ? "" : "s"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  requestCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: theme.spacing.lg,
    overflow: "hidden",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  requestCardAccent: {
    position: "absolute",
    left: 0,
    top: 18,
    bottom: 18,
    width: 5,
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
  },
  requestCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  categoryBadge: {
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  statusBadge: {
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  requestTitle: {
    fontSize: 19,
    lineHeight: 28,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  requestMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: 14,
    rowGap: 6,
  },
  requestMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
  },
  requestMetaText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  requestBudget: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  requestDivider: {
    height: 1,
    marginTop: 16,
    marginBottom: 14,
  },
  requestBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  requestOwner: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: theme.spacing.sm,
    flex: 1,
  },
  requestOwnerName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  bidsPill: {
    minHeight: 34,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bidsPillText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
