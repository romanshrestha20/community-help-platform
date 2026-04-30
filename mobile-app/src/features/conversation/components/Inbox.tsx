import React, { useMemo } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { SearchField } from "@/components/ui/SearchField";
import { ScreenView, theme } from "@/design-system";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

import { Conversation } from "../types/conversation.type";
import { getLastMessagePreview, getOtherParticipant } from "../utils/conversation.utils";
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
    loading = false,
    refreshing = false,
    onRefresh,
    onSelectConversation,
    unreadTotal = 0,
}) => {
    const { palette } = useThemeContext();
    const user = useAuthStore((state) => state.user);
    const userId = user?.id || "";
    const userEmail = user?.email || "";
    const [searchQuery, setSearchQuery] = React.useState("");

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredConversations = useMemo(() => {
        if (!normalizedQuery) {
            return conversations;
        }

        return conversations.filter((conversation) => {
            const otherParticipant = getOtherParticipant(conversation, userId, userEmail);
            const displayName = otherParticipant?.fullName || "";
            const email = otherParticipant?.email || "";
            const requestTitle = conversation.request.title || "";
            const lastMessagePreview = getLastMessagePreview(conversation, userId) || "";

            return [displayName, email, requestTitle, lastMessagePreview]
                .join(" ")
                .toLowerCase()
                .includes(normalizedQuery);
        });
    }, [conversations, normalizedQuery, userEmail, userId]);

    const resultsLabel = useMemo(() => {
        if (normalizedQuery) {
            const count = filteredConversations.length;
            return `${count} ${count === 1 ? "result" : "results"}`;
        }

        const count = conversations.length;
        return `${count} ${count === 1 ? "conversation" : "conversations"}`;
    }, [conversations.length, filteredConversations.length, normalizedQuery]);

    if (loading && conversations.length === 0) {
        return (
            <ScreenView centered style={styles.screen}>
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="small" color={palette.primary} />
                    <Text style={[styles.loadingTitle, { color: palette.textPrimary }]}>Loading messages</Text>
                    <Text style={[styles.loadingBody, { color: palette.textSecondary }]}>Pulling in your conversations.</Text>
                </View>
            </ScreenView>
        );
    }

    if (!loading && conversations.length === 0) {
        return (
            <ScreenView centered style={styles.screen}>
                <InboxEmptyState />
            </ScreenView>
        );
    }

    return (
        <ScreenView style={styles.screen}>
            <FlatList
                data={filteredConversations}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ConversationListItem
                        conversation={item}
                        userId={userId}
                        onPress={() => onSelectConversation(item)}
                    />
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListHeaderComponent={
                    <View style={styles.headerBlock}>
                        <View style={styles.titleRow}>
                            <Text style={[styles.title, { color: palette.textPrimary }]}>Messages</Text>
                            {unreadTotal > 0 ? (
                                <Text style={[styles.unreadMeta, { color: palette.primary }]}>{unreadTotal} unread</Text>
                            ) : null}
                        </View>

                        <SearchField
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search conversations"
                            returnKeyType="search"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <Text style={[styles.sectionMeta, { color: palette.textSecondary }]}>{resultsLabel}</Text>
                    </View>
                }
                ListEmptyComponent={
                    normalizedQuery ? (
                        <View style={styles.searchEmpty}>
                            <Text style={[styles.searchEmptyTitle, { color: palette.textPrimary }]}>No matching conversations</Text>
                            <Text style={[styles.searchEmptyBody, { color: palette.textSecondary }]}>Try a participant name or request title.</Text>
                        </View>
                    ) : null
                }
                refreshControl={
                    onRefresh ? (
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={palette.primary}
                        />
                    ) : undefined
                }
            />
        </ScreenView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.xl,
    },
    headerBlock: {
        gap: theme.spacing.sm,
        paddingBottom: theme.spacing.sm,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    title: {
        ...theme.typography.textStyle.title,
        fontWeight: "700",
    },
    unreadMeta: {
        ...theme.typography.textStyle.captionMedium,
    },
    sectionMeta: {
        ...theme.typography.textStyle.caption,
    },
    separator: {
        height: theme.spacing.xs,
    },
    loadingWrap: {
        alignItems: "center",
        gap: theme.spacing.xs,
        maxWidth: 260,
    },
    loadingTitle: {
        ...theme.typography.textStyle.bodyMedium,
        fontWeight: "700",
    },
    loadingBody: {
        ...theme.typography.textStyle.bodySmall,
        textAlign: "center",
    },
    searchEmpty: {
        paddingTop: theme.spacing.xl,
        alignItems: "center",
        gap: theme.spacing.xs,
    },
    searchEmptyTitle: {
        ...theme.typography.textStyle.bodyMedium,
        fontWeight: "700",
    },
    searchEmptyBody: {
        ...theme.typography.textStyle.bodySmall,
        textAlign: "center",
        maxWidth: 280,
    },
});

export default Inbox;
