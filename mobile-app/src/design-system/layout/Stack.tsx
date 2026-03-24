import React from "react";
import { View, ViewProps } from "react-native";

import { theme } from "../theme";
import { SpacingToken } from "../tokens/spacing";

type StackProps = ViewProps & {
  gap?: SpacingToken;
};

export const Stack = ({ gap = "md", style, children, ...props }: StackProps) => {
  return (
    <View style={[{ rowGap: theme.spacing[gap] }, style]} {...props}>
      {children}
    </View>
  );
};
