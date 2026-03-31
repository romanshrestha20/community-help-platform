import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/design-system";

interface OverviewMetricProps {
    label: string;
    value: string | number;
}

export const OverviewMetric: React.FC<OverviewMetricProps> = ({ label, value }) => {
    return (
        <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>{label}</Text>
            <Text style={styles.metricValue}>{value}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    metricItem: {
        flex: 1,
        backgroundColor: theme.colors.surfaceMuted,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
    },
    metricLabel: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.fontSize.xs,
        marginBottom: 2,
    },
    metricValue: {
        color: theme.colors.textPrimary,
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
    },
});
