import React, { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AppHeader } from "@/components/ui/AppHeader";
import { Card, Row, ScreenView, Stack, theme } from "@/design-system";
import { RequestCard } from "@/features/helpRequest/components/RequestCard";
import { RequestEmptyState } from "@/features/helpRequest/components/RequestEmptyState";
import { RequestForm } from "@/features/helpRequest/components/RequestForm";
import { useHelpRequest } from "@/features/helpRequest/hooks/helpRequest.hook";
import { useRequestList } from "@/features/helpRequest/hooks/useRequestList";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { APP_ROUTES } from "@/config/routes";
import { showSuccessToast } from "@/utils/toast";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";

export const MyRequestsScreen = () => {
    const router = useRouter();
    const { palette } = useThemeContext();
    const { createHelpRequest } = useHelpRequest();
    const { requests, loading, error, refreshing, refreshRequests } = useRequestList({
        scope: "mine",
    });
    const { value: userLocation } = useLocationPicker({ autoUseCurrentLocationOnMount: true });

    const totalRequests = requests.length;

    const openRequests = useMemo(
        () =>
            requests.filter(
                (request) => request.status === "OPEN" || request.status === "ASSIGNED"
            ).length,
        [requests]
    );

    const closedRequests = useMemo(
        () =>
            requests.filter(
                (request) =>
                    request.status === "COMPLETED" || request.status === "CANCELLED"
            ).length,
        [requests]
    );

    const handleCreateRequest = async (
        data: Parameters<typeof createHelpRequest>[0]
    ) => {
        const created = await createHelpRequest(data);

        if (created) {
            showSuccessToast("Request created");
            await refreshRequests();
        }

        return created;
    };

    return (
        <ScreenView style={styles.screen}>
            <FlatList
                data={requests}
                keyExtractor={(item) => item.id}
                refreshing={refreshing}
                onRefresh={refreshRequests}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <View style={styles.requestCardWrap}>
                        <RequestCard
                            request={item}
                            userLocation={userLocation}
                            onPress={() => router.push(APP_ROUTES.PROFILE_REQUEST_DETAILS(item.id))}
                            primaryActionLabel="Manage"
                            onPrimaryAction={() => router.push(APP_ROUTES.PROFILE_REQUEST_DETAILS(item.id))}
                        />
                    </View>
                )}
                ListHeaderComponent={
                    <View style={styles.headerWrap}>
                        <AppHeader
                            title="My Requests"
                            subtitle="Track requests you posted and manage incoming bids."
                            showBackButton
                            backButtonProps={{
                                fallback: APP_ROUTES.PROFILE,
                                variant: "secondary",
                            }}
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
                                            {totalRequests}
                                        </Text>
                                        <Text style={[styles.metricLabel, { color: palette.textSecondary }]}>
                                            Total
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
                                            {openRequests}
                                        </Text>
                                        <Text style={[styles.metricLabel, { color: palette.textSecondary }]}>
                                            Active
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
                                            {closedRequests}
                                        </Text>
                                        <Text style={[styles.metricLabel, { color: palette.textSecondary }]}>
                                            Closed
                                        </Text>
                                    </View>
                                </Row>
                            </Stack>
                        </Card>

                        <Row justify="space-between" align="center" style={styles.createRow}>
                            <View style={styles.createCopyWrap}>
                                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                                    Need help now?
                                </Text>
                                <Text style={[styles.sectionSubtitle, { color: palette.textSecondary }]}>
                                    Post a request in a few taps.
                                </Text>
                            </View>

                            <RequestForm onSubmit={handleCreateRequest} compactTrigger />
                        </Row>

                        <Text style={[styles.listTitle, { color: palette.textPrimary }]}>
                            Your requests ({totalRequests})
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    <RequestEmptyState
                        title={loading ? "Loading your requests" : "No requests yet"}
                        description={
                            error ||
                            "Requests you create will appear here so you can manage status and bids."
                        }
                    />
                }
                ListFooterComponent={
                    <Text style={[styles.caption, { color: palette.textSecondary }]}>
                        Pull down to refresh your latest request activity.
                    </Text>
                }
            />
        </ScreenView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },

    headerWrap: {
        marginBottom: theme.spacing.lg,
    },
    summaryCard: {
        marginBottom: theme.spacing.lg,
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
    createRow: {
        marginBottom: theme.spacing.sm,
    },
    createCopyWrap: {
        flex: 1,
        paddingRight: theme.spacing.sm,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    sectionSubtitle: {
        marginTop: theme.spacing.xxs,
        fontSize: theme.typography.fontSize.xs,
        lineHeight: theme.typography.lineHeight.xs,
    },
    listTitle: {
        marginTop: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    requestCardWrap: {
        marginBottom: theme.spacing.sm,
    },
    caption: {
        marginTop: theme.spacing.sm,
        fontSize: theme.typography.fontSize.xs,
    },
});

export default MyRequestsScreen;