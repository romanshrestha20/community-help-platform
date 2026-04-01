import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

interface OverviewMetricProps {
    label: string;
    value: string | number;
}

export const OverviewMetric: React.FC<OverviewMetricProps> = ({ label, value }) => {
    const { palette } = useThemeContext();

    return (
        <View style={[styles.metricItem, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
            <Text style={[styles.metricLabel, { color: palette.textSecondary }]}>{label}</Text>
            <Text style={[styles.metricValue, { color: palette.textPrimary }]}>{value}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    metricItem: {
        flex: 1,
        borderWidth: 1,
        borderRadius: theme.radius.md,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
    },
    metricLabel: {
        fontSize: theme.typography.fontSize.xs,
        marginBottom: 2,
    },
    metricValue: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
    },
});
