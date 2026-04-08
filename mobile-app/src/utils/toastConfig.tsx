import React, { useEffect } from "react";
import {
  Appearance,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  ToastConfig,
  ToastConfigParams,
} from "react-native-toast-message";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { spacing, typography, radius } from "@/design-system";
import { darkColors, lightColors } from "@/design-system/tokens/colors";
import { resolveColorScheme } from "@/config/tabBarConfig";
import { useThemeStore } from "@/features/settings/store/theme.store";

type ToastKind = "success" | "error" | "info";

type ToastRenderProps = {
  showIcon?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

export type ToastStyleOverrides = {
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  messageStyle?: TextStyle;
  iconContainerStyle?: ViewStyle;
};

let styleOverrides: ToastStyleOverrides = {};

export const setToastStyleOverrides = (overrides?: ToastStyleOverrides) => {
  styleOverrides = overrides || {};
};

const getPalette = () => {
  const systemColorScheme = Appearance.getColorScheme();
  const themeMode = useThemeStore.getState().themeMode;
  const colorScheme = resolveColorScheme(themeMode, systemColorScheme);

  return colorScheme === "dark" ? darkColors : lightColors;
};

const iconByKind: Record<ToastKind, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "close-circle",
  info: "information-circle",
};

const labelByKind: Record<ToastKind, string> = {
  success: "Success",
  error: "Error",
  info: "Info",
};

const toneByKind = {
  success: (palette: typeof lightColors | typeof darkColors) => ({
    border: palette.success,
    bg: palette.successSurface,
    iconBg: palette.success,
    iconColor: palette.textInverse,
  }),
  error: (palette: typeof lightColors | typeof darkColors) => ({
    border: palette.danger,
    bg: palette.dangerSurface,
    iconBg: palette.danger,
    iconColor: palette.textInverse,
  }),
  info: (palette: typeof lightColors | typeof darkColors) => ({
    border: palette.secondary,
    bg: palette.infoSurface,
    iconBg: palette.secondary,
    iconColor: palette.textInverse,
  }),
};

const baseContainerStyle: ViewStyle = {
  minHeight: 72,
  borderRadius: radius.xl,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.md,
  marginHorizontal: spacing.md,
  marginVertical: spacing.xxs,
  borderWidth: 1,
  borderLeftWidth: 4,
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.md,
  shadowOpacity: 0.14,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 5,
};

const accentRailStyle: ViewStyle = {
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
  width: 5,
};

const textGroupStyle: ViewStyle = {
  flex: 1,
  gap: spacing.xxs,
};

const headerRowStyle: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: spacing.sm,
};

const kindChipStyle: ViewStyle = {
  paddingHorizontal: spacing.xs,
  paddingVertical: 2,
  borderRadius: radius.fill,
  alignSelf: "flex-start",
};

const kindChipTextStyle: TextStyle = {
  fontFamily: typography.fontFamily.medium,
  fontSize: typography.fontSize.xxs,
  lineHeight: typography.lineHeight.xxs,
  fontWeight: typography.fontWeight.medium,
  letterSpacing: 0.4,
  textTransform: "uppercase",
};

const titleStyle: TextStyle = {
  fontFamily: typography.fontFamily.semibold,
  fontSize: typography.fontSize.md,
  lineHeight: typography.lineHeight.md,
  fontWeight: typography.fontWeight.semibold,
};

const messageStyle: TextStyle = {
  fontFamily: typography.fontFamily.regular,
  fontSize: typography.fontSize.sm,
  lineHeight: typography.lineHeight.sm,
  opacity: 0.92,
};

const iconContainerStyle: ViewStyle = {
  width: 34,
  height: 34,
  borderRadius: radius.fill,
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

type AnimatedToastProps = {
  kind: ToastKind;
  props: ToastConfigParams<ToastRenderProps>;
};

const AnimatedToast = ({ kind, props }: AnimatedToastProps) => {
  const palette = getPalette();
  const tone = toneByKind[kind](palette);
  const showIcon = props.props?.showIcon ?? true;
  const iconName = props.props?.iconName || iconByKind[kind];
  const label = labelByKind[kind];

  const enter = useSharedValue(0);
  const iconPop = useSharedValue(0);

  useEffect(() => {
    enter.value = withTiming(1, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });

    iconPop.value = withSpring(1, {
      damping: 12,
      stiffness: 180,
      mass: 0.7,
    });
  }, [enter, iconPop]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: enter.value,
      transform: [
        {
          translateY: interpolate(enter.value, [0, 1], [-14, 0]),
        },
        {
          scale: interpolate(enter.value, [0, 1], [0.96, 1]),
        },
      ],
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(iconPop.value, [0, 1], [0.8, 1]),
        },
      ],
      opacity: iconPop.value,
    };
  });

  return (
    <Animated.View style={containerAnimatedStyle}>
      <Pressable
        onPress={props.onPress || props.props?.onPress}
        style={[
          baseContainerStyle,
          {
            borderLeftColor: tone.border,
            borderColor: tone.border,
            backgroundColor: tone.bg,
            shadowColor: palette.shadow,
          },
          styleOverrides.containerStyle,
        ]}
        accessibilityRole="button"
        accessibilityLabel={props.text1 || "Toast message"}
      >
        <View
          style={[
            accentRailStyle,
            { backgroundColor: tone.border },
          ]}
        />

        {showIcon ? (
          <Animated.View
            style={[
              iconContainerStyle,
              { backgroundColor: tone.iconBg },
              styleOverrides.iconContainerStyle,
              iconAnimatedStyle,
            ]}
          >
            <Ionicons
              name={iconName}
              size={18}
              color={tone.iconColor}
            />
          </Animated.View>
        ) : null}

        <View style={textGroupStyle}>
          <View style={headerRowStyle}>
            <Text
              numberOfLines={2}
              style={[
                titleStyle,
                { color: palette.textPrimary, flex: 1 },
                styleOverrides.titleStyle,
              ]}
            >
              {props.text1}
            </Text>

            <View
              style={[
                kindChipStyle,
                { backgroundColor: tone.iconBg },
              ]}
            >
              <Text
                style={[
                  kindChipTextStyle,
                  { color: tone.iconColor },
                ]}
              >
                {label}
              </Text>
            </View>
          </View>

          {props.text2 ? (
            <Text
              numberOfLines={3}
              style={[
                messageStyle,
                { color: palette.textSecondary },
                styleOverrides.messageStyle,
              ]}
            >
              {props.text2}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
};

export const toastConfig: ToastConfig = {
  success: (props) => <AnimatedToast kind="success" props={props} />,
  error: (props) => <AnimatedToast kind="error" props={props} />,
  info: (props) => <AnimatedToast kind="info" props={props} />,
};

const styles = StyleSheet.create({
  textContainer: {},
});