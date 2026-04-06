import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/design-system";

export default function NotFoundScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Page not found</Text>
            <Text style={styles.subtitle}>The route you tried to open does not exist.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacing.lg,
    },
    title: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xxs,
    },
    subtitle: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
        textAlign: "center",
    },
});
