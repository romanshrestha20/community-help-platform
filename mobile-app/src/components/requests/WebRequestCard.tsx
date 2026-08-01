import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { AppButton } from "@/components/ui/AppButton";
import { HelpRequest } from "@/features/helpRequest/types/helpRequest.types";
import {
  formatRequestBudget,
  getRequestCategoryLabel,
} from "@/features/helpRequest/utils/requestDisplay";
import { getRelativePostedTime } from "@/features/helpRequest/utils/requestTime";
import { isUrgentRequestActive } from "@/features/helpRequest/utils/urgent";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";
import { AppLocation } from "@/features/location/types/location.types";
import { getDistanceToRequest } from "@/utils/distance";

type Props = {
  request: HelpRequest;
  userLocation?: AppLocation | null;
  onPressDetails: () => void;
  onPressBid: () => void;
  onPressRequester?: () => void;
  onPressSave?: () => void;
  selected?: boolean;
};

export const WebRequestCard = ({
  request,
  userLocation,
  onPressDetails,
  onPressBid,
  onPressRequester,
  onPressSave,
  selected,
}: Props) => {
  const { palette } = useThemeContext();
  const urgent = isUrgentRequestActive(request) && request.status === "OPEN";
  const distance =
    userLocation &&
    request.location?.latitude != null &&
    request.location?.longitude != null
      ? getDistanceToRequest(
          userLocation.latitude,
          userLocation.longitude,
          request.location.latitude,
          request.location.longitude
        )
      : null;

  return (
    <Pressable
      onPress={onPressDetails}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? palette.surfaceSecondary : palette.surface,
          borderColor: selected ? palette.primary : palette.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.categoryChip, { backgroundColor: palette.surfaceMuted }]}>
          <Text style={[styles.categoryText, { color: palette.textSecondary }]}>{getRequestCategoryLabel(request)}</Text>
        </View>
        {urgent ? (
          <View style={[styles.urgentChip, { backgroundColor: `${palette.danger}1A` }]}>
            <Ionicons name="flash" size={12} color={palette.danger} />
            <Text style={[styles.urgentText, { color: palette.danger }]}>Urgent</Text>
          </View>
        ) : null}
      </View>

      <Text numberOfLines={2} style={[styles.title, { color: palette.textPrimary }]}>{request.title}</Text>
      <Text numberOfLines={2} style={[styles.description, { color: palette.textSecondary }]}>{request.description}</Text>

      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: palette.textSecondary }]}>{distance ? `📍 ${distance}` : "📍 Nearby"}</Text>
        <Text style={[styles.meta, { color: palette.textSecondary }]}>⏱ {getRelativePostedTime(request.createdAt).replace("Posted ", "")}</Text>
        <Text style={[styles.meta, { color: palette.primary }]}>💶 {formatRequestBudget(request)}</Text>
        <Text style={[styles.meta, { color: palette.textSecondary }]}>💬 {request.bidCount ?? 0} bids</Text>
      </View>

      <View style={styles.bottomRow}>
        <Pressable style={styles.userRow} onPress={onPressRequester ?? onPressDetails}>
          <ProfileAvatar uri={request.requesterAvatarUrl} fullName={request.requesterName} size={30} />
          <Text numberOfLines={1} style={[styles.userName, { color: palette.textPrimary }]}>{request.requesterName || "Community member"}</Text>
        </Pressable>

        <View style={styles.actions}>
          <AppButton title="Profile" onPress={onPressRequester ?? onPressDetails} variant="ghost" fullWidth={false} />
          <AppButton title="View" onPress={onPressDetails} variant="secondary" fullWidth={false} />
          <AppButton title="Bid" onPress={onPressBid} fullWidth={false} />
          {onPressSave ? <AppButton title="Save" onPress={onPressSave} variant="ghost" fullWidth={false} /> : null}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "48.8%",
    minHeight: 248,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    height: 24,
    justifyContent: "center",
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
  },
  urgentChip: {
    borderRadius: 999,
    height: 24,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: "800",
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    minHeight: 36,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  meta: {
    fontSize: 12,
    fontWeight: "600",
  },
  bottomRow: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  userName: {
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
});
