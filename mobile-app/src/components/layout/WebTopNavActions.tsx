import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { AppButton } from "@/components/ui/AppButton";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  locationLabel: string;
  onPostRequest: () => void;
  fullName?: string;
  avatarUrl?: string | null;
};

export const WebTopNavActions = ({
  locationLabel,
  onPostRequest,
  fullName,
  avatarUrl,
}: Props) => {
  const { palette } = useThemeContext();

  return (
    <View style={styles.actionsWrap}>
      <View style={[styles.locationPill, { backgroundColor: palette.surfaceMuted }]}>
        <Ionicons name="location-outline" size={14} color={palette.primary} />
        <Text style={[styles.locationText, { color: palette.textSecondary }]}>
          {locationLabel}
        </Text>
      </View>

      <View style={styles.postButtonWrap}>
        <AppButton title="Post request" onPress={onPostRequest} fullWidth={false} />
      </View>

      <View style={styles.iconRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open notifications"
          style={({ pressed }) => [
            styles.iconButton,
            {
              backgroundColor: pressed ? palette.surfaceMuted : palette.surface,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Ionicons
            name="notifications-outline"
            size={17}
            color={palette.textPrimary}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open messages"
          style={({ pressed }) => [
            styles.iconButton,
            {
              backgroundColor: pressed ? palette.surfaceMuted : palette.surface,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={17}
            color={palette.textPrimary}
          />
        </Pressable>
      </View>

      <ProfileAvatar uri={avatarUrl ?? undefined} fullName={fullName} size={34} />
    </View>
  );
};

const styles = StyleSheet.create({
  actionsWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    flexShrink: 0,
  },
  locationPill: {
    height: 38,
    borderRadius: 999,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    fontWeight: "700",
  },
  postButtonWrap: {
    minWidth: 130,
  },
  iconRow: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});
