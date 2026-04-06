import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card, Row, Stack, theme } from "@/design-system";
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
    <Card>
      <Stack gap="md" style={styles.centered}>
        <Pressable onPress={onAvatarPress}>
          <ProfileAvatar
            uri={user?.avatarUrl}
            fullName={user?.fullName}
            size={104}
          />
        </Pressable>

        <Stack gap="xs" style={styles.centered}>
          <Text style={[styles.name, { color: palette.textPrimary }]}>
            {user?.fullName || "Your profile"}
          </Text>
          <Text style={[styles.meta, { color: palette.textSecondary }]}>
            {user?.email || "No email available"}
          </Text>
        </Stack>

        <ProfileAvatarActions
          hasAvatar={!!user?.avatarUrl}
          loading={loading}
          onUpload={onUploadPress}
          onDelete={onDeletePress}
        />
      </Stack>
    </Card>
  );
};

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
  },
  name: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: "center",
  },
  meta: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    textAlign: "center",
  },
});