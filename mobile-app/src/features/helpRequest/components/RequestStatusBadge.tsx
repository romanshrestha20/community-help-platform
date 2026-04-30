import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { HelpRequestStatus } from "../types/helpRequest.types";
import { REQUEST_STATUS_LABELS } from "../utils/requestDisplay";

type Props = {
  status: HelpRequestStatus;
  urgent?: boolean;
};

export const RequestStatusBadge = ({ status, urgent = false }: Props) => {
  const { palette } = useThemeContext();

  const tone = {
    OPEN: {
      backgroundColor: palette.surfaceMuted,
      textColor: palette.textSecondary,
    },
    ASSIGNED: {
      backgroundColor: `${palette.primary}15`,
      textColor: palette.primary,
    },
    COMPLETED: {
      backgroundColor: `${palette.success}15`,
      textColor: palette.success,
    },
    CANCELLED: {
      backgroundColor: palette.dangerSoft,
      textColor: palette.danger,
    },
  }[status];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: urgent ? `${palette.danger}18` : tone.backgroundColor,
          borderColor: urgent ? `${palette.danger}66` : "transparent",
          borderWidth: urgent ? 1 : 0,
        },
      ]}
    >
      <Text style={[styles.text, { color: tone.textColor }]}>
        {REQUEST_STATUS_LABELS[status]}
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
