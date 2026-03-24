import React from "react";
import { ScrollView, ScrollViewProps, View } from "react-native";

import { theme } from "../theme";

type ScreenProps = ScrollViewProps & {
  centered?: boolean;
};

export const Screen = ({ centered = false, contentContainerStyle, children, ...props }: ScreenProps) => {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        {
          flexGrow: 1,
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.background,
          justifyContent: centered ? "center" : "flex-start",
        },
        contentContainerStyle,
      ]}
      {...props}
    >
      <View>{children}</View>
    </ScrollView>
  );
};
