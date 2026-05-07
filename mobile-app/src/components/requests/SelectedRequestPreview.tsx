import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { theme } from "@/design-system";
import { HelpRequest } from "@/features/helpRequest/types/helpRequest.types";
import { formatRequestBudget, getRequestCategoryLabel } from "@/features/helpRequest/utils/requestDisplay";
import { getRelativePostedTime } from "@/features/helpRequest/utils/requestTime";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  request: HelpRequest | null;
  onViewDetails?: (requestId: string) => void;
  onPlaceBid?: (request: HelpRequest) => void;
};

export const SelectedRequestPreview = ({ request, onViewDetails, onPlaceBid }: Props) => {
  const { palette } = useThemeContext();

  if (!request) {
    return (
      <View style={[styles.empty, { borderColor: palette.border, backgroundColor: palette.surface }]}>
        <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>No request selected</Text>
        <Text style={[styles.emptyText, { color: palette.textSecondary }]}>
          Click any card from the feed or a marker on the map to preview details and bid quickly.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}> 
      <Text style={[styles.title, { color: palette.textPrimary }]}>{request.title}</Text>
      <Text style={[styles.sub, { color: palette.textSecondary }]}>{getRequestCategoryLabel(request)} · {request.status}</Text>
      <Text style={[styles.meta, { color: palette.textSecondary }]}>{getRelativePostedTime(request.createdAt)}</Text>
      <Text style={[styles.meta, { color: palette.primary }]}>Budget {formatRequestBudget(request)}</Text>
      <Text numberOfLines={5} style={[styles.desc, { color: palette.textSecondary }]}>{request.description}</Text>
      <View style={styles.actions}>
        <AppButton title="View details" onPress={() => onViewDetails?.(request.id)} variant="secondary" />
        <AppButton title="Place bid" onPress={() => onPlaceBid?.(request)} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  empty: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  sub: {
    fontSize: 13,
    fontWeight: "700",
  },
  meta: {
    fontSize: 12,
    fontWeight: "600",
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    marginTop: theme.spacing.xs,
    gap: 8,
  },
});
