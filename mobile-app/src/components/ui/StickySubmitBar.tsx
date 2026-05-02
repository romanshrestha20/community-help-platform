import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = ViewProps;

export const StickySubmitBar = ({ children, style, ...props }: Props) => {
  const { palette } = useThemeContext();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          borderTopColor: palette.border,
          backgroundColor: palette.surface,
          paddingBottom: Math.max(insets.bottom, theme.spacing.sm),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
});
