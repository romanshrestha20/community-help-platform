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
import { router, usePathname } from "expo-router";

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
      backgroundColor:
        palette === lightColors ? "rgba(255,255,255,0.92)" : "rgba(36,39,36,0.94)",
      borderColor: palette.border,
      borderWidth: 1,
      height: TAB_BAR_CONSTANTS.HEIGHT + 16,
      paddingBottom:
        Platform.OS === "ios" ? 20 : TAB_BAR_CONSTANTS.PADDING_BOTTOM,
      paddingTop: 7,
      paddingHorizontal: 6,
      marginHorizontal: 0,
      shadowColor: "#122013",
      shadowOpacity: palette === lightColors ? 0.09 : 0.2,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 12,
    },
    tabButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 5,
      paddingHorizontal: 2,
      borderRadius: 999,
    },
    tabButtonActive: {
      backgroundColor:
        palette === lightColors ? colors.primaryColor : `${colors.primaryColor}1f`,
    },
    iconWrapper: {
      position: "relative",
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 1,
    },
    iconWrapperActive: {
      backgroundColor:
        palette === lightColors ? "rgba(255,255,255,0.16)" : `${colors.primaryColor}10`,
    },
    label: {
      fontSize: 9,
      fontWeight: "500",
      letterSpacing: 0,
    },
    labelActive: {
      color: palette === lightColors ? palette.textInverse : colors.primaryColor,
    },
    labelInactive: {
      color: palette === lightColors ? "#6B7A6B" : colors.secondaryColor,
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
  descriptors,
}) => {
  const systemColorScheme = useColorScheme();
  const pathname = usePathname();
  const resolvedColorScheme =
    colorScheme ?? resolveColorScheme("system", systemColorScheme);

  const colors = getTheme(resolvedColorScheme);
  const palette = resolvedColorScheme === "dark" ? darkColors : lightColors;
  const styles = createStyles(colors, palette);

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isFocused =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const iconName = isFocused && tab.activeIcon ? tab.activeIcon : tab.icon;
        const descriptor = Object.values(descriptors).find(
          (item) => item.route.name === tab.name
        );
        const options = descriptor?.options;
        const label =
          typeof options?.tabBarLabel === "string"
            ? options.tabBarLabel
            : typeof options?.title === "string"
              ? options.title
              : tab.label;

        const handlePress = () => {
          router.replace(tab.href as `/${string}`);
        };

        return (
          <TouchableOpacity
            key={tab.name}
            style={[styles.tabButton, isFocused && styles.tabButtonActive]}
            onPress={handlePress}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconWrapper,
                isFocused ? styles.iconWrapperActive : null,
              ]}
            >
              <FontAwesome
                name={iconName}
                size={
                  tab.name === "notifications" && !!tab.badge
                    ? TAB_BAR_CONSTANTS.ICON_SIZE + 1
                    : TAB_BAR_CONSTANTS.ICON_SIZE
                }
                color={
                  isFocused
                    ? palette === lightColors
                      ? palette.textInverse
                      : colors.primaryColor
                    : colors.secondaryColor
                }
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
