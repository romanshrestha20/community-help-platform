import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { BidStatus } from "../types/bid.types";
import { BID_STATUS_LABELS } from "../utils/bidDisplay";

type Props = {
  status: BidStatus;
};

export const BidStatusBadge = ({ status }: Props) => {
  const { palette } = useThemeContext();

  const tone = {
    PENDING: {
      backgroundColor: palette.surfaceMuted,
      textColor: palette.textSecondary,
    },
    ACCEPTED: {
      backgroundColor: `${palette.success}15`,
      textColor: palette.success,
    },
    REJECTED: {
      backgroundColor: palette.dangerSoft,
      textColor: palette.danger,
    },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: tone.backgroundColor }]}>
      <Text style={[styles.text, { color: tone.textColor }]}>
        {BID_STATUS_LABELS[status]}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});