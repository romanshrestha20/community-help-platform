import React from "react";
import { StyleSheet } from "react-native";

import { Screen } from "@/design-system";
import type { ScreenProps } from "@/design-system/layout/Screen";

type FormContainerProps = Pick<
  ScreenProps,
  "children" | "contentContainerStyle" | "style" | "useSafeArea" | "withTabBarSpacing"
>;

export const FormContainer = ({
  children,
  contentContainerStyle,
  style,
  useSafeArea,
  withTabBarSpacing,
}: FormContainerProps) => {
  return (
    <Screen
      centered
      contentContainerStyle={[styles.container, contentContainerStyle]}
      style={style}
      useSafeArea={useSafeArea}
      withTabBarSpacing={withTabBarSpacing}
    >
      {children}
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
});
