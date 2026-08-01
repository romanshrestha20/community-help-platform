import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { MyBidsScreen } from "@/features/bid/screens/MyBidsScreen";
import { WebSectionShell } from "@/features/web/components/WebSectionShell";
import { ProfileTabsBar } from "@/features/web/components/ProfileTabsBar";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

export default function MyBidsWebRoute() {
  const { palette } = useThemeContext();

  return (
    <WebSectionShell
      activeKey="my-bids"
      rightPanel={
        <View style={styles.rail}>
          <View style={[styles.panel, { borderColor: palette.border, backgroundColor: palette.surface }]}>
            <Text style={[styles.title, { color: palette.textPrimary }]}>My Bids</Text>
            <Text style={[styles.body, { color: palette.textSecondary }]}>Review submitted offers, outcomes, and next steps.</Text>
          </View>
          <View style={[styles.panel, { borderColor: palette.border, backgroundColor: palette.surface }]}>
            <Text style={[styles.title, { color: palette.textPrimary }]}>Status legend</Text>
            <Text style={[styles.body, { color: palette.textSecondary }]}>Pending: waiting for requester response.</Text>
            <Text style={[styles.body, { color: palette.textSecondary }]}>Accepted: bid selected and active.</Text>
            <Text style={[styles.body, { color: palette.textSecondary }]}>Rejected: requester chose another bid.</Text>
          </View>
        </View>
      }
    >
      <View style={styles.webContent}>
        <ProfileTabsBar />
        <MyBidsScreen />
      </View>
    </WebSectionShell>
  );
}

const styles = StyleSheet.create({
  webContent: {
    flex: 1,
  },
  rail: {
    gap: 10,
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
