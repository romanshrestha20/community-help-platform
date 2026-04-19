import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { ScreenView, theme } from "@/design-system";
import { APP_ROUTES } from "@/config/routes";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

export default function RequestMapScreen() {
  const router = useRouter();
  const { palette } = useThemeContext();

  return (
    <ScreenView style={styles.screen}>
      <AppHeader
        title="Request map"
        subtitle="Explore nearby requests geographically."
        showBackButton
        backButtonProps={{
          fallback: APP_ROUTES.HOME_REQUESTS,
          variant: "secondary",
        }}
        rightAction={{
          icon: "list-outline",
          onPress: () => router.replace(APP_ROUTES.HOME_REQUESTS),
          accessibilityLabel: "Switch to list view",
          color: palette.textPrimary,
        }}
      />

      <View
        style={[
          styles.previewShell,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
      >
        <View style={styles.previewHeader}>
          <View style={styles.previewCopy}>
            <Text style={[styles.eyebrow, { color: palette.primary }]}>Nearby map</Text>
            <Text style={[styles.stateTitle, { color: palette.textPrimary }]}>
              Native build required for live map interactions
            </Text>
            <Text style={[styles.stateBody, { color: palette.textSecondary }]}>
              The native screen now includes search, category filters, and request
              exploration on the map. Open the iPhone or Android build to test
              markers, current location, and recenter behavior.
            </Text>
          </View>

          <View
            style={[
              styles.badge,
              { backgroundColor: palette.surfaceMuted, borderColor: palette.border },
            ]}
          >
            <Ionicons name="phone-portrait-outline" size={16} color={palette.primary} />
            <Text style={[styles.badgeText, { color: palette.textPrimary }]}>
              Native only
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.mockMap,
            { backgroundColor: palette.surfaceMuted, borderColor: palette.border },
          ]}
        >
          <View style={styles.mockSearchRow}>
            <View
              style={[
                styles.mockSearch,
                { backgroundColor: palette.surface, borderColor: palette.border },
              ]}
            >
              <Ionicons name="search-outline" size={16} color={palette.textSecondary} />
              <Text style={[styles.mockSearchText, { color: palette.textSecondary }]}>
                Search requests on the map...
              </Text>
            </View>

            <View
              style={[
                styles.mockListButton,
                { backgroundColor: palette.surface, borderColor: palette.border },
              ]}
            >
              <Text style={[styles.mockListButtonText, { color: palette.textPrimary }]}>
                List
              </Text>
            </View>
          </View>

          <View style={styles.mockCanvas}>
            <View
              style={[
                styles.mockCountPill,
                { backgroundColor: palette.surface, borderColor: palette.border },
              ]}
            >
              <Ionicons name="location-outline" size={14} color={palette.primary} />
              <Text style={[styles.mockCountText, { color: palette.textPrimary }]}>
                Nearby requests
              </Text>
            </View>

            <View
              style={[
                styles.mockMarker,
                styles.mockMarkerPrimary,
                { backgroundColor: palette.primary },
              ]}
            />
            <View
              style={[
                styles.mockMarker,
                styles.mockMarkerSecondary,
                { backgroundColor: palette.primary },
              ]}
            />
            <View
              style={[
                styles.mockMarker,
                styles.mockMarkerTertiary,
                { backgroundColor: palette.primary },
              ]}
            />
          </View>
        </View>

        <View style={styles.actionWrap}>
          <AppButton
            title="Back to list"
            variant="secondary"
            onPress={() => router.replace(APP_ROUTES.HOME_REQUESTS)}
          />
        </View>
      </View>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  previewShell: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  previewCopy: {
    flex: 1,
    gap: 6,
  },
  eyebrow: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  badge: {
    minHeight: 36,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  stateTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  stateBody: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 22,
  },
  mockMap: {
    flex: 1,
    minHeight: 280,
    borderWidth: 1,
    borderRadius: 24,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  mockSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  mockSearch: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mockSearchText: {
    fontSize: theme.typography.fontSize.sm,
  },
  mockListButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  mockListButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  mockCanvas: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#DCE8D4",
    position: "relative",
  },
  mockCountPill: {
    position: "absolute",
    top: theme.spacing.md,
    left: theme.spacing.md,
    zIndex: 1,
    minHeight: 38,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mockCountText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  mockMarker: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.8)",
  },
  mockMarkerPrimary: {
    top: "34%",
    left: "38%",
  },
  mockMarkerSecondary: {
    top: "52%",
    left: "58%",
  },
  mockMarkerTertiary: {
    top: "62%",
    left: "24%",
  },
  actionWrap: {
    marginTop: theme.spacing.xs,
    alignSelf: "flex-start",
  },
});
