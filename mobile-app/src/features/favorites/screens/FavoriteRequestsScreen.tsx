import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AppHeader } from "@/components/ui/AppHeader";
import { Card, Row, ScreenView, Stack, theme } from "@/design-system";
import { RequestList } from "@/features/helpRequest/components/RequestList";
import { useFavorites } from "@/features/favorites/hooks/favorite.hook";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { APP_ROUTES } from "@/config/routes";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";

export const FavoriteRequestsScreen = () => {
  const router = useRouter();
  const { palette } = useThemeContext();
  const { value: userLocation } = useLocationPicker({ autoUseCurrentLocationOnMount: true });
  const { favoriteRequests, meta, listLoading, error, loadFavoriteRequests } = useFavorites();

  useEffect(() => {
    void loadFavoriteRequests();
  }, [loadFavoriteRequests]);

  const openCount = useMemo(
    () => favoriteRequests.filter((request) => request.status === "OPEN").length,
    [favoriteRequests]
  );

  const closedCount = useMemo(
    () => favoriteRequests.filter((request) => request.status !== "OPEN").length,
    [favoriteRequests]
  );

  return (
    <ScreenView style={styles.screen}>
      <AppHeader
        title="Saved Requests"
        subtitle="Keep promising opportunities in one place."
        align="left"
        showBackButton
        backButtonProps={{ fallback: APP_ROUTES.HOME }}
      />

      <Card style={styles.summaryCard}>
        <Stack gap="sm">
          <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
            Overview
          </Text>

          <Row gap="sm" style={styles.summaryRow}>
            <View
              style={[
                styles.metricTile,
                {
                  backgroundColor: palette.surfaceMuted,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={[styles.metricValue, { color: palette.textPrimary }]}>
                {meta?.total ?? favoriteRequests.length}
              </Text>
              <Text style={[styles.metricLabel, { color: palette.textSecondary }]}>
                Saved
              </Text>
            </View>

            <View
              style={[
                styles.metricTile,
                {
                  backgroundColor: palette.surfaceMuted,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={[styles.metricValue, { color: palette.textPrimary }]}>
                {openCount}
              </Text>
              <Text style={[styles.metricLabel, { color: palette.textSecondary }]}>
                Open
              </Text>
            </View>

            <View
              style={[
                styles.metricTile,
                {
                  backgroundColor: palette.surfaceMuted,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={[styles.metricValue, { color: palette.textPrimary }]}>
                {closedCount}
              </Text>
              <Text style={[styles.metricLabel, { color: palette.textSecondary }]}>
                Closed
              </Text>
            </View>
          </Row>
        </Stack>
      </Card>

      <View style={styles.listWrap}>
        <RequestList
          requests={favoriteRequests}
          userLocation={userLocation}
          onPressItem={(item) => router.push(APP_ROUTES.FAVORITES_REQUEST_DETAILS(item.id))}
          refreshing={listLoading}
          onRefresh={() => {
            void loadFavoriteRequests();
          }}
          emptyTitle={listLoading ? "Loading saved requests" : "No saved requests yet"}
          emptyDescription={
            error ||
            "Tap the heart on any request to save it here for quick access later."
          }
        />
      </View>
    </ScreenView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  summaryCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  summaryRow: {
    flexWrap: "wrap",
  },
  metricTile: {
    flex: 1,
    minWidth: 96,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  metricValue: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  metricLabel: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  listWrap: {
    flex: 1,
  },
});

export default FavoriteRequestsScreen;
