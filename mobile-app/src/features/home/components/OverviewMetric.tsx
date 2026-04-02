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
            <View style={[styles.metricAccent, { backgroundColor: palette.primary }]} />
            <Text style={[styles.metricLabel, { color: palette.textSecondary }]}>{label}</Text>
            <Text style={[styles.metricValue, { color: palette.textPrimary }]}>{value}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    metricItem: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        gap: 4,
        minHeight: 92,
        justifyContent: "space-between",
    },
    metricAccent: {
        width: 28,
        height: 4,
        borderRadius: 999,
    },
    metricLabel: {
        fontSize: theme.typography.fontSize.xs,
        textTransform: "uppercase",
        letterSpacing: 0.6,
    },
    metricValue: {
        fontSize: 22,
        lineHeight: 26,
        fontWeight: theme.typography.fontWeight.bold,
    },
});
