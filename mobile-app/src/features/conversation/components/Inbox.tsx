import Ionicons from "@expo/vector-icons/Ionicons";
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
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useAuthStore } from "@/features/auth/store/auth.store";

import { Conversation } from "../types/conversation.type";
import ConversationListItem from "./ConversationListItem";
import InboxEmptyState from "./InboxEmptyState";
import { getLastMessagePreview, getOtherParticipant } from "../utils/conversation.utils";

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
    const [searchQuery, setSearchQuery] = React.useState("");

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredConversations = useMemo(() => {
        if (!normalizedQuery) {
            return conversations;
        }

        return conversations.filter((conversation) => {
            const otherParticipant = getOtherParticipant(conversation, userId);
            const displayName = otherParticipant?.fullName || "";
            const email = otherParticipant?.email || "";
            const requestTitle = conversation.request.title || "";
            const lastMessagePreview = getLastMessagePreview(conversation, userId) || "";

            const searchableText = [
                displayName,
                email,
                requestTitle,
                lastMessagePreview,
            ]
                .join(" ")
                .toLowerCase();

            return searchableText.includes(normalizedQuery);
        });
    }, [conversations, normalizedQuery, userId]);

    const threadLabel = useMemo(() => {
        const count = conversations.length;
        return `${count} ${count === 1 ? "conversation" : "conversations"}`;
    }, [conversations.length]);

    const searchResultsLabel = useMemo(() => {
        if (!normalizedQuery) {
            return null;
        }

        const count = filteredConversations.length;
        return `${count} ${count === 1 ? "result" : "results"}`;
    }, [filteredConversations.length, normalizedQuery]);

    if (loading && conversations.length === 0) {
        return (
            <ScreenView centered style={styles.screen}>
                <View
                    style={[
                        styles.loadingCard,
                        {
                            backgroundColor: palette.surface,
                            borderColor: palette.border,
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.loadingIconWrap,
                            { backgroundColor: palette.primarySoft },
                        ]}
                    >
                        <ActivityIndicator size="small" color={palette.primary} />
                    </View>

                    <Text style={[styles.loadingTitle, { color: palette.textPrimary }]}>
                        Loading your chats
                    </Text>
                    <Text style={[styles.loadingSubtitle, { color: palette.textSecondary }]}>
                        Pulling in your latest messages and conversation updates.
                    </Text>
                </View>
            </ScreenView>
        );
    }

    if (!loading && conversations.length === 0) {
        return (
            <ScreenView centered style={styles.screen}>
                <View style={styles.emptyWrap}>
                    <InboxEmptyState />
                </View>
            </ScreenView>
        );
    }

    return (
        <ScreenView style={styles.screen}>
            <View style={[styles.topBar, { borderBottomColor: palette.border }]}>
                <View style={styles.topBarContent}>
                    <View style={styles.titleRow}>
                        <View
                            style={[
                                styles.titleIconWrap,
                                {
                                    backgroundColor: palette.primarySoft,
                                },
                            ]}
                        >
                            <Ionicons
                                name="chatbubbles-outline"
                                size={18}
                                color={palette.primary}
                            />
                        </View>

                        <View style={styles.titleTextWrap}>
                            <Text style={[styles.title, { color: palette.textPrimary }]}>
                                Messages
                            </Text>
                            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
                                Stay updated with request conversations
                            </Text>
                        </View>
                    </View>

                    <View style={styles.summaryRow}>
                        <View
                            style={[
                                styles.summaryPill,
                                {
                                    backgroundColor: palette.surface,
                                    borderColor: palette.border,
                                },
                            ]}
                        >
                            <Ionicons
                                name="layers-outline"
                                size={14}
                                color={palette.textMuted}
                            />
                            <Text style={[styles.summaryText, { color: palette.textSecondary }]}>
                                {threadLabel}
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.summaryPill,
                                unreadTotal > 0
                                    ? {
                                        backgroundColor: palette.primarySoft,
                                        borderColor: "transparent",
                                    }
                                    : {
                                        backgroundColor: palette.surface,
                                        borderColor: palette.border,
                                    },
                            ]}
                        >
                            <Ionicons
                                name={unreadTotal > 0 ? "mail-unread-outline" : "checkmark-done-outline"}
                                size={14}
                                color={unreadTotal > 0 ? palette.primary : palette.textMuted}
                            />
                            <Text
                                style={[
                                    styles.summaryText,
                                    {
                                        color: unreadTotal > 0 ? palette.primary : palette.textSecondary,
                                    },
                                ]}
                            >
                                {unreadTotal > 0 ? `${unreadTotal} unread` : "All caught up"}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.searchBlock}>
                        <SearchField
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search by person, request, or message"
                            returnKeyType="search"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        {searchResultsLabel ? (
                            <Text style={[styles.searchMeta, { color: palette.textSecondary }]}>
                                {searchResultsLabel}
                            </Text>
                        ) : null}
                    </View>
                </View>
            </View>

            <FlatList
                data={filteredConversations}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                refreshControl={
                    onRefresh ? (
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={palette.primary}
                        />
                    ) : undefined
                }
                ListHeaderComponent={
                    <View>
                        <FlatList
                            data={filteredConversations}
                            keyExtractor={(item) => `inner-${item.id}`}
                            scrollEnabled={false}
                            ItemSeparatorComponent={() => (
                                <View
                                    style={[
                                        styles.innerSeparator,
                                        { backgroundColor: palette.border },
                                    ]}
                                />
                            )}
                            renderItem={({ item }) => (
                                <ConversationListItem
                                    conversation={item}
                                    userId={userId}
                                    onPress={() => onSelectConversation(item)}
                                />
                            )}
                        />

                        {normalizedQuery && filteredConversations.length === 0 ? (
                            <View
                                style={[
                                    styles.searchEmptyState,
                                    {
                                        backgroundColor: palette.surface,
                                        borderColor: palette.border,
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.searchEmptyIconWrap,
                                        { backgroundColor: palette.surfaceMuted },
                                    ]}
                                >
                                    <Ionicons
                                        name="search-outline"
                                        size={20}
                                        color={palette.textSecondary}
                                    />
                                </View>
                                <Text
                                    style={[
                                        styles.searchEmptyTitle,
                                        { color: palette.textPrimary },
                                    ]}
                                >
                                    No conversations found
                                </Text>
                                <Text
                                    style={[
                                        styles.searchEmptyText,
                                        { color: palette.textSecondary },
                                    ]}
                                >
                                    Try a different name, request title, or message keyword.
                                </Text>
                            </View>
                        ) : null}
                    </View>
                }
                renderItem={() => null}
            />
        </ScreenView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },

    topBar: {
        borderBottomWidth: 1,
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.xs,
        paddingBottom: theme.spacing.md,
    },
    topBarContent: {
        gap: theme.spacing.sm,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    titleIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: "center",
        justifyContent: "center",
    },
    titleTextWrap: {
        flex: 1,
    },
    title: {
        ...theme.typography.textStyle.heading,
        fontSize: 24,
    },
    subtitle: {
        ...theme.typography.textStyle.bodySmall,
        marginTop: 2,
    },

    summaryRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.spacing.xs,
    },
    summaryPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 8,
    },
    summaryText: {
        ...theme.typography.textStyle.captionMedium,
    },
    searchBlock: {
        gap: theme.spacing.xxs,
    },
    searchMeta: {
        ...theme.typography.textStyle.caption,
        paddingHorizontal: theme.spacing.xxs,
    },

    listContent: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.xl,
    },
    listCard: {
        borderWidth: 1,
        borderRadius: 22,
        overflow: "hidden",
    },
    separator: {
        height: 0,
    },
    innerSeparator: {
        height: 1,
        marginLeft: 76,
    },
    searchEmptyState: {
        borderWidth: 1,
        borderRadius: theme.radius.xl,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.xl,
        alignItems: "center",
        gap: theme.spacing.xs,
    },
    searchEmptyIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: theme.spacing.xxs,
    },
    searchEmptyTitle: {
        ...theme.typography.textStyle.bodyMedium,
        fontWeight: "700",
    },
    searchEmptyText: {
        ...theme.typography.textStyle.bodySmall,
        textAlign: "center",
    },

    loadingCard: {
        width: "100%",
        maxWidth: 320,
        borderWidth: 1,
        borderRadius: 24,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.xl,
        alignItems: "center",
    },
    loadingIconWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: theme.spacing.md,
    },
    loadingTitle: {
        ...theme.typography.textStyle.bodyMedium,
        fontWeight: "700",
        marginBottom: 4,
    },
    loadingSubtitle: {
        ...theme.typography.textStyle.bodySmall,
        textAlign: "center",
    },

    emptyWrap: {
        width: "100%",
        paddingHorizontal: theme.spacing.md,
    },
});

export default Inbox;
