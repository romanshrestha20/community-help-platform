import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { RequestMapView } from "@/features/map/components/RequestMapView";
import { HelpRequest } from "@/features/helpRequest/types/helpRequest.types";
import { AppLocation } from "@/features/location/types/location.types";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  requests: HelpRequest[];
  loading: boolean;
  userLocation?: AppLocation | null;
  onOpenRequest: (requestId: string) => void;
  onBidRequest: (request: HelpRequest) => void;
};

export const RequestMapPanel = ({ requests, loading, userLocation, onOpenRequest, onBidRequest }: Props) => {
  const { palette } = useThemeContext();
  return (
    <View style={[styles.wrap, { borderColor: palette.border, backgroundColor: palette.surface }]}>
      <View style={[styles.header, { borderColor: palette.border }]}>
        <View style={styles.headerTitle}>
          <Ionicons name="map-outline" size={15} color={palette.primary} />
          <Text style={[styles.headerText, { color: palette.textPrimary }]}>Nearby map</Text>
        </View>
        <Text style={[styles.headerCount, { color: palette.textSecondary }]}>{requests.length} requests</Text>
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#2E9D74" }]} />
          <Text style={[styles.legendText, { color: palette.textSecondary }]}>Open</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#DC2626" }]} />
          <Text style={[styles.legendText, { color: palette.textSecondary }]}>Urgent</Text>
        </View>
      </View>
      <RequestMapView
        requests={requests}
        loading={loading}
        userLocation={userLocation ?? undefined}
        onOpenRequest={onOpenRequest}
        onBidRequest={onBidRequest}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 300,
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  header: {
    minHeight: 44,
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerText: {
    fontSize: 13,
    fontWeight: "800",
  },
  headerCount: {
    fontSize: 12,
    fontWeight: "700",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  legendText: {
    fontSize: 11,
  },
});
