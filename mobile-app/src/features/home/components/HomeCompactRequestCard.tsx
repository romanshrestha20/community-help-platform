import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";
import { HelpRequest } from "@/features/helpRequest/types/helpRequest.types";
import {
  formatRequestBudget,
  getRequestCategoryLabel,
} from "@/features/helpRequest/utils/requestDisplay";
import {
  getUrgentTimeRemainingLabel,
  isUrgentRequestActive,
} from "@/features/helpRequest/utils/urgent";

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
  const isUrgentActive = isUrgentRequestActive(request);
  const imagePreviews = request.images?.slice(0, 3) ?? [];
  const extraImageCount = Math.max((request.images?.length ?? 0) - imagePreviews.length, 0);

  const accentColor = isUrgentActive
    ? palette.danger
    : isOpen
      ? palette.primary
      : palette.warning;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: isUrgentActive ? `${palette.danger}55` : palette.border,
          shadowColor: palette.shadow,
          opacity: pressed ? 0.96 : 1,
          transform: [{ scale: pressed ? 0.995 : 1 }],
        },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={styles.header}>
        <View
          style={[
            styles.categoryPill,
            { backgroundColor: palette.surfaceMuted },
          ]}
        >
          <Text
            style={[
              styles.categoryText,
              { color: palette.textSecondary },
            ]}
            numberOfLines={1}
          >
            {categoryLabel}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {isUrgentActive ? (
            <View
              style={[
                styles.urgentPill,
                { backgroundColor: `${palette.danger}16` },
              ]}
            >
              <Ionicons name="flash" size={13} color={palette.danger} />
              <Text style={[styles.urgentText, { color: palette.danger }]}>
                {getUrgentTimeRemainingLabel(request.urgentExpiresAt)}
              </Text>
            </View>
          ) : null}

          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: isOpen
                  ? palette.successSurface
                  : palette.warningSoft,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isOpen ? palette.primary : palette.warning,
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isOpen ? palette.primary : palette.warning },
              ]}
            >
              {isOpen ? "Open" : "Assigned"}
            </Text>
          </View>
        </View>
      </View>

      <Text
        style={[styles.title, { color: palette.textPrimary }]}
        numberOfLines={2}
      >
        {request.title}
      </Text>

      {imagePreviews.length > 0 ? (
        imagePreviews.length === 1 ? (
          <View style={styles.singleImageWrap}>
            <Image
              source={{ uri: imagePreviews[0].url }}
              style={[styles.singleImage, { backgroundColor: palette.surfaceMuted }]}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View style={styles.mediaRow}>
            {imagePreviews.slice(0, 2).map((image, index) => {
              const showOverflow = index === 1 && extraImageCount > 0;
              return (
                <View key={image.id} style={styles.mediaThumbWrap}>
                  <Image
                    source={{ uri: image.url }}
                    style={[styles.mediaThumb, { backgroundColor: palette.surfaceMuted }]}
                    resizeMode="cover"
                  />
                  {showOverflow ? (
                    <View style={styles.mediaOverlay}>
                      <Text style={styles.mediaOverlayText}>+{extraImageCount}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )
      ) : null}

      <View style={styles.infoRow}>
        <InfoItem
          icon="location-outline"
          label={userDistance ?? "Nearby"}
          color={palette.textSecondary}
          iconColor={palette.textMuted}
        />

        <InfoItem
          icon="time-outline"
          label={postedLabel}
          color={palette.textSecondary}
          iconColor={palette.textMuted}
        />

        <View style={[styles.budgetBox, { backgroundColor: `${palette.primary}12` }]}>
          <Text style={[styles.budgetLabel, { color: palette.textSecondary }]}>
            Budget
          </Text>
          <Text style={[styles.budgetValue, { color: palette.primary }]}>
            {formatRequestBudget(request)}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: palette.border }]} />

      <View style={styles.footer}>
        <View style={styles.owner}>
          <ProfileAvatar
            uri={request.requesterAvatarUrl}
            fullName={request.requesterName}
            size={38}
          />

          <View style={styles.ownerTextWrap}>
            <Text
              style={[styles.ownerName, { color: palette.textPrimary }]}
              numberOfLines={1}
            >
              {request.requesterName || "Community member"}
            </Text>

            <Text style={[styles.ownerSubtext, { color: palette.textMuted }]}>
              Request owner
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.bidPill,
            {
              backgroundColor: palette.background,
              borderColor: palette.border,
            },
          ]}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={14}
            color={palette.textSecondary}
          />
          <Text style={[styles.bidText, { color: palette.textSecondary }]}>
            {request.bidCount} bid{request.bidCount === 1 ? "" : "s"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

type InfoItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  iconColor: string;
};

function InfoItem({ icon, label, color, iconColor }: InfoItemProps) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={15} color={iconColor} />
      <Text style={[styles.infoText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    borderWidth: 1,
    borderRadius: 24,
    padding: theme.spacing.lg,
    overflow: "hidden",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },

  headerRight: {
    alignItems: "flex-end",
    gap: 6,
    flexShrink: 0,
  },

  categoryPill: {
    minHeight: 32,
    maxWidth: "52%",
    borderRadius: 999,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  urgentPill: {
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  urgentText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },

  statusPill: {
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },

  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },

  title: {
    fontSize: 19,
    lineHeight: 27,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: -0.35,
    marginBottom: theme.spacing.md,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
    flexWrap: "wrap",
  },
  singleImageWrap: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: theme.spacing.md,
  },
  singleImage: {
    width: "100%",
    height: 136,
  },
  mediaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  mediaThumbWrap: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  mediaThumb: {
    width: "100%",
    height: 96,
  },
  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.34)",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaOverlayText: {
    color: "#FFFFFF",
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },

  infoItem: {
    minHeight: 36,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 1,
  },

  infoText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },

  budgetBox: {
    marginLeft: "auto",
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  budgetLabel: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: 1,
  },

  budgetValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },

  divider: {
    height: 1,
    marginVertical: theme.spacing.md,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },

  owner: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flex: 1,
    minWidth: 0,
  },

  ownerTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  ownerName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  ownerSubtext: {
    marginTop: 2,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },

  bidPill: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  bidText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
