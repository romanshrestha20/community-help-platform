import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useColorScheme,
  Text,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { router } from "expo-router";

import { theme } from "@/design-system";
import {
  defaultTabsConfig,
  getTheme,
  TAB_BAR_CONSTANTS,
  resolveColorScheme,
} from "@/config/tabBarConfig";
import { darkColors, lightColors } from "@/design-system/tokens/colors";
import type { ColorScheme, TabItem } from "@/types/tabBar";

interface CustomTabBarProps extends BottomTabBarProps {
  tabs?: TabItem[];
  colorScheme?: ColorScheme;
}

const createStyles = (
  colors: ReturnType<typeof getTheme>,
  palette: typeof lightColors
) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: colors.backgroundColor,
      borderTopColor: colors.borderColor,
      borderTopWidth: 1,
      height: TAB_BAR_CONSTANTS.HEIGHT,
      paddingBottom:
        Platform.OS === "ios" ? 20 : TAB_BAR_CONSTANTS.PADDING_BOTTOM,
      paddingHorizontal: theme.spacing.xs,
    },
    tabButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.lg,
    },
    tabButtonActive: {
      backgroundColor: palette.surfaceMuted,
    },
    iconWrapper: {
      position: "relative",
      marginBottom: theme.spacing.xxs,
    },
    label: {
      fontSize: TAB_BAR_CONSTANTS.LABEL_FONT_SIZE,
      fontWeight: TAB_BAR_CONSTANTS.LABEL_FONT_WEIGHT,
      marginTop: 2,
    },
    labelActive: {
      color: colors.primaryColor,
    },
    labelInactive: {
      color: colors.secondaryColor,
    },
    badge: {
      position: "absolute",
      top: -5,
      right: -8,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: palette.danger,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: palette.surface,
      paddingHorizontal: 4,
    },
    badgeText: {
      color: palette.textInverse,
      fontSize: 10,
      fontWeight: "700",
      textAlign: "center",
      lineHeight: 16,
    },
  });

export const CustomTabBar: React.FC<CustomTabBarProps> = ({
  tabs = defaultTabsConfig,
  colorScheme,
  state,
  descriptors,
  navigation,
}) => {
  const systemColorScheme = useColorScheme();
  const resolvedColorScheme =
    colorScheme ?? resolveColorScheme("system", systemColorScheme);

  const colors = getTheme(resolvedColorScheme);
  const palette = resolvedColorScheme === "dark" ? darkColors : lightColors;
  const styles = createStyles(colors, palette);

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const route = state.routes.find((item) => item.name === tab.name);

        if (!route) return null;

        const routeIndex = state.routes.findIndex(
          (item) => item.key === route.key
        );
        const isFocused = state.index === routeIndex;
        const iconName = isFocused && tab.activeIcon ? tab.activeIcon : tab.icon;

        const options = descriptors[route.key]?.options;
        const label =
          typeof options?.tabBarLabel === "string"
            ? options.tabBarLabel
            : typeof options?.title === "string"
              ? options.title
              : tab.label;

        const handlePress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (event.defaultPrevented) {
            return;
          }

          // Always route to the tab root path so reselecting a focused tab resets nested paths.
          router.replace(`/${route.name}` as `/${string}`);
        };

        const handleLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={[styles.tabButton, isFocused && styles.tabButtonActive]}
            onPress={handlePress}
            onLongPress={handleLongPress}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <FontAwesome
                name={iconName}
                size={tab.name === "notifications" && !!tab.badge ? TAB_BAR_CONSTANTS.ICON_SIZE + 1 : TAB_BAR_CONSTANTS.ICON_SIZE}
                color={isFocused ? colors.primaryColor : colors.secondaryColor}
              />

              {!!tab.badge && tab.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {tab.badge > 99 ? "99+" : String(tab.badge)}
                  </Text>
                </View>
              )}
            </View>

            <Text
              style={[
                styles.label,
                isFocused ? styles.labelActive : styles.labelInactive,
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};