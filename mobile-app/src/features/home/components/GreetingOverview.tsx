import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card, theme } from "@/design-system";

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
    return (
        <Card style={styles.overviewCard}>
            <View style={styles.headerBlock}>
                <Text style={styles.overviewEyebrow}>Dashboard</Text>
                <Text style={styles.overviewTitle}>Welcome back, {name}</Text>
                <View style={styles.locationRow}>
                    <View style={styles.locationTextWrap}>
                        <Text style={styles.locationLabel}>Your location</Text>
                        <Text style={styles.locationValue}>{location}</Text>
                    </View>
                    <View style={styles.locationButtonWrap}>
                        <AppButton
                            title="Update Location"
                            onPress={onUpdateLocation ?? (() => { })}
                            variant="ghost"
                            fullWidth={false}
                        />
                    </View>
                </View>
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
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.borderStrong,
        borderRadius: theme.radius.lg,
    },
    headerBlock: {
        marginBottom: theme.spacing.md,
    },
    overviewEyebrow: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 2,
    },
    overviewTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.sm,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.sm,
    },
    locationTextWrap: {
        flex: 1,
    },
    locationLabel: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.fontSize.xs,
        marginBottom: 2,
    },
    locationValue: {
        color: theme.colors.textPrimary,
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    locationButtonWrap: {
        alignSelf: "flex-end",
    },
    metricsRow: {
        flexDirection: "row",
        gap: theme.spacing.sm,
    },
});
