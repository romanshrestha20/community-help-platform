import React from "react";
import { View, ViewProps } from "react-native";

import { theme } from "../theme";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type CardProps = ViewProps & {
  padded?: boolean;
};

export const Card = ({ padded = true, style, children, ...props }: CardProps) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        {
          backgroundColor: palette.surface,
          borderWidth: 1,
          borderColor: palette.border,
          borderRadius: theme.radius.lg,
          padding: padded ? theme.spacing.md : 0,
          shadowColor: palette.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 1,
          shadowRadius: 2,
          elevation: 1,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};
