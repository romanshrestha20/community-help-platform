import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card, Stack, theme } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { User } from "../types/user.types";

type Props = {
  user: User | null;
  onEditProfile?: () => void;
};

const formatLabel = (value?: string | null) => {
  if (!value) return "Not set";
  return value;
};

export const ProfileInfoSection = ({ user, onEditProfile }: Props) => {
  const { palette } = useThemeContext();

  return (
    <Card>
      <Stack gap="md">
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
          Profile information
        </Text>

        <Stack gap="sm">
          <InfoItem label="Full name" value={formatLabel(user?.fullName)} />
          <InfoItem label="Email" value={formatLabel(user?.email)} />
          <InfoItem label="Phone" value={formatLabel(user?.phone)} />
          <InfoItem label="Gender" value={formatLabel(user?.gender)} />
          <InfoItem label="User type" value={formatLabel(user?.userType)} />
          <InfoItem label="Date of birth" value={formatLabel(user?.dateOfBirth)} />
        </Stack>

        <Stack gap="xs">
          <Text style={[styles.label, { color: palette.textSecondary }]}>Bio</Text>
          <Text style={[styles.bodyText, { color: palette.textPrimary }]}>
            {user?.bio?.trim() ? user.bio : "No bio added yet."}
          </Text>
        </Stack>

        <Stack gap="xs">
          <Text style={[styles.label, { color: palette.textSecondary }]}>Address</Text>
          <Text style={[styles.bodyText, { color: palette.textPrimary }]}>
            {user?.address?.formattedAddress?.trim()
              ? user.address.formattedAddress
              : "No address added yet."}
          </Text>
        </Stack>

        {onEditProfile ? (
          <View style={styles.actionsRow}>
            <AppButton
              title="Edit profile"
              onPress={onEditProfile}
              variant="secondary"
              fullWidth={false}
            />
          </View>
        ) : null}
      </Stack>
    </Card>
  );
};

const InfoItem = ({ label, value }: { label: string; value: string }) => {
  const { palette } = useThemeContext();

  return (
    <View style={[styles.item, { borderBottomColor: palette.border }]}>
      <Text style={[styles.label, { color: palette.textSecondary }]}>{label}</Text>
      <Text style={[styles.value, { color: palette.textPrimary }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  item: {
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  value: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  bodyText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
  actionsRow: {
    alignItems: "flex-end",
  },
});