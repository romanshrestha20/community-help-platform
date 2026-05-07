import React, { useMemo, useState } from "react";
import { Platform, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";

import BrowseRequestsScreen from "@/features/helpRequest/screens/BrowseRequestsScreen";
import { WebSectionShell } from "@/features/web/components/WebSectionShell";
import {
  RightRequestFilterSidebar,
  RequestFilterValue,
} from "@/components/requests/RightRequestFilterSidebar";
import { APP_ROUTES } from "@/config/routes";

export default function BrowseRequestsRoute() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isDesktopWeb = Platform.OS === "web" && width >= 1024;
  const initialFilters: RequestFilterValue = {
    category: "All",
    distance: "10",
    requestType: "ALL",
    sortBy: "NEWEST",
  };
  const [draftFilters, setDraftFilters] = useState<RequestFilterValue>(initialFilters);
  const activeCount = useMemo(
    () =>
      [
        draftFilters.category !== "All",
        draftFilters.distance !== "10",
        draftFilters.requestType !== "ALL",
        draftFilters.sortBy !== "NEWEST",
      ].filter(Boolean).length,
    [draftFilters]
  );

  if (isDesktopWeb) {
    return (
      <WebSectionShell
        activeKey="browse"
        rightPanel={
          <RightRequestFilterSidebar
            value={draftFilters}
            categories={[
              "All",
              "Urgent",
              "Errands",
              "Transportation",
              "Pet Care",
              "Home & Garden",
              "Tech Support",
              "Moving",
            ]}
            activeCount={activeCount}
            onChange={setDraftFilters}
            onApply={() => {
              router.replace({
                pathname: APP_ROUTES.HOME_REQUESTS,
                params: {
                  category: draftFilters.category,
                  distance: draftFilters.distance,
                  requestType: draftFilters.requestType,
                  sortBy: draftFilters.sortBy,
                },
              } as never);
            }}
            onClear={() => {
              setDraftFilters(initialFilters);
              router.replace({ pathname: APP_ROUTES.HOME_REQUESTS } as never);
            }}
          />
        }
        rightPanelWidth={380}
      >
        <BrowseRequestsScreen />
      </WebSectionShell>
    );
  }

  return <BrowseRequestsScreen />;
}
