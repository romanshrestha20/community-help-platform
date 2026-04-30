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
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      height: TAB_BAR_CONSTANTS.HEIGHT,
      paddingBottom: TAB_BAR_CONSTANTS.PADDING_BOTTOM,
      paddingTop: 8,
      paddingHorizontal: 10,
      marginHorizontal: 10,
      marginBottom: 8,
      borderRadius: 22,
      shadowColor: palette.shadow,
      shadowOpacity: palette === lightColors ? 0.12 : 0.28,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 10 },
      elevation: 16,
    },
    tabButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 4,
      paddingHorizontal: 2,
      borderRadius: 14,
    },
    tabButtonActive: {
      backgroundColor:
        palette === lightColors ? colors.primaryColor : `${colors.primaryColor}1f`,
    },
    postTabButton: {
      marginTop: -30,
    },
    postFab: {
      width: 62,
      height: 62,
      borderRadius: 31,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryColor,
      borderWidth: 4,
      borderColor: palette.surface,
      shadowColor: palette.shadow,
      shadowOpacity: palette === lightColors ? 0.3 : 0.45,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 18,
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
        palette === lightColors ? `${palette.textInverse}22` : `${colors.primaryColor}18`,
    },
    label: {
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 0.2,
    },
    labelActive: {
      color: palette === lightColors ? palette.textInverse : colors.primaryColor,
    },
    labelInactive: {
      color: palette.textSecondary,
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
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const resolvedColorScheme =
    colorScheme ?? resolveColorScheme("system", systemColorScheme);

  const colors = getTheme(resolvedColorScheme);
  const palette = resolvedColorScheme === "dark" ? darkColors : lightColors;
  const styles = createStyles(colors, palette);
  const isMessageDetail =
    pathname.startsWith("/messages/") && pathname !== "/messages";
  const isCreateRequest = pathname === "/home/requests/create";
  const isMapScreen = pathname === "/home/requests/map";
  const isEditRequest = /^\/home\/requests\/[^/]+\/edit$/.test(pathname);
  const isProfileRequestSubScreen = pathname.startsWith("/profile/requests/");
  const shouldHideTabBar =
    isMessageDetail ||
    isCreateRequest ||
    isMapScreen ||
    isEditRequest ||
    isProfileRequestSubScreen;

  if (shouldHideTabBar) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom:
            Platform.OS === "ios"
              ? Math.max(insets.bottom, TAB_BAR_CONSTANTS.PADDING_BOTTOM)
              : TAB_BAR_CONSTANTS.PADDING_BOTTOM,
        },
      ]}
    >
      {tabs.map((tab) => {
        const matchPaths = tab.activeMatchPaths ?? [tab.href];
        const isFocused = matchPaths.some(
          (path) => pathname === path || pathname.startsWith(`${path}/`)
        );
        const iconName = isFocused && tab.activeIcon ? tab.activeIcon : tab.icon;
        const label =
          tab.key === "post"
            ? ""
            : (() => {
                const descriptor = Object.values(descriptors).find(
                  (item) => item.route.name === tab.screenName
                );
                const options = descriptor?.options;
                if (typeof options?.tabBarLabel === "string") {
                  return options.tabBarLabel;
                }
                if (typeof options?.title === "string") {
                  return options.title;
                }
                return tab.label;
              })();

        const handlePress = () => {
          if (tab.key === "post") {
            router.push(tab.href as `/${string}`);
            return;
          }

          router.replace(tab.href as `/${string}`);
        };

        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              tab.key === "post" ? styles.postTabButton : null,
              isFocused && tab.key !== "post" ? styles.tabButtonActive : null,
            ]}
            onPress={handlePress}
            activeOpacity={0.7}
          >
            {tab.key === "post" ? (
              <View style={styles.postFab}>
                <FontAwesome name={iconName} size={24} color={palette.textInverse} />
              </View>
            ) : (
              <View
                style={[
                  styles.iconWrapper,
                  isFocused ? styles.iconWrapperActive : null,
                ]}
              >
                <FontAwesome
                  name={iconName}
                  size={
                    tab.key === "notifications" && !!tab.badge
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
            )}

            {tab.key !== "post" ? (
              <Text
                style={[
                  styles.label,
                  isFocused ? styles.labelActive : styles.labelInactive,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
