import React from "react";
import { StyleSheet, Text, View } from "react-native";

import BrowseRequestsScreen from "@/features/helpRequest/screens/BrowseRequestsScreen";
import { WebSectionShell } from "@/features/web/components/WebSectionShell";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

export default function BrowseMapWebRoute() {
  const { palette } = useThemeContext();

  return (
    <WebSectionShell
      activeKey="map"
      rightPanel={
        <View style={[styles.panel, { borderColor: palette.border, backgroundColor: palette.surface }]}> 
          <Text style={[styles.title, { color: palette.textPrimary }]}>Map View</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>Open request map optimized for geospatial browsing and quick selection.</Text>
        </View>
      }
    >
      <BrowseRequestsScreen />
    </WebSectionShell>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
});
