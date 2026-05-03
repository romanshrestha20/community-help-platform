import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { theme } from "@/design-system";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  showGrabber?: boolean;
  grabberColor?: string;
  contentStyle?: StyleProp<ViewStyle>;
};

export const BottomSheetSurface = ({
  children,
  style,
  showGrabber = false,
  grabberColor,
  contentStyle,
}: Props) => {
  return (
    <View style={[styles.sheet, style]}>
      {showGrabber ? (
        <View style={styles.grabberWrap}>
          <View
            style={[
              styles.grabber,
              grabberColor ? { backgroundColor: grabberColor } : null,
            ]}
          />
        </View>
      ) : null}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    overflow: "hidden",
  },
  grabberWrap: {
    alignItems: "center",
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  grabber: {
    width: 46,
    height: 5,
    borderRadius: theme.radius.fill,
    backgroundColor: "rgba(188, 208, 200, 0.5)",
  },
  content: {
    flexShrink: 1,
  },
});

