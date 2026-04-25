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
    const firstName = user?.fullName?.trim().split(/\s+/)[0] ?? "there";
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

    const conversationCountLabel = useMemo(() => {
        const count = conversations.length;
        return `${count} ${count === 1 ? "assigned chat" : "assigned chats"}`;
    }, [conversations.length]);

    const unreadConversationsCount = useMemo(
        () => conversations.filter((conversation) => conversation.unreadCount > 0).length,
        [conversations]
    );

    const unreadConversationsLabel = useMemo(() => {
        if (unreadConversationsCount === 0) {
            return "All caught up";
        }

        return `${unreadConversationsCount} unread thread${unreadConversationsCount === 1 ? "" : "s"}`;
    }, [unreadConversationsCount]);

    const highlightedConversation = useMemo(
        () =>
            conversations.find((conversation) => conversation.unreadCount > 0) ??
            conversations[0] ??
            null,
        [conversations]
    );

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
                        Loading assigned chats
                    </Text>
                    <Text style={[styles.loadingSubtitle, { color: palette.textSecondary }]}>
                        Syncing request-linked conversations, unread counts, and recent replies.
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
            <FlatList
                data={filteredConversations}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <ConversationListItem
                        conversation={item}
                        userId={userId}
                        onPress={() => onSelectConversation(item)}
                        isFirst={index === 0}
                        isLast={index === filteredConversations.length - 1}
                    />
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.listSpacer} />}
                ListHeaderComponent={
                    <View style={styles.headerBlock}>
                        <View style={styles.heroRow}>
                            <View style={styles.heroCopy}>
                                <Text style={[styles.eyebrow, { color: palette.primary }]}>
                                    Request conversations
                                </Text>
                                <Text style={[styles.heroTitle, { color: palette.textPrimary }]}>
                                    Messages for {firstName}
                                </Text>
                                <Text
                                    style={[
                                        styles.heroSubtitle,
                                        { color: palette.textSecondary },
                                    ]}
                                >
                                    Only assigned requests appear here, so every thread is tied to
                                    a real job in progress.
                                </Text>
                            </View>

                            <View
                                style={[
                                    styles.heroBadge,
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
                                    name={
                                        unreadTotal > 0
                                            ? "mail-unread-outline"
                                            : "checkmark-done-outline"
                                    }
                                    size={16}
                                    color={unreadTotal > 0 ? palette.primary : palette.textMuted}
                                />
                                <Text
                                    style={[
                                        styles.heroBadgeText,
                                        {
                                            color:
                                                unreadTotal > 0
                                                    ? palette.primary
                                                    : palette.textSecondary,
                                        },
                                    ]}
                                >
                                    {unreadTotal > 0 ? `${unreadTotal} unread` : "Up to date"}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.summaryRow}>
                            <View
                                style={[
                                    styles.summaryCard,
                                    {
                                        backgroundColor: palette.surface,
                                        borderColor: palette.border,
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.summaryIconWrap,
                                        { backgroundColor: palette.surfaceMuted },
                                    ]}
                                >
                                    <Ionicons
                                        name="chatbubbles-outline"
                                        size={16}
                                        color={palette.primary}
                                    />
                                </View>
                                <View style={styles.summaryCopy}>
                                    <Text
                                        style={[
                                            styles.summaryValue,
                                            { color: palette.textPrimary },
                                        ]}
                                    >
                                        {conversationCountLabel}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.summaryLabel,
                                            { color: palette.textSecondary },
                                        ]}
                                    >
                                        Request-based threads
                                    </Text>
                                </View>
                            </View>

                            <View
                                style={[
                                    styles.summaryCard,
                                    {
                                        backgroundColor: palette.surface,
                                        borderColor: palette.border,
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.summaryIconWrap,
                                        {
                                            backgroundColor:
                                                unreadConversationsCount > 0
                                                    ? palette.primarySoft
                                                    : palette.surfaceMuted,
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name={
                                            unreadConversationsCount > 0
                                                ? "sparkles-outline"
                                                : "time-outline"
                                        }
                                        size={16}
                                        color={
                                            unreadConversationsCount > 0
                                                ? palette.primary
                                                : palette.textSecondary
                                        }
                                    />
                                </View>
                                <View style={styles.summaryCopy}>
                                    <Text
                                        style={[
                                            styles.summaryValue,
                                            { color: palette.textPrimary },
                                        ]}
                                    >
                                        {unreadConversationsLabel}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.summaryLabel,
                                            { color: palette.textSecondary },
                                        ]}
                                    >
                                        Waiting on your reply
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {highlightedConversation ? (
                            <View
                                style={[
                                    styles.spotlightCard,
                                    {
                                        backgroundColor: palette.textPrimary,
                                    },
                                ]}
                            >
                                <View style={styles.spotlightHeader}>
                                    <Text
                                        style={[
                                            styles.spotlightEyebrow,
                                            { color: "rgba(255,255,255,0.72)" },
                                        ]}
                                    >
                                        {highlightedConversation.unreadCount > 0
                                            ? "Reply waiting"
                                            : "Latest assigned thread"}
                                    </Text>
                                    <Ionicons
                                        name="arrow-forward-outline"
                                        size={16}
                                        color="#FFFFFF"
                                    />
                                </View>
                                <Text style={styles.spotlightTitle} numberOfLines={1}>
                                    {getOtherParticipant(highlightedConversation, userId, userEmail)?.fullName ||
                                        getOtherParticipant(highlightedConversation, userId, userEmail)?.email ||
                                        "Conversation"}
                                </Text>
                                <Text style={styles.spotlightRequest} numberOfLines={1}>
                                    {highlightedConversation.request.title}
                                </Text>
                                <Text style={styles.spotlightPreview} numberOfLines={2}>
                                    {getLastMessagePreview(highlightedConversation, userId)}
                                </Text>
                            </View>
                        ) : null}

                        <View style={styles.searchBlock}>
                            <SearchField
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Search assigned requests, people, or messages"
                                returnKeyType="search"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />

                            <View style={styles.searchMetaRow}>
                                <Text
                                    style={[
                                        styles.sectionTitle,
                                        { color: palette.textPrimary },
                                    ]}
                                >
                                    Active request conversations
                                </Text>

                                {searchResultsLabel ? (
                                    <Text
                                        style={[
                                            styles.searchMeta,
                                            { color: palette.textSecondary },
                                        ]}
                                    >
                                        {searchResultsLabel}
                                    </Text>
                                ) : null}
                            </View>
                        </View>

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
                                    No matching conversations
                                </Text>
                                <Text
                                    style={[
                                        styles.searchEmptyText,
                                        { color: palette.textSecondary },
                                    ]}
                                >
                                    Try a different helper name, requester, request title, or
                                    message keyword.
                                </Text>
                            </View>
                        ) : null}
                    </View>
                }
                ListEmptyComponent={null}
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
    headerBlock: {
        gap: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    heroRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: theme.spacing.md,
    },
    heroCopy: {
        flex: 1,
        gap: 4,
    },
    eyebrow: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
        letterSpacing: 0.8,
        textTransform: "uppercase",
    },
    heroTitle: {
        ...theme.typography.textStyle.heading,
        fontSize: 32,
        lineHeight: 38,
    },
    heroSubtitle: {
        ...theme.typography.textStyle.bodySmall,
        lineHeight: 22,
        maxWidth: 280,
    },
    heroBadge: {
        minHeight: 38,
        borderWidth: 1,
        borderRadius: theme.radius.fill,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    heroBadgeText: {
        ...theme.typography.textStyle.captionMedium,
    },
    summaryRow: {
        flexDirection: "row",
        gap: theme.spacing.sm,
    },
    summaryCard: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 22,
        padding: theme.spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    summaryIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    summaryCopy: {
        flex: 1,
        gap: 2,
    },
    summaryValue: {
        ...theme.typography.textStyle.bodyMedium,
        fontWeight: "700",
    },
    summaryLabel: {
        ...theme.typography.textStyle.caption,
    },
    spotlightCard: {
        borderRadius: 26,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        gap: 6,
    },
    spotlightHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    spotlightEyebrow: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
        letterSpacing: 0.8,
        textTransform: "uppercase",
    },
    spotlightTitle: {
        color: "#FFFFFF",
        fontSize: 24,
        lineHeight: 28,
        fontWeight: theme.typography.fontWeight.bold,
    },
    spotlightRequest: {
        color: "rgba(255,255,255,0.86)",
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    spotlightPreview: {
        color: "rgba(255,255,255,0.7)",
        fontSize: theme.typography.fontSize.sm,
        lineHeight: 21,
        marginTop: 2,
    },
    searchBlock: {
        gap: theme.spacing.xs,
    },
    searchMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.sm,
        paddingHorizontal: 2,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
    },
    searchMeta: {
        ...theme.typography.textStyle.caption,
    },
    listContent: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.xxl,
    },
    listSpacer: {
        height: theme.spacing.sm,
    },
    searchEmptyState: {
        borderWidth: 1,
        borderRadius: 24,
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
