import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { Card, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { ProfileInfoRow } from "@/features/user/profile/components/ProfileInfoRow";

type Props = {
  fullName?: string | null;
  bio?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  userType?: string | null;
  address?: string | null;
  onEdit: () => void;
};

export const ProfileDetailsCard = ({
  fullName,
  bio,
  dateOfBirth,
  gender,
  userType,
  address,
  onEdit,
}: Props) => {
  const { palette } = useThemeContext();

  return (
    <Card style={styles.card}>
      <Stack gap="sm">
        <Pressable style={styles.headerRow} onPress={onEdit}>
          <Text style={[styles.title, { color: palette.textPrimary }]}>Account Details</Text>
          <Text style={[styles.editText, { color: palette.primary }]}>Edit</Text>
        </Pressable>

        <ProfileInfoRow label="Full Name" value={fullName} />
        <ProfileInfoRow label="Bio" value={bio} />
        <ProfileInfoRow label="Date of Birth" value={dateOfBirth} />
        <ProfileInfoRow label="Gender" value={gender} />
        <ProfileInfoRow label="User Type" value={userType} />
        <ProfileInfoRow label="Address" value={address} />
      </Stack>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  editText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});