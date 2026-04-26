import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

interface ChatEmptyStateProps {
    requestScoped?: boolean;
}

const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({ requestScoped = false }) => {
    const { palette } = useThemeContext();

    return (
        <View style={styles.container}>
            <View style={[styles.iconWrap, { backgroundColor: palette.surfaceMuted }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={22} color={palette.textSecondary} />
            </View>
            <Text style={[styles.title, { color: palette.textPrimary }]}>
                {requestScoped ? "Conversation unavailable" : "No messages yet"}
            </Text>
            <Text style={[styles.body, { color: palette.textSecondary }]}>
                {requestScoped
                    ? "Chat opens after a helper is accepted and the request becomes assigned."
                    : "Use this thread for updates, logistics, and clear next steps."}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.xxl,
        gap: theme.spacing.sm,
    },
    iconWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        ...theme.typography.textStyle.bodyMedium,
        fontWeight: "700",
        textAlign: "center",
    },
    body: {
        ...theme.typography.textStyle.bodySmall,
        textAlign: "center",
        maxWidth: 280,
    },
});

export default ChatEmptyState;
