import React from "react";
import { View, ViewProps } from "react-native";

import { theme } from "../theme";
import { SpacingToken } from "../tokens/spacing";

type RowProps = ViewProps & {
  gap?: SpacingToken;
  align?: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
  justify?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
};

export const Row = ({ gap = "sm", align = "center", justify = "flex-start", style, children, ...props }: RowProps) => {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: align,
          justifyContent: justify,
          columnGap: theme.spacing[gap],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};
