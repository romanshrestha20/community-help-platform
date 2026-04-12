import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

const ChatEmptyState: React.FC = () => {
    const { palette } = useThemeContext();

    return (
        <View style={styles.container}>
            <Card style={styles.card}>
                <Stack gap="sm" style={styles.content}>
                    <View style={[styles.iconWrap, { backgroundColor: palette.surfaceMuted }]}>
                        <Ionicons name="chatbubble-ellipses-outline" size={24} color={palette.textSecondary} />
                    </View>
                    <Text style={[styles.title, { color: palette.textPrimary }]}>No messages yet</Text>
                    <Text style={[styles.body, { color: palette.textSecondary }]}>
                        Use this thread for request-specific updates, coordination, and clear next steps.
                    </Text>
                </Stack>
            </Card>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.xxl,
    },
    card: {
        width: "100%",
        maxWidth: 360,
    },
    content: {
        alignItems: "center",
    },
    iconWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        ...theme.typography.textStyle.title,
        textAlign: "center",
    },
    body: {
        ...theme.typography.textStyle.bodySmall,
        textAlign: "center",
    },
});

export default ChatEmptyState;
