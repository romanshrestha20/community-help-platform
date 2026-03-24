import React from "react";
import { View, ViewProps } from "react-native";

import { theme } from "../theme";

type CardProps = ViewProps & {
  padded?: boolean;
};

export const Card = ({ padded = true, style, children, ...props }: CardProps) => {
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          padding: padded ? theme.spacing.md : 0,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};
