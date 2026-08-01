import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { typography } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  uri?: string | null;
  fullName?: string;
  size?: number;
  onPress?: () => void;
};

const getInitials = (fullName?: string) => {
  if (!fullName) return "?";

  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

export const ProfileAvatar = ({ uri, fullName, size = 96, onPress }: Props) => {
  const { palette } = useThemeContext();

  const content = uri ? (
    <Image
      source={{ uri }}
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.surfaceMuted,
        },
      ]}
    />
  ) : (
    <View
      style={[
        styles.placeholder,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.surfaceMuted,
          borderColor: palette.border,
        },
      ]}
    >
      <Text
        style={[
          styles.initials,
          {
            fontSize: size * 0.28,
            color: palette.primary,
          },
        ]}
      >
        {getInitials(fullName)}
      </Text>
    </View>
  );

  if (!onPress) return content;

  return <Pressable onPress={onPress}>{content}</Pressable>;
};

const styles = StyleSheet.create({
  avatar: {},
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  initials: {
    fontWeight: typography.fontWeight.bold,
  },
});
