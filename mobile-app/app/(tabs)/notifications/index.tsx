/**
 * Notifications Tab Screen
 * Displays user notifications for help requests, bids, and messages
 */

import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { TabScreenContainer } from "@/components/ui/TabScreenContainer";
import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: theme.spacing.md,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        marginBottom: theme.spacing.md,
    },
    placeholder: {
        fontSize: 16,
        textAlign: "center",
        marginTop: theme.spacing.xl,
    },
});

/**
 * Notifications screen showing user activity notifications
 */
export default function NotificationsScreen() {
    const { colors } = useThemeContext();

    return (
        <TabScreenContainer>
            <View style={styles.container}>
                <Text style={[styles.title, { color: colors.primaryColor }]}>Notifications</Text>
                <Text style={[styles.placeholder, { color: colors.secondaryColor }]}>Your notifications will appear here</Text>
            </View>
        </TabScreenContainer>
    );
}
