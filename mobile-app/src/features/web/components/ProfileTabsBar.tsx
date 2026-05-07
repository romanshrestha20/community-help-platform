import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";

import { APP_ROUTES } from "@/config/routes";
import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type TabItem = {
  label: string;
  href: string;
  active: (pathname: string) => boolean;
};

const tabs: TabItem[] = [
  {
    label: "My Requests",
    href: APP_ROUTES.PROFILE_REQUESTS,
    active: (pathname) => pathname === APP_ROUTES.PROFILE_REQUESTS || pathname.startsWith(`${APP_ROUTES.PROFILE_REQUESTS}/`),
  },
  {
    label: "My Bids",
    href: APP_ROUTES.PROFILE_BIDS,
    active: (pathname) => pathname === APP_ROUTES.PROFILE_BIDS || pathname.startsWith(`${APP_ROUTES.PROFILE_BIDS}/`),
  },
  {
    label: "Saved Requests",
    href: APP_ROUTES.FAVORITES,
    active: (pathname) => pathname === APP_ROUTES.FAVORITES || pathname.startsWith(`${APP_ROUTES.FAVORITES}/`),
  },
  {
    label: "Reviews",
    href: "/profile/activity-history?tab=reviews",
    active: () => false,
  },
  {
    label: "Activity",
    href: "/profile/activity-history?tab=requests",
    active: () => false,
  },
  {
    label: "Settings",
    href: APP_ROUTES.PROFILE,
    active: (pathname) => pathname === APP_ROUTES.PROFILE,
  },
  {
    label: "Payment",
    href: APP_ROUTES.PROFILE,
    active: (pathname) => pathname === APP_ROUTES.PROFILE,
  },
  {
    label: "Security",
    href: APP_ROUTES.PROFILE_PRIVACY,
    active: (pathname) => pathname === APP_ROUTES.PROFILE_PRIVACY || pathname.startsWith(`${APP_ROUTES.PROFILE_PRIVACY}/`),
  },
];

export const ProfileTabsBar = () => {
  const { palette } = useThemeContext();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ tab?: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 1200;
  const currentTab = typeof params.tab === "string" ? params.tab : "";
  const inActivityHistory = pathname === "/profile/activity-history";

  const resolvedTabs = useMemo(
    () =>
      tabs.map((tab) => {
        let isActive = tab.active(pathname);
        if (tab.label === "Reviews") {
          isActive = inActivityHistory && currentTab === "reviews";
        }
        if (tab.label === "Activity") {
          isActive = inActivityHistory && currentTab !== "reviews";
        }
        return { ...tab, isActive };
      }),
    [currentTab, inActivityHistory, pathname]
  );

  if (!isDesktopWeb) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {resolvedTabs.map((tab) => (
          <Pressable
            key={tab.label}
            onPress={() => router.push(tab.href as never)}
            style={[
              styles.pill,
              {
                borderColor: tab.isActive ? palette.primary : palette.border,
                backgroundColor: tab.isActive ? palette.primarySoft : palette.surface,
              },
            ]}
          >
            <Text style={[styles.pillText, { color: tab.isActive ? palette.primary : palette.textSecondary }]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: theme.spacing.sm,
  },
  row: {
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingRight: theme.spacing.md,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "700",
  },
});
