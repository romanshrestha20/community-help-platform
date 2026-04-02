import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

import { OverviewMetric } from "./OverviewMetric";
import { AppButton } from "@/components/ui/AppButton";

interface GreetingOverviewProps {
    name?: string;
    activeRequests: number;
    recentBids: number;
    location?: string;
    onUpdateLocation?: () => void;
}

export const GreetingOverview: React.FC<GreetingOverviewProps> = ({
    name = "User",
    activeRequests,
    recentBids,
    location = "N/A",
    onUpdateLocation,
}) => {
    const { palette } = useThemeContext();
    const requestMomentum = activeRequests > 0 ? `${activeRequests} live requests nearby` : "No active requests yet";

    return (
        <Card style={[styles.overviewCard, { backgroundColor: palette.surface, borderColor: palette.borderStrong }]}>
            <View style={[styles.topBadge, { backgroundColor: palette.primary + "14" }]}>
                <Text style={[styles.topBadgeText, { color: palette.primary }]}>Live dashboard</Text>
            </View>

            <View style={styles.headerBlock}>
                <Text style={[styles.overviewEyebrow, { color: palette.textSecondary }]}>Good to see you</Text>
                <Text style={[styles.overviewTitle, { color: palette.textPrimary }]}>Welcome back, {name}</Text>
                <Text style={[styles.overviewSubtitle, { color: palette.textSecondary }]}>{requestMomentum}</Text>
            </View>

            <View style={[styles.locationBanner, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                <View style={styles.locationTextWrap}>
                    <Text style={[styles.locationLabel, { color: palette.textSecondary }]}>Current location</Text>
                    <Text style={[styles.locationValue, { color: palette.textPrimary }]} numberOfLines={1}>
                        {location}
                    </Text>
                </View>
                <AppButton
                    title="Update"
                    onPress={onUpdateLocation ?? (() => { })}
                    variant="ghost"
                    fullWidth={false}
                />
            </View>

            <View style={styles.metricsRow}>
                <OverviewMetric label="Active Requests" value={activeRequests} />
                <OverviewMetric label="Recent Bids" value={recentBids} />
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    overviewCard: {
        marginTop: theme.spacing.sm,
        borderRadius: 28,
        padding: theme.spacing.md,
        gap: theme.spacing.md,
        overflow: "hidden",
    },
    topBadge: {
        alignSelf: "flex-start",
        borderRadius: 999,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 6,
    },
    topBadgeText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semibold,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    headerBlock: {
        gap: 4,
    },
    overviewEyebrow: {
        fontSize: theme.typography.fontSize.xs,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    overviewTitle: {
        fontSize: 26,
        lineHeight: 30,
        fontWeight: theme.typography.fontWeight.bold,
    },
    overviewSubtitle: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
        marginTop: 2,
    },
    locationBanner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.md,
        borderWidth: 1,
        borderRadius: 22,
        padding: theme.spacing.md,
    },
    locationTextWrap: {
        flex: 1,
    },
    locationLabel: {
        fontSize: theme.typography.fontSize.xs,
        marginBottom: 2,
    },
    locationValue: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    metricsRow: {
        flexDirection: "row",
        gap: theme.spacing.sm,
    },
});
