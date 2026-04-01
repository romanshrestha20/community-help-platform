// app/(tabs)/_layout.tsx

import React from "react";
import { Tabs } from "expo-router";
import { CustomTabBar } from "@/components/ui/CustomTabBar";
import { useBadgeCounts } from "@/hooks/useBadgeCounts";
import { defaultTabsConfig } from "@/config/tabBarConfig";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

export default function TabsLayout() {
  const { colorScheme } = useThemeContext();
  const { messages: messageBadgeCount, notifications: notificationBadgeCount } =
    useBadgeCounts();

  // Create tabs config with updated badge counts
  const tabsConfig = defaultTabsConfig.map((tab) => {
    if (tab.name === "messages") {
      return { ...tab, badge: messageBadgeCount };
    }
    if (tab.name === "notifications") {
      return { ...tab, badge: notificationBadgeCount };
    }
    return tab;
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { position: "absolute", height: 0, display: "none" },
      }}
      tabBar={(props) => (
        <CustomTabBar {...props} tabs={tabsConfig} colorScheme={colorScheme} />
      )}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="messages" options={{ title: "Messages" }} />
      <Tabs.Screen name="notifications" options={{ title: "Notifications" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}