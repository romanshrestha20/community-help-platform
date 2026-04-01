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

    return (
        <Card style={[styles.overviewCard, { backgroundColor: palette.surface, borderColor: palette.borderStrong }]}>
            <View style={styles.headerBlock}>
                <Text style={[styles.overviewEyebrow, { color: palette.textSecondary }]}>Dashboard</Text>
                <Text style={[styles.overviewTitle, { color: palette.textPrimary }]}>Welcome back, {name}</Text>
                <View style={styles.locationRow}>
                    <View style={styles.locationTextWrap}>
                        <Text style={[styles.locationLabel, { color: palette.textSecondary }]}>Your location</Text>
                        <Text style={[styles.locationValue, { color: palette.textPrimary }]}>{location}</Text>
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
        borderRadius: theme.radius.lg,
    },
    headerBlock: {
        marginBottom: theme.spacing.md,
    },
    overviewEyebrow: {
        fontSize: theme.typography.fontSize.xs,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 2,
    },
    overviewTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
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
        fontSize: theme.typography.fontSize.xs,
        marginBottom: 2,
    },
    locationValue: {
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
