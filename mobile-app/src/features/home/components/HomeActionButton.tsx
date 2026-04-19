import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
};

export function HomeActionButton({
  label,
  onPress,
  icon,
  variant = "primary",
  fullWidth = false,
}: Props) {
  const { palette } = useThemeContext();
  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        fullWidth ? styles.fullWidth : null,
        {
          backgroundColor: isPrimary ? palette.primary : palette.surfaceMuted,
          borderColor: isPrimary ? palette.primary : palette.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        {icon ? (
          <Ionicons
            name={icon}
            size={16}
            color={isPrimary ? palette.textInverse : palette.textPrimary}
          />
        ) : null}
        <Text
          style={[
            styles.label,
            { color: isPrimary ? palette.textInverse : palette.textPrimary },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 46,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 8,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
