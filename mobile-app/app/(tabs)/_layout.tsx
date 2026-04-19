import React, { useMemo } from "react";
import { Tabs } from "expo-router";

import { CustomTabBar } from "@/components/ui/CustomTabBar";
import { useBadgeCounts } from "@/hooks/useBadgeCounts";
import { defaultTabsConfig } from "@/config/tabBarConfig";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useFavoriteStore } from "@/features/favorites/store/favorite.store";

export default function TabsLayout() {
  const { colorScheme } = useThemeContext();
  const favoriteBadgeCount = useFavoriteStore((state) => state.favoriteIds.length);
  const {
    messages: messageBadgeCount,
    notifications: notificationBadgeCount,
  } = useBadgeCounts();

  const tabsConfig = useMemo(() => {
    return defaultTabsConfig.map((tab) => {
      if (tab.name === "messages") {
        return { ...tab, badge: messageBadgeCount };
      }

      if (tab.name === "favorites") {
        return { ...tab, badge: favoriteBadgeCount };
      }

      if (tab.name === "notifications") {
        return { ...tab, badge: notificationBadgeCount };
      }

      return { ...tab, badge: undefined };
    });
  }, [favoriteBadgeCount, messageBadgeCount, notificationBadgeCount]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => (
        <CustomTabBar
          {...props}
          tabs={tabsConfig}
          colorScheme={colorScheme}
        />
      )}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="requests" options={{ title: "My Requests" }} />
      <Tabs.Screen name="messages" options={{ title: "Messages" }} />
      <Tabs.Screen name="favorites" options={{ title: "Saved" }} />
      <Tabs.Screen name="notifications" options={{ title: "Notifications" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
