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

    const unreadConversationsCount = useMemo(
        () => conversations.filter((conversation) => conversation.unreadCount > 0).length,
        [conversations]
    );

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
                    <Text style={[styles.loadingTitle, { color: palette.textPrimary }]}>
                        Loading messages
                    </Text>
                    <Text style={[styles.loadingBody, { color: palette.textSecondary }]}>
                        Pulling in request conversations and unread activity.
                    </Text>
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
                        <View style={styles.heroRow}>
                            <View style={styles.heroCopy}>
                                <Text style={[styles.eyebrow, { color: palette.textSecondary }]}>
                                    Messaging
                                </Text>
                                <Text style={[styles.heroTitle, { color: palette.textPrimary }]}>
                                    {`${firstName}\u2019s conversations`}
                                </Text>
                                <Text style={[styles.heroSubtitle, { color: palette.textSecondary }]}>
                                    Assigned requests only. Keep coordination, updates, and next steps in one place.
                                </Text>
                            </View>

                            <View
                                style={[
                                    styles.unreadCapsule,
                                    {
                                        backgroundColor:
                                            unreadTotal > 0 ? palette.primarySoft : palette.surfaceMuted,
                                    },
                                ]}
                            >
                                <Ionicons
                                    name={unreadTotal > 0 ? "mail-outline" : "checkmark-done-outline"}
                                    size={14}
                                    color={unreadTotal > 0 ? palette.primary : palette.textSecondary}
                                />
                                <Text
                                    style={[
                                        styles.unreadCapsuleText,
                                        {
                                            color: unreadTotal > 0 ? palette.primary : palette.textSecondary,
                                        },
                                    ]}
                                >
                                    {unreadTotal > 0 ? `${unreadTotal} unread` : "Caught up"}
                                </Text>
                            </View>
                        </View>

                        <View
                            style={[
                                styles.summaryStrip,
                                {
                                    borderTopColor: palette.border,
                                    borderBottomColor: palette.border,
                                },
                            ]}
                        >
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryValue, { color: palette.textPrimary }]}>
                                    {conversations.length}
                                </Text>
                                <Text style={[styles.summaryLabel, { color: palette.textSecondary }]}>
                                    active threads
                                </Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryValue, { color: palette.textPrimary }]}>
                                    {unreadConversationsCount}
                                </Text>
                                <Text style={[styles.summaryLabel, { color: palette.textSecondary }]}>
                                    waiting on you
                                </Text>
                            </View>
                        </View>

                        <SearchField
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search people, requests, or messages"
                            returnKeyType="search"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <View style={styles.metaRow}>
                            <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                                Threads
                            </Text>
                            <Text style={[styles.sectionMeta, { color: palette.textSecondary }]}>
                                {resultsLabel}
                            </Text>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    normalizedQuery ? (
                        <View style={styles.searchEmpty}>
                            <Text style={[styles.searchEmptyTitle, { color: palette.textPrimary }]}>
                                No matching conversations
                            </Text>
                            <Text style={[styles.searchEmptyBody, { color: palette.textSecondary }]}>
                                Try a participant name, request title, or a word from the latest message.
                            </Text>
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
        gap: theme.spacing.md,
        paddingBottom: theme.spacing.md,
    },
    heroRow: {
        gap: theme.spacing.md,
    },
    heroCopy: {
        gap: theme.spacing.xs,
    },
    eyebrow: {
        ...theme.typography.textStyle.caption,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    heroTitle: {
        ...theme.typography.textStyle.title,
        fontWeight: "700",
    },
    heroSubtitle: {
        ...theme.typography.textStyle.bodySmall,
        maxWidth: 520,
        lineHeight: 21,
    },
    unreadCapsule: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 7,
    },
    unreadCapsuleText: {
        ...theme.typography.textStyle.captionMedium,
    },
    summaryStrip: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        borderTopWidth: 1,
        borderBottomWidth: 1,
    },
    summaryItem: {
        gap: 2,
    },
    summaryValue: {
        ...theme.typography.textStyle.bodyMedium,
        fontWeight: "700",
    },
    summaryLabel: {
        ...theme.typography.textStyle.caption,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.sm,
    },
    sectionTitle: {
        ...theme.typography.textStyle.bodySmallMedium,
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
