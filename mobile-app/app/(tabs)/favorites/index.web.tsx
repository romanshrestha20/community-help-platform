import React from "react";
import { StyleSheet, Text, View } from "react-native";

import FavoriteRequestsScreen from "@/features/favorites/screens/FavoriteRequestsScreen";
import { WebSectionShell } from "@/features/web/components/WebSectionShell";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

export default function FavoritesWebRoute() {
  const { palette } = useThemeContext();

  return (
    <WebSectionShell
      activeKey="saved"
      rightPanel={
        <View style={[styles.panel, { borderColor: palette.border, backgroundColor: palette.surface }]}> 
          <Text style={[styles.title, { color: palette.textPrimary }]}>Saved Requests</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>
            Quickly revisit requests you bookmarked and take action when you're ready.
          </Text>
        </View>
      }
    >
      <FavoriteRequestsScreen />
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
