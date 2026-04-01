/**
 * Messages Tab Screen
 * Displays list of user messages and conversations
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
 * Messages screen showing user conversations and messages
 */
export default function MessagesScreen() {
    const { colors } = useThemeContext();

    return (
        <TabScreenContainer>
            <View style={styles.container}>
                <Text style={[styles.title, { color: colors.primaryColor }]}>Messages</Text>
                <Text style={[styles.placeholder, { color: colors.secondaryColor }]}>Your messages will appear here</Text>
            </View>
        </TabScreenContainer>
    );
}
