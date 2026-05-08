import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { Card, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { getCloudinaryVariantUrl } from "@/utils/cloudinaryImage";

type Props = {
  avatarUrl?: string | null;
  fullName?: string | null;
  email?: string | null;
  userType?: string | null;
  verified?: boolean;
  onEditProfile: () => void;
  onChangePhoto: () => void;
  onOpenSettings: () => void;
};

const getInitials = (fullName?: string | null) => {
  if (!fullName?.trim()) return "U";

  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
};

export const ProfileHeroCard = ({
  avatarUrl,
  fullName,
  email,
  userType,
  verified,
  onEditProfile,
  onChangePhoto,
  onOpenSettings,
}: Props) => {
  const { palette } = useThemeContext();
  const initials = getInitials(fullName);

  const hasAvatar = !!avatarUrl?.trim();

  return (
    <Card style={styles.card}>
      <View style={[styles.accentBar, { backgroundColor: `${palette.primary}14` }]} />

      <View style={styles.headerRow}>
        <View style={styles.identityRow}>
          <View
            style={[
              styles.avatarShell,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
              },
            ]}
          >
            {hasAvatar ? (
              <Image
                source={{ uri: getCloudinaryVariantUrl(avatarUrl!, "thumbnail") }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={[styles.avatarInitial, { color: palette.textPrimary }]}>
                {initials}
              </Text>
            )}
          </View>

          <View style={styles.identityTextWrap}>
            <View style={styles.nameRow}>
              <Text
                style={[styles.name, { color: palette.textPrimary }]}
                numberOfLines={1}
              >
                {fullName || "Your profile"}
              </Text>

              {verified ? (
                <View
                  style={[
                    styles.verifiedPill,
                    { backgroundColor: `${palette.success}18` },
                  ]}
                >
                  <Text style={[styles.verifiedText, { color: palette.success }]}>
                    Verified
                  </Text>
                </View>
              ) : null}
            </View>

            <Text
              style={[styles.metaLine, { color: palette.textSecondary }]}
              numberOfLines={1}
            >
              {(userType || "General").toUpperCase()} • {verified ? "Verified" : "Unverified"}
            </Text>

            <Text
              style={[styles.email, { color: palette.textSecondary }]}
              numberOfLines={1}
            >
              {email || "Not available"}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onOpenSettings}
          style={[
            styles.settingsButton,
            {
              backgroundColor: palette.surfaceMuted,
              borderColor: palette.border,
            },
          ]}
        >
          <Ionicons name="settings-outline" size={18} color={palette.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.buttonRow}>
        <AppButton title="Edit Profile" onPress={onEditProfile} fullWidth={false} />
        <AppButton
          title={hasAvatar ? "Change Photo" : "Upload Photo"}
          variant="secondary"
          onPress={onChangePhoto}
          fullWidth={false}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: "hidden",
  },
  accentBar: {
    height: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  identityRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  avatarShell: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontSize: 30,
    fontWeight: theme.typography.fontWeight.bold,
  },
  identityTextWrap: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  name: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: theme.typography.fontWeight.bold,
    flexShrink: 1,
  },
  verifiedPill: {
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
  },
  verifiedText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaLine: {
    fontSize: theme.typography.fontSize.xs,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  email: {
    fontSize: theme.typography.fontSize.sm,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.fill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
});
