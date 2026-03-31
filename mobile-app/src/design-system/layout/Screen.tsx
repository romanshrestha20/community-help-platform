import React from "react";
import { SafeAreaView, ScrollView, ScrollViewProps, View, ViewProps } from "react-native";

import { theme } from "../theme";

type BaseScreenProps = {
  centered?: boolean;
  useSafeArea?: boolean;
};

type ScreenProps = ScrollViewProps & BaseScreenProps;
type ScreenViewProps = ViewProps & BaseScreenProps;

const contentStyle = (centered: boolean) => ({
  flexGrow: 1,
  padding: theme.spacing.lg,
  justifyContent: centered ? "center" : "flex-start",
});

export const Screen = ({
  centered = false,
  useSafeArea = true,
  contentContainerStyle,
  children,
  style,
  ...props
}: ScreenProps) => {
  const scrollView = (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      style={[{ backgroundColor: theme.colors.background }, style]}
      contentContainerStyle={[contentStyle(centered), contentContainerStyle]}
      {...props}
    >
      {children}
    </ScrollView>
  );

  if (!useSafeArea) {
    return scrollView;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {scrollView}
    </SafeAreaView>
  );
};

export const ScreenView = ({ centered = false, useSafeArea = true, children, style, ...props }: ScreenViewProps) => {
  const content = (
    <View
      style={[
        {
          flex: 1,
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.background,
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

  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>{content}</SafeAreaView>;
};
