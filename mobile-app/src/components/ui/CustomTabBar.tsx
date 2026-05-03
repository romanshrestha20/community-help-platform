import React, { memo, useMemo } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  type PressableStateCallbackType,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  defaultTabsConfig,
  getTheme,
  isPostTab,
  isTabFocused,
  resolveColorScheme,
  shouldHideTabBar,
  TAB_BAR_CONSTANTS,
} from "@/config/tabBarConfig";
import { darkColors, lightColors } from "@/design-system/tokens/colors";
import type { ColorScheme, TabItem } from "@/types/tabBar";

interface CustomTabBarProps extends BottomTabBarProps {
  tabs?: TabItem[];
  colorScheme?: ColorScheme;
}

type Palette = typeof lightColors;
type ThemeColors = ReturnType<typeof getTheme>;
type FontAwesomeIconName = React.ComponentProps<typeof FontAwesome>["name"];

const getResolvedLabel = ({
  tab,
  descriptors,
}: {
  tab: TabItem;
  descriptors: BottomTabBarProps["descriptors"];
}) => {
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
};

const getNavigationTarget = ({
  tab,
  state,
}: {
  tab: TabItem;
  state: BottomTabBarProps["state"];
}) => {
  const route = state.routes.find((item) => item.name === tab.screenName);
  return route?.key;
};

const createStyles = ({
  colors,
  palette,
  isLight,
  bottomInset,
}: {
  colors: ThemeColors;
  palette: Palette;
  isLight: boolean;
  bottomInset: number;
}) => {
  const bottomPadding =
    Platform.OS === "ios"
      ? Math.max(
          TAB_BAR_CONSTANTS.PADDING_BOTTOM,
          bottomInset > 0 ? bottomInset - 10 : 0
        )
      : TAB_BAR_CONSTANTS.PADDING_BOTTOM;

  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: StyleSheet.hairlineWidth,
      minHeight: TAB_BAR_CONSTANTS.HEIGHT + bottomPadding,
      paddingTop: TAB_BAR_CONSTANTS.PADDING_TOP,
      paddingBottom: bottomPadding,
      paddingHorizontal: TAB_BAR_CONSTANTS.PADDING_HORIZONTAL,
    },

    tabButton: {
      flex: 1,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 2,
      paddingHorizontal: 2,
      borderRadius: 16,
    },

    tabButtonActive: {
      backgroundColor: isLight
        ? colors.primaryColor
        : `${colors.primaryColor}1f`,
    },

    tabButtonPressed: {
      opacity: 0.72,
    },

    postTabButton: {
      marginTop: TAB_BAR_CONSTANTS.FAB_RAISE_OFFSET,
    },

    postFab: {
      width: TAB_BAR_CONSTANTS.FAB_SIZE,
      height: TAB_BAR_CONSTANTS.FAB_SIZE,
      borderRadius: TAB_BAR_CONSTANTS.FAB_SIZE / 2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryColor,
      borderWidth: TAB_BAR_CONSTANTS.FAB_BORDER_WIDTH,
      borderColor: palette.surface,
      shadowColor: palette.shadow,
      shadowOpacity: isLight ? 0.3 : 0.45,
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
      backgroundColor: isLight
        ? `${palette.textInverse}22`
        : `${colors.primaryColor}18`,
    },

    label: {
      maxWidth: "100%",
      fontSize: TAB_BAR_CONSTANTS.LABEL_FONT_SIZE,
      fontWeight: TAB_BAR_CONSTANTS.LABEL_FONT_WEIGHT,
      letterSpacing: 0.1,
    },

    labelActive: {
      color: isLight ? palette.textInverse : colors.primaryColor,
    },

    labelInactive: {
      color: palette.textSecondary,
    },

    badge: {
      position: "absolute",
      top: -5,
      right: -8,
      minWidth: TAB_BAR_CONSTANTS.BADGE_MIN_WIDTH,
      height: TAB_BAR_CONSTANTS.BADGE_HEIGHT,
      borderRadius: TAB_BAR_CONSTANTS.BADGE_HEIGHT / 2,
      backgroundColor: palette.danger,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: palette.surface,
      paddingHorizontal: 4,
    },

    badgeText: {
      color: palette.textInverse,
      fontSize: TAB_BAR_CONSTANTS.BADGE_FONT_SIZE,
      fontWeight: "700",
      textAlign: "center",
      lineHeight: 16,
    },
  });
};

type TabBarItemProps = {
  tab: TabItem;
  label: string;
  iconName: FontAwesomeIconName;
  focused: boolean;
  postTab: boolean;
  styles: ReturnType<typeof createStyles>;
  palette: Palette;
  colors: ThemeColors;
  isLight: boolean;
  onPress: () => void;
};

const getButtonStyle =
  ({
    styles,
    postTab,
    focused,
  }: {
    styles: ReturnType<typeof createStyles>;
    postTab: boolean;
    focused: boolean;
  }) =>
  ({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> =>
    [
      styles.tabButton,
      postTab ? styles.postTabButton : null,
      focused && !postTab ? styles.tabButtonActive : null,
      pressed ? styles.tabButtonPressed : null,
    ];

const TabBarItem = memo(
  ({
    tab,
    label,
    iconName,
    focused,
    postTab,
    styles,
    palette,
    colors,
    isLight,
    onPress,
  }: TabBarItemProps) => {
    const iconColor = focused
      ? isLight
        ? palette.textInverse
        : colors.primaryColor
      : colors.secondaryColor;

    const labelStyle: StyleProp<TextStyle> = [
      styles.label,
      focused ? styles.labelActive : styles.labelInactive,
    ];

    const accessibilityLabel =
      postTab || tab.key === "post" ? "Create request" : label || tab.label;

    return (
      <Pressable
        accessibilityRole="tab"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected: focused }}
        hitSlop={8}
        style={getButtonStyle({ styles, postTab, focused })}
        onPress={onPress}
      >
        {postTab ? (
          <View style={styles.postFab}>
            <FontAwesome
              name={iconName}
              size={TAB_BAR_CONSTANTS.FAB_ICON_SIZE}
              color={palette.textInverse}
            />
          </View>
        ) : (
          <>
            <View
              style={[
                styles.iconWrapper,
                focused ? styles.iconWrapperActive : null,
              ]}
            >
              <FontAwesome
                name={iconName}
                size={
                  focused
                    ? TAB_BAR_CONSTANTS.ACTIVE_ICON_SIZE
                    : TAB_BAR_CONSTANTS.ICON_SIZE
                }
                color={iconColor}
              />

              {!!tab.badge && tab.badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {tab.badge > 99 ? "99+" : String(tab.badge)}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={labelStyle} numberOfLines={1}>
              {label}
            </Text>
          </>
        )}
      </Pressable>
    );
  }
);

TabBarItem.displayName = "TabBarItem";

export const CustomTabBar = ({
  tabs = defaultTabsConfig,
  colorScheme,
  descriptors,
  navigation,
  state,
}: CustomTabBarProps) => {
  const systemColorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const resolvedColorScheme = useMemo(
    () => colorScheme ?? resolveColorScheme("system", systemColorScheme),
    [colorScheme, systemColorScheme]
  );

  const isLight = resolvedColorScheme === "light";

  const colors = useMemo(
    () => getTheme(resolvedColorScheme),
    [resolvedColorScheme]
  );

  const palette = isLight ? lightColors : darkColors;

  const styles = useMemo(
    () =>
      createStyles({
        colors,
        palette,
        isLight,
        bottomInset: insets.bottom,
      }),
    [colors, palette, isLight, insets.bottom]
  );

  const hideTabBar = useMemo(() => shouldHideTabBar(pathname), [pathname]);

  if (hideTabBar) {
    return null;
  }

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const focused = isTabFocused(tab, pathname);
        const postTab = isPostTab(tab);

        const iconName = (
          focused && tab.activeIcon ? tab.activeIcon : tab.icon
        ) as FontAwesomeIconName;

        const label = getResolvedLabel({ tab, descriptors });

        const handlePress = () => {
          const target = getNavigationTarget({ tab, state });

          if (target) {
            const event = navigation.emit({
              type: "tabPress",
              target,
              canPreventDefault: true,
            });

            if (event.defaultPrevented) {
              return;
            }
          }

          if (focused && !postTab) {
            return;
          }

          if (postTab) {
            router.push(tab.href as `/${string}`);
            return;
          }

          router.replace(tab.href as `/${string}`);
        };

        return (
          <TabBarItem
            key={tab.key}
            tab={tab}
            label={label}
            iconName={iconName}
            focused={focused}
            postTab={postTab}
            styles={styles}
            palette={palette}
            colors={colors}
            isLight={isLight}
            onPress={handlePress}
          />
        );
      })}
    </View>
  );
};
