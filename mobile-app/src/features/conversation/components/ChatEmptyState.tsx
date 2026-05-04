import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

interface ChatEmptyStateProps {
    requestScoped?: boolean;
    ctaLabel?: string;
    onPressCta?: () => void;
}

const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({ requestScoped = false, ctaLabel, onPressCta }) => {
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
            {ctaLabel && onPressCta ? (
                <Pressable
                    onPress={onPressCta}
                    style={({ pressed }) => [
                        styles.cta,
                        { borderColor: palette.borderStrong, backgroundColor: palette.surfaceMuted, opacity: pressed ? 0.8 : 1 },
                    ]}
                >
                    <Text style={[styles.ctaText, { color: palette.textPrimary }]}>{ctaLabel}</Text>
                </Pressable>
            ) : null}
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
    cta: {
        marginTop: theme.spacing.sm,
        minHeight: 42,
        borderWidth: 1,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.md,
        alignItems: "center",
        justifyContent: "center",
    },
    ctaText: {
        ...theme.typography.textStyle.bodySmall,
        fontWeight: "700",
    },
});

export default ChatEmptyState;
