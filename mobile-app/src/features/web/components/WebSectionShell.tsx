import React, { useState } from "react";
import { Platform, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";

import { WebAppShell } from "@/components/layout/WebAppShell";
import { WebSidebar, SidebarItem } from "@/components/layout/WebSidebar";
import { WebTopNav } from "@/components/layout/WebTopNav";
import { APP_ROUTES } from "@/config/routes";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";
import type { AppLocation } from "@/features/location/types/location.types";
import { showErrorToast } from "@/utils/toast";

type ActiveKey =
  | "home"
  | "browse"
  | "map"
  | "messages"
  | "my-requests"
  | "my-bids"
  | "saved"
  | "notifications"
  | "profile"
  | "settings";

type Props = {
  activeKey: ActiveKey;
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
  rightPanelWidth?: number;
  fullBleedContent?: boolean;
};

export const WebSectionShell = ({
  activeKey,
  children,
  rightPanel,
  rightPanelWidth = 392,
  fullBleedContent = false,
}: Props) => {
  const { width } = useWindowDimensions();
  const isDesktopShell = Platform.OS === "web" && width >= 1200;
  const router = useRouter();
  const { handleLogout } = useAuth();
  const user = useAuthStore((state) => state.user);
  const {
    value: userLocation,
    setValue: setUserLocation,
    useCurrentLocation: requestCurrentLocation,
  } = useLocationPicker({
    autoUseCurrentLocationOnMount: true,
  });
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const sidebarCollapsed = width < 1360;

  const mainItems: SidebarItem[] = [
    { key: "home", label: "Home", icon: "home-outline", onPress: () => router.push(APP_ROUTES.HOME) },
    { key: "browse", label: "Browse Requests", icon: "search-outline", onPress: () => router.push(APP_ROUTES.HOME_REQUESTS) },
    { key: "map", label: "Map", icon: "map-outline", onPress: () => router.push(APP_ROUTES.HOME_REQUESTS_MAP) },
    { key: "messages", label: "Messages", icon: "chatbubble-outline", onPress: () => router.push("/messages") },
  ];

  const activityItems: SidebarItem[] = [
    { key: "my-requests", label: "My Requests", icon: "list-outline", onPress: () => router.push(APP_ROUTES.PROFILE_REQUESTS) },
    { key: "my-bids", label: "My Bids", icon: "cash-outline", onPress: () => router.push(APP_ROUTES.PROFILE_BIDS) },
    { key: "saved", label: "Saved", icon: "bookmark-outline", onPress: () => router.push(APP_ROUTES.FAVORITES) },
    { key: "notifications", label: "Notifications", icon: "notifications-outline", onPress: () => router.push("/notifications") },
  ];

  const accountItems: SidebarItem[] = [
    { key: "profile", label: "Profile", icon: "person-outline", onPress: () => router.push(APP_ROUTES.PROFILE) },
    { key: "settings", label: "Settings", icon: "settings-outline", onPress: () => router.push(APP_ROUTES.PROFILE_PRIVACY) },
  ];

  const handleSubmitGlobalSearch = (query: string) => {
    if (!query) return;
    router.push({ pathname: APP_ROUTES.HOME_REQUESTS, params: { q: query } } as never);
  };
  const handleSignOut = async () => {
    try {
      await handleLogout();
      router.replace(APP_ROUTES.AUTH_LOGIN);
    } catch {
      showErrorToast("Logout failed", "Please try again.");
    }
  };
  const locationOptions: { id: string; label: string; location: AppLocation }[] = [
    {
      id: "helsinki",
      label: "Helsinki",
      location: { latitude: 60.1699, longitude: 24.9384, city: "Helsinki", country: "Finland", countryCode: "FI", formattedAddress: "Helsinki, Finland" },
    },
    {
      id: "espoo",
      label: "Espoo",
      location: { latitude: 60.2055, longitude: 24.6559, city: "Espoo", country: "Finland", countryCode: "FI", formattedAddress: "Espoo, Finland" },
    },
    {
      id: "vantaa",
      label: "Vantaa",
      location: { latitude: 60.2934, longitude: 25.0378, city: "Vantaa", country: "Finland", countryCode: "FI", formattedAddress: "Vantaa, Finland" },
    },
    {
      id: "turku",
      label: "Turku",
      location: { latitude: 60.4518, longitude: 22.2666, city: "Turku", country: "Finland", countryCode: "FI", formattedAddress: "Turku, Finland" },
    },
  ];
  const currentLocationOption = locationOptions.find((option) => option.id === selectedLocationId) ?? null;
  const locationLabel = currentLocationOption?.label || userLocation?.city || user?.profile?.address?.city || "Helsinki";

  const handleSelectLocation = (optionId: string) => {
    const selected = locationOptions.find((option) => option.id === optionId);
    if (!selected) return;
    setSelectedLocationId(selected.id);
    void setUserLocation(selected.location);
  };

  if (!isDesktopShell) {
    return <>{children}</>;
  }

  return (
    <WebAppShell
      topNav={
        <WebTopNav
          locationLabel={locationLabel}
          globalSearchQuery={globalSearchQuery}
          onChangeGlobalSearch={setGlobalSearchQuery}
          onPostRequest={() => router.push(APP_ROUTES.HOME_REQUESTS)}
          onSubmitGlobalSearch={handleSubmitGlobalSearch}
          onPressHome={() => router.push(APP_ROUTES.HOME)}
          onPressLocation={() => router.push(APP_ROUTES.LOCATION_PICKER)}
          onPressNotifications={() => router.push("/notifications")}
          onPressMessages={() => router.push("/messages")}
          onPressProfile={() => router.push(APP_ROUTES.PROFILE)}
          onPressSettings={() => router.push(APP_ROUTES.PROFILE_PRIVACY)}
          onPressLogout={handleSignOut}
          locationOptions={locationOptions.map((option) => ({ id: option.id, label: option.label }))}
          selectedLocationId={selectedLocationId}
          onSelectLocation={handleSelectLocation}
          onUseCurrentLocation={() => {
            void requestCurrentLocation();
          }}
          fullName={user?.fullName || user?.profile?.fullName}
          avatarUrl={user?.avatarUrl}
        />
      }
      sidebar={
        <WebSidebar
          sections={[
            { key: "main", label: "Main", items: mainItems },
            { key: "activity", label: "Activity", items: activityItems },
            { key: "account", label: "Account", items: accountItems },
          ]}
          activeKey={activeKey}
          collapsed={sidebarCollapsed}
        />
      }
      rightPanel={rightPanel}
      rightPanelWidth={rightPanelWidth}
      mainPadding={fullBleedContent ? 0 : 18}
    >
      {children}
    </WebAppShell>
  );
};
