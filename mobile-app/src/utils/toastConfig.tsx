import React, { useEffect } from "react";
import {
  Appearance,
  Pressable,
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

const toneByKind = {
  success: (palette: typeof lightColors | typeof darkColors) => ({
    border: palette.border,
    bg: palette.surface,
    iconColor: palette.success,
    titleColor: palette.textPrimary,
  }),
  error: (palette: typeof lightColors | typeof darkColors) => ({
    border: palette.border,
    bg: palette.surface,
    iconColor: palette.danger,
    titleColor: palette.textPrimary,
  }),
  info: (palette: typeof lightColors | typeof darkColors) => ({
    border: palette.border,
    bg: palette.surface,
    iconColor: palette.secondary,
    titleColor: palette.textPrimary,
  }),
};

const baseContainerStyle: ViewStyle = {
  minHeight: 58,
  borderRadius: radius.lg,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  marginHorizontal: spacing.md,
  marginVertical: spacing.xxs,
  borderWidth: 1,
  flexDirection: "row",
  alignItems: "flex-start",
  gap: spacing.sm,
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

const textGroupStyle: ViewStyle = {
  flex: 1,
  gap: spacing.xxs,
};

const titleStyle: TextStyle = {
  fontFamily: typography.fontFamily.semibold,
  fontSize: typography.fontSize.sm,
  lineHeight: typography.lineHeight.sm,
  fontWeight: typography.fontWeight.semibold,
};

const messageStyle: TextStyle = {
  fontFamily: typography.fontFamily.regular,
  fontSize: typography.fontSize.xs,
  lineHeight: typography.lineHeight.xs,
  opacity: 0.9,
};

const iconContainerStyle: ViewStyle = {
  width: 20,
  height: 20,
  borderRadius: radius.sm,
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

  const enter = useSharedValue(0);

  useEffect(() => {
    enter.value = withTiming(1, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [enter]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: enter.value,
      transform: [
        {
          translateY: interpolate(enter.value, [0, 1], [-8, 0]),
        },
      ],
    };
  });

  return (
    <Animated.View style={containerAnimatedStyle}>
      <Pressable
        onPress={props.onPress || props.props?.onPress}
        style={[
          baseContainerStyle,
          {
            borderColor: tone.border,
            backgroundColor: tone.bg,
            shadowColor: palette.shadow,
          },
          styleOverrides.containerStyle,
        ]}
        accessibilityRole="button"
        accessibilityLabel={props.text1 || "Toast message"}
      >
        {showIcon ? (
          <View
            style={[
              iconContainerStyle,
              { backgroundColor: "transparent" },
              styleOverrides.iconContainerStyle,
            ]}
          >
            <Ionicons
              name={iconName}
              size={36}
              color={tone.iconColor}
            />
          </View>
        ) : null}

        <View style={textGroupStyle}>
          <Text
            numberOfLines={2}
            style={[
              titleStyle,
              { color: tone.titleColor, flex: 1 },
              styleOverrides.titleStyle,
            ]}
          >
            {props.text1}
          </Text>

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