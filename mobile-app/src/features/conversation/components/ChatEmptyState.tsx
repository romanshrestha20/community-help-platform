import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

interface ChatEmptyStateProps {
    requestScoped?: boolean;
}

const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({ requestScoped = false }) => {
    const { palette } = useThemeContext();

    return (
        <View style={styles.container}>
            <Card
                style={[
                    styles.card,
                    {
                        backgroundColor: palette.surface,
                        borderColor: palette.border,
                    },
                ]}
            >
                <Stack gap="sm" style={styles.content}>
                    <View style={[styles.iconWrap, { backgroundColor: palette.surfaceMuted }]}>
                        <Ionicons name="chatbubble-ellipses-outline" size={24} color={palette.textSecondary} />
                    </View>
                    <Text style={[styles.title, { color: palette.textPrimary }]}>
                        {requestScoped ? "Conversation not available yet" : "No messages yet"}
                    </Text>
                    <Text style={[styles.body, { color: palette.textSecondary }]}>
                        {requestScoped
                            ? "Chat starts only after a bid is accepted and the request becomes assigned."
                            : "Use this thread for request-specific updates, coordination, and clear next steps."}
                    </Text>
                    {requestScoped ? (
                        <View
                            style={[
                                styles.note,
                                {
                                    backgroundColor: palette.surfaceSecondary,
                                    borderColor: palette.border,
                                },
                            ]}
                        >
                            <Text style={[styles.noteText, { color: palette.textSecondary }]}>
                                Flow: request created, bids received, one helper accepted, then one
                                request conversation opens.
                            </Text>
                        </View>
                    ) : null}
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
        borderWidth: 1,
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
    note: {
        width: "100%",
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    noteText: {
        ...theme.typography.textStyle.bodySmall,
        textAlign: "center",
    },
});

export default ChatEmptyState;
