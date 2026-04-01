import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

interface HomeHeaderProps {
    title?: string;
    subtitle?: string;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
    title = "Home",
    subtitle = "Track requests and bids in one place",
}) => {
    const { palette } = useThemeContext();

    return (
        <View style={styles.pageHeader}>
            <Text style={[styles.pageTitle, { color: palette.textPrimary }]}>{title}</Text>
            <Text style={[styles.pageSubtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    pageHeader: {
        marginTop: theme.spacing.xs,
    },
    pageTitle: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: 2,
    },
    pageSubtitle: {
        fontSize: theme.typography.fontSize.sm,
    },
});
