import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { RequestDetailsScreen } from "@/features/helpRequest/screens/RequestDetailsScreen";
import { WebSectionShell } from "@/features/web/components/WebSectionShell";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

export default function ProfileRequestDetailsWebRoute() {
  const { palette } = useThemeContext();

  return (
    <WebSectionShell
      activeKey="my-requests"
      rightPanel={
        <View style={[styles.panel, { borderColor: palette.border, backgroundColor: palette.surface }]}> 
          <Text style={[styles.title, { color: palette.textPrimary }]}>My Request Details</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>Track bids and status updates for this request.</Text>
        </View>
      }
    >
      <RequestDetailsScreen />
    </WebSectionShell>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  title: { fontSize: 16, fontWeight: "800" },
  body: { fontSize: 13, lineHeight: 18 },
});
