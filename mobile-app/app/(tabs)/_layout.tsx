import React, { useMemo } from "react";
import { Tabs } from "expo-router";

import { CustomTabBar } from "@/components/ui/CustomTabBar";
import { useBadgeCounts } from "@/hooks/useBadgeCounts";
import { defaultTabsConfig } from "@/config/tabBarConfig";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

export default function TabsLayout() {
  const { colorScheme } = useThemeContext();
  const {
    messages: messageBadgeCount,
    notifications: notificationBadgeCount,
  } = useBadgeCounts();

  const tabsConfig = useMemo(() => {
    return defaultTabsConfig.map((tab) => {
      if (tab.name === "messages") {
        return { ...tab, badge: messageBadgeCount };
      }

      if (tab.name === "notifications") {
        return { ...tab, badge: notificationBadgeCount };
      }

      return tab;
    });
  }, [messageBadgeCount, notificationBadgeCount]);

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
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
    </Tabs>
  );
}