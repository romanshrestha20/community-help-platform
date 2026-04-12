import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

import { ScreenView, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useAuthStore } from "@/features/auth/store/auth.store";

import { Conversation } from "../types/conversation.type";
import ConversationListItem from "./ConversationListItem";
import InboxEmptyState from "./InboxEmptyState";

interface InboxProps {
    conversations: Conversation[];
    loading?: boolean;
    refreshing?: boolean;
    onRefresh?: () => void;
    onSelectConversation: (conversation: Conversation) => void;
    unreadTotal?: number;
}

const Inbox: React.FC<InboxProps> = ({
    conversations,
    loading,
    refreshing,
    onRefresh,
    onSelectConversation,
    unreadTotal,
}) => {
    const { palette } = useThemeContext();
    const user = useAuthStore((state) => state.user);
    const userId = user?.id || "";

    if (loading && conversations.length === 0) {
        return (
            <ScreenView centered>
                <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color={palette.primary} />
                    <Text style={[styles.loadingLabel, { color: palette.textSecondary }]}>
                        Loading messages
                    </Text>
                </View>
            </ScreenView>
        );
    }

    if (!loading && conversations.length === 0) {
        return (
            <ScreenView centered>
                <InboxEmptyState />
            </ScreenView>
        );
    }

    return (
        <ScreenView style={styles.screen}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: palette.textPrimary }]}>Messages</Text>
                <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
                    Active request conversations and participant updates.
                </Text>

                <View style={styles.metaRow}>
                    <View
                        style={[
                            styles.metaChip,
                            {
                                backgroundColor: palette.surface,
                                borderColor: palette.border,
                            },
                        ]}
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={14} color={palette.textMuted} />
                        <Text style={[styles.metaChipText, { color: palette.textSecondary }]}>
                            {conversations.length} thread{conversations.length === 1 ? "" : "s"}
                        </Text>
                    </View>

                    {typeof unreadTotal === "number" && unreadTotal > 0 ? (
                        <View style={[styles.metaChip, { backgroundColor: palette.primarySoft, borderColor: "transparent" }]}>
                            <Ionicons name="mail-unread-outline" size={14} color={palette.primary} />
                            <Text style={[styles.metaChipText, { color: palette.primary }]}>
                                {unreadTotal} unread
                            </Text>
                        </View>
                    ) : null}
                </View>
            </View>

            <FlatList
                data={conversations}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    onRefresh ? (
                        <RefreshControl
                            refreshing={Boolean(refreshing)}
                            onRefresh={onRefresh}
                            tintColor={palette.primary}
                        />
                    ) : undefined
                }
                renderItem={({ item }) => (
                    <ConversationListItem
                        conversation={item}
                        userId={userId}
                        onPress={() => onSelectConversation(item)}
                    />
                )}
            />
        </ScreenView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    loadingState: {
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    loadingLabel: {
        ...theme.typography.textStyle.bodySmall,
    },
    header: {
        paddingHorizontal: theme.spacing.sm,
        paddingBottom: theme.spacing.sm,
    },
    title: {
        ...theme.typography.textStyle.heading,
    },
    subtitle: {
        ...theme.typography.textStyle.bodySmall,
        marginTop: 4,
    },
    metaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.spacing.xs,
        marginTop: theme.spacing.sm,
    },
    metaChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 7,
    },
    metaChipText: {
        ...theme.typography.textStyle.captionMedium,
    },
    listContent: {
        paddingHorizontal: theme.spacing.sm,
        paddingBottom: theme.spacing.xl,
    },
});

export default Inbox;
