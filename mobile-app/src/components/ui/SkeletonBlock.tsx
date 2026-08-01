import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";

import { theme } from "@/design-system/theme";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type SkeletonBlockProps = {
  width?: number | `${number}%` | "auto";
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export const SkeletonBlock = ({
  width = "100%",
  height,
  radius = theme.radius.md,
  style,
}: SkeletonBlockProps) => {
  const { palette } = useThemeContext();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.95,
          duration: 700,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: palette.border,
          opacity,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
});
