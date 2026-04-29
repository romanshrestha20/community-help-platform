import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { VerificationBadge } from "../types/user.types";

type Props = {
  badges?: VerificationBadge[] | null;
  compact?: boolean;
};

const getBadgeAppearance = (
  badge: VerificationBadge,
  palette: ReturnType<typeof useThemeContext>["palette"]
) => {
  if (badge.key === "PHONE_VERIFIED") {
    return {
      icon: "call-outline" as const,
      backgroundColor: palette.successSurface,
      borderColor: `${palette.success}33`,
      textColor: palette.success,
    };
  }

  if (badge.key === "ID_VERIFIED") {
    return {
      icon: "card-outline" as const,
      backgroundColor: palette.trustSoft,
      borderColor: `${palette.trust}33`,
      textColor: palette.trust,
    };
  }

  if (badge.key === "TOP_RATED_HELPER") {
    return {
      icon: "star-outline" as const,
      backgroundColor: palette.warningSoft ?? palette.surfaceMuted,
      borderColor: `${palette.warning}33`,
      textColor: palette.warning,
    };
  }

  return {
    icon: "shield-checkmark-outline" as const,
    backgroundColor: palette.trustSoft,
    borderColor: `${palette.trust}33`,
    textColor: palette.trust,
  };
};

export const VerificationBadgeList = ({ badges, compact = false }: Props) => {
  const { palette } = useThemeContext();

  if (!badges?.length) {
    return null;
  }

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {badges.map((badge) => {
        const appearance = getBadgeAppearance(badge, palette);

        return (
          <View
            key={badge.key}
            style={[
              styles.badge,
              compact && styles.badgeCompact,
              {
                backgroundColor: appearance.backgroundColor,
                borderColor: appearance.borderColor,
              },
            ]}
          >
            <Ionicons
              name={appearance.icon}
              size={compact ? 12 : 13}
              color={appearance.textColor}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.badgeText,
                compact && styles.badgeTextCompact,
                { color: appearance.textColor },
              ]}
            >
              {badge.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  wrapCompact: {
    gap: theme.spacing.xxs,
  },
  badge: {
    maxWidth: 168,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  badgeCompact: {
    maxWidth: 150,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 5,
  },
  badgeText: {
    flexShrink: 1,
    fontSize: theme.typography.fontSize.xs + 1,
    lineHeight: theme.typography.lineHeight.xs + 2,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  badgeTextCompact: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs + 1,
  },
});
