import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/design-system/theme";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

const InboxEmptyState: React.FC = () => {
    const { palette } = useThemeContext();

    return (
        <View
            style={[
                styles.shell,
                {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                },
            ]}
        >
            <View
                style={[
                    styles.iconWrap,
                    { backgroundColor: palette.primarySoft },
                ]}
            >
                <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={26}
                    color={palette.primary}
                />
            </View>

            <Text style={[styles.title, { color: palette.textPrimary }]}>
                No assigned request conversations yet
            </Text>
            <Text style={[styles.body, { color: palette.textSecondary }]}>
                Conversations appear only after a requester accepts a bid and the request moves
                into an assigned handoff.
            </Text>

            <View
                style={[
                    styles.tipRow,
                    {
                        backgroundColor: palette.surfaceSecondary,
                        borderColor: palette.border,
                    },
                ]}
            >
                <Ionicons name="git-merge-outline" size={16} color={palette.primary} />
                <Text style={[styles.tipText, { color: palette.textSecondary }]}>
                    Create a request, receive bids, accept one helper, and the chat opens
                    automatically.
                </Text>
            </View>

            <View
                style={[
                    styles.cta,
                    {
                        backgroundColor: palette.primary,
                    },
                ]}
            >
                <Text style={[styles.ctaText, { color: palette.textInverse }]}>
                    Assigned request chats will show up here
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    shell: {
        borderWidth: 1,
        borderRadius: 28,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.xl,
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    iconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: theme.spacing.xs,
    },
    title: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        textAlign: "center",
    },
    body: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: 22,
        textAlign: "center",
    },
    tipRow: {
        width: "100%",
        borderWidth: 1,
        borderRadius: 18,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.xs,
        marginTop: theme.spacing.xs,
    },
    tipText: {
        flex: 1,
        fontSize: theme.typography.fontSize.sm,
        lineHeight: 20,
    },
    cta: {
        minHeight: 48,
        borderRadius: theme.radius.fill,
        paddingHorizontal: theme.spacing.lg,
        alignItems: "center",
        justifyContent: "center",
        marginTop: theme.spacing.xs,
    },
    ctaText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        textAlign: "center",
    },
});

export default InboxEmptyState;
