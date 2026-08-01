import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { MyRequestsScreen } from "@/features/helpRequest/screens/MyRequestsScreen";
import { WebSectionShell } from "@/features/web/components/WebSectionShell";
import { ProfileTabsBar } from "@/features/web/components/ProfileTabsBar";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

export default function MyRequestsWebRoute() {
  const { palette } = useThemeContext();

  return (
    <WebSectionShell
      activeKey="my-requests"
      rightPanel={
        <View style={[styles.panel, { borderColor: palette.border, backgroundColor: palette.surface }]}> 
          <Text style={[styles.title, { color: palette.textPrimary }]}>My Requests</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>Track status, bids, and edits for requests you posted.</Text>
        </View>
      }
    >
      <View style={styles.webContent}>
        <ProfileTabsBar />
        <MyRequestsScreen />
      </View>
    </WebSectionShell>
  );
}

const styles = StyleSheet.create({
  webContent: {
    flex: 1,
  },
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
