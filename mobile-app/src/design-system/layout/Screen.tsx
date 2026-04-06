import React from "react";
import {
  ScrollView,
  ScrollViewProps,
  View,
  ViewProps,
  StyleSheet,
  ViewStyle,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { theme } from "../theme";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { TAB_BAR_CONSTANTS } from "@/config/tabBarConfig";

type BaseScreenProps = {
  centered?: boolean;
  useSafeArea?: boolean;
  withTabBarSpacing?: boolean;
};

type ScreenProps = ScrollViewProps & BaseScreenProps;
type ScreenViewProps = ViewProps & BaseScreenProps;

const createContentStyle = (
  centered: boolean,
  bottomSpacing: number
): ViewStyle => ({
  flexGrow: 1,
  padding: theme.spacing.lg,
  paddingBottom: theme.spacing.lg + bottomSpacing,
  justifyContent: centered ? "center" : "flex-start",
});

export const Screen = ({
  centered = false,
  useSafeArea = true,
  withTabBarSpacing = true,
  contentContainerStyle,
  children,
  style,
  ...props
}: ScreenProps) => {
  const { palette } = useThemeContext();
  const insets = useSafeAreaInsets();

  const bottomSpacing = withTabBarSpacing
    ? TAB_BAR_CONSTANTS.HEIGHT + insets.bottom + theme.spacing.sm
    : 0;

  const scrollView = (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      style={[styles.flex, { backgroundColor: palette.background }, style]}
      contentContainerStyle={[
        createContentStyle(centered, bottomSpacing),
        contentContainerStyle,
      ]}
      {...props}
    >
      {children}
    </ScrollView>
  );

  if (!useSafeArea) {
    return scrollView;
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.flex, { backgroundColor: palette.background }]}
    >
      {scrollView}
    </SafeAreaView>
  );
};

export const ScreenView = ({
  centered = false,
  useSafeArea = true,
  withTabBarSpacing = true,
  children,
  style,
  ...props
}: ScreenViewProps) => {
  const { palette } = useThemeContext();
  const insets = useSafeAreaInsets();

  const bottomSpacing = withTabBarSpacing
    ? TAB_BAR_CONSTANTS.HEIGHT + insets.bottom + theme.spacing.sm
    : 0;

  const content = (
    <View
      style={[
        styles.flex,
        {
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.lg + bottomSpacing,
          backgroundColor: palette.background,
          justifyContent: centered ? "center" : "flex-start",
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );

  if (!useSafeArea) {
    return content;
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.flex, { backgroundColor: palette.background }]}
    >
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});