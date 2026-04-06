import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { User } from "../types/user.types";

type Props = {
  user: User | null;
};

const formatLabel = (value?: string | null) => {
  if (!value) return "Not set";
  return value;
};

export const ProfileInfoSection = ({ user }: Props) => {
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
      <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
        Profile information
      </Text>

      <View style={styles.grid}>
        <InfoItem label="Full name" value={formatLabel(user?.fullName)} />
        <InfoItem label="Email" value={formatLabel(user?.email)} />
        <InfoItem label="Phone" value={formatLabel(user?.phone)} />
        <InfoItem label="Gender" value={formatLabel(user?.gender)} />
        <InfoItem label="User type" value={formatLabel(user?.userType)} />
        <InfoItem label="Date of birth" value={formatLabel(user?.dateOfBirth)} />
      </View>

      <View style={styles.bioBlock}>
        <Text style={[styles.label, { color: palette.textSecondary }]}>Bio</Text>
        <Text style={[styles.bioText, { color: palette.textPrimary }]}>
          {user?.bio?.trim() ? user.bio : "No bio added yet."}
        </Text>
      </View>

      <View style={styles.bioBlock}>
        <Text style={[styles.label, { color: palette.textSecondary }]}>Address</Text>
        <Text style={[styles.bioText, { color: palette.textPrimary }]}>
          {user?.address?.formattedAddress?.trim()
            ? user.address.formattedAddress
            : "No address added yet."}
        </Text>
      </View>
    </View>
  );
};

const InfoItem = ({ label, value }: { label: string; value: string }) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.item,
        {
          borderBottomColor: palette.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: palette.textSecondary }]}>{label}</Text>
      <Text style={[styles.value, { color: palette.textPrimary }]}>{value}</Text>
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
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  grid: {
    gap: spacing.sm,
  },
  item: {
    gap: spacing.xxs + 2,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  value: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.sm,
  },
  bioBlock: {
    gap: spacing.xxs + 2,
  },
  bioText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.md,
  },
});