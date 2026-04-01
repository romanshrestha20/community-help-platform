import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/design-system";

interface HomeHeaderProps {
    title?: string;
    subtitle?: string;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
    title = "Home",
    subtitle = "Track requests and bids in one place",
}) => {
    return (
        <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>{title}</Text>
            <Text style={styles.pageSubtitle}>{subtitle}</Text>
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
        color: theme.colors.textPrimary,
        marginBottom: 2,
    },
    pageSubtitle: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.fontSize.sm,
    },
});
