import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { User } from "../types/user.types";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileAvatarActions } from "./ProfileAvatarActions";

type Props = {
  user: User | null;
  loading?: boolean;
  onAvatarPress: () => void;
  onUploadPress: () => void;
  onDeletePress: () => void;
};

export const ProfileHeaderCard = ({
  user,
  loading = false,
  onAvatarPress,
  onUploadPress,
  onDeletePress,
}: Props) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <ProfileAvatar
        uri={user?.avatarUrl}
        fullName={user?.fullName}
        size={104}
        onPress={onAvatarPress}
      />

      <View style={styles.info}>
        <Text style={[styles.name, { color: palette.textPrimary }]}>
          {user?.fullName || "Your profile"}
        </Text>
        <Text style={[styles.meta, { color: palette.textSecondary }]}>
          {user?.email || "No email available"}
        </Text>
      </View>

      <ProfileAvatarActions
        hasAvatar={!!user?.avatarUrl}
        loading={loading}
        onUpload={onUploadPress}
        onDelete={onDeletePress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
  },
  info: {
    alignItems: "center",
    gap: spacing.xxs,
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  meta: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
});