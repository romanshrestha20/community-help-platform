import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  hasAvatar: boolean;
  loading?: boolean;
  onUpload: () => void;
  onDelete: () => void;
};

export const ProfileAvatarActions = ({
  hasAvatar,
  loading = false,
  onUpload,
  onDelete,
}: Props) => {
  const { palette } = useThemeContext();

  return (
    <View style={styles.row}>
      <Pressable
        style={[
          styles.button,
          styles.primaryButton,
          {
            backgroundColor: palette.primary,
          },
        ]}
        onPress={onUpload}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={palette.textInverse} />
        ) : (
          <Text style={[styles.primaryText, { color: palette.textInverse }]}>
            {hasAvatar ? "Change photo" : "Upload photo"}
          </Text>
        )}
      </Pressable>

      
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  button: {
    minHeight: 46,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    flex: 1,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  primaryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  secondaryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});