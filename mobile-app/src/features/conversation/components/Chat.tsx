import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SearchField } from "@/components/ui/SearchField";
import { Row, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useAuthStore } from "@/features/auth/store/auth.store";

import ChatEmptyState from "./ChatEmptyState";
import ChatHeader from "./ChatHeader";
import ChatLoadingState from "./ChatLoadingState";
import ConversationStarterBanner from "./ConversationStarterBanner";
import DateSeparator from "./DateSeparator";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";
import RequestContextBanner from "./RequestContextBanner";
import ParticipantProfileModal from "./ConversationParticipantModal";
import type { Conversation, ConversationMember, Message } from "../types/conversation.type";
import { getOtherParticipant } from "../utils/conversation.utils";

type ThreadRow =
    | { id: string; type: "date"; date: string }
    | { id: string; type: "message"; message: Message; messageIndex: number };

interface ChatProps {
    conversation: Conversation | null;
    messages: Message[];
    loading?: boolean;
    refreshing?: boolean;
    sending?: boolean;
    deletingMessageId?: string | null;
    loadingOlder?: boolean;
    hasOlderMessages?: boolean;
    error?: string | null;
    liveWarning?: string | null;
    onRefresh?: () => void;
    onLoadOlder?: () => void;
    onSend: (content: string) => Promise<unknown> | unknown;
    onTyping?: () => void;
    onStopTyping?: () => void;
    onDeleteMessage?: (messageId: string) => Promise<unknown> | unknown;
    typingLabel?: string | null;
    requestScoped?: boolean;
}

const groupMessagesForTimeline = (messages: Message[]) => {
    const rows: ThreadRow[] = [];
    let activeDate = "";

    for (const [messageIndex, message] of messages.entries()) {
        const messageDate = message.createdAt.slice(0, 10);

        if (messageDate !== activeDate) {
            activeDate = messageDate;
            rows.push({
                id: `date-${messageDate}`,
                type: "date",
                date: messageDate,
            });
        }

        rows.push({
            id: `message-${message.id}`,
            type: "message",
            message,
            messageIndex,
        });
    }

    return rows;
};

const Chat: React.FC<ChatProps> = ({
    conversation,
    messages,
    loading,
    refreshing,
    sending,
    deletingMessageId,
    loadingOlder,
    hasOlderMessages,
    error,
    liveWarning,
    onRefresh,
    onLoadOlder,
    onSend,
    onTyping,
    onStopTyping,
    onDeleteMessage,
    typingLabel,
    requestScoped = false,
}) => {
    const { palette } = useThemeContext();
    const insets = useSafeAreaInsets();
    const user = useAuthStore((state) => state.user);
    const userId = user?.id ?? "";
    const userEmail = user?.email ?? "";
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedParticipant, setSelectedParticipant] = useState<ConversationMember | null>(null);
    const listRef = useRef<FlatList<ThreadRow>>(null);
    const previousMessageCount = useRef(0);

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredMessages = useMemo(() => {
        if (!normalizedQuery) {
            return messages;
        }

        return messages.filter((message) => {
            const senderName = message.sender.fullName || "";
            const senderEmail = message.sender.email || "";
            const content = message.content || "";
            const searchableText = [senderName, senderEmail, content].join(" ").toLowerCase();

            return searchableText.includes(normalizedQuery);
        });
    }, [messages, normalizedQuery]);

    const threadRows = useMemo(() => groupMessagesForTimeline(filteredMessages), [filteredMessages]);
    const canSend = conversation?.request.status === "ASSIGNED";
    const isThreadEmpty = threadRows.length === 0;
    const otherParticipant = useMemo(
        () => (conversation ? getOtherParticipant(conversation, userId, userEmail) ?? null : null),
        [conversation, userEmail, userId]
    );

    const searchResultsLabel = useMemo(() => {
        if (!normalizedQuery) {
            return null;
        }

        const count = filteredMessages.length;
        return `${count} ${count === 1 ? "message" : "messages"} found`;
    }, [filteredMessages.length, normalizedQuery]);

    const findConversationMember = (senderId: string) =>
        conversation?.members.find((member) => member.id === senderId) ?? null;

    const getParticipantRole = (participant: ConversationMember | null) => {
        if (!participant || !conversation) {
            return undefined;
        }

        if (participant.id === conversation.request.requesterId) {
            return "Requester";
        }

        if (participant.id === conversation.request.assignedHelperId) {
            return "Assigned helper";
        }

        return "Conversation participant";
    };

    const scrollToBottom = (animated: boolean) => {
        requestAnimationFrame(() => {
            listRef.current?.scrollToEnd({ animated });
        });
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!hasOlderMessages || loadingOlder || !onLoadOlder) {
            return;
        }

        if (event.nativeEvent.contentOffset.y <= 96) {
            onLoadOlder();
        }
    };

    useEffect(() => {
        if (!messages.length) {
            previousMessageCount.current = 0;
            return;
        }

        const shouldAnimate = previousMessageCount.current > 0;
        previousMessageCount.current = messages.length;
        scrollToBottom(shouldAnimate);
    }, [messages.length]);

    if (loading) {
        return <ChatLoadingState />;
    }

    if (!conversation) {
        return <ChatEmptyState requestScoped={requestScoped} />;
    }

    const composerStatusLabel = canSend
        ? "Assigned request conversation"
        : conversation.request.status === "COMPLETED"
            ? "Completed request · read-only"
            : "Closed conversation";

    return (
        <KeyboardAvoidingView
            behavior={Platform.select({ ios: "padding", android: "height" })}
            keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
            style={[styles.screen, { backgroundColor: palette.background }]}
        >
            <View style={styles.screen}>
                <View
                    style={[
                        styles.headerShell,
                        { backgroundColor: palette.background, borderBottomColor: palette.border },
                    ]}
                >
                    <ChatHeader
                        conversation={conversation}
                        userId={userId}
                        userEmail={userEmail}
                        onAvatarPress={() => {
                            setSelectedParticipant(otherParticipant);
                        }}
                    />
                    <RequestContextBanner conversation={conversation} />
                    {conversation.starterNote ? (
                        <ConversationStarterBanner note={conversation.starterNote} />
                    ) : null}
                    {error ? (
                        <View
                            style={[
                                styles.feedbackBar,
                                {
                                    backgroundColor: palette.dangerSoft,
                                    borderColor: palette.danger,
                                },
                            ]}
                        >
                            <Row gap="xs" align="center">
                                <Ionicons name="alert-circle-outline" size={16} color={palette.danger} />
                                <Text style={[styles.feedbackText, { color: palette.textPrimary }]}>
                                    {error}
                                </Text>
                            </Row>
                        </View>
                    ) : null}
                    {liveWarning ? (
                        <View
                            style={[
                                styles.feedbackBar,
                                {
                                    backgroundColor: palette.surfaceMuted,
                                    borderColor: palette.border,
                                },
                            ]}
                        >
                            <Text style={[styles.feedbackText, { color: palette.textSecondary }]}>
                                {liveWarning}
                            </Text>
                        </View>
                    ) : null}
                    <View style={styles.searchBlock}>
                        <SearchField
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search this conversation"
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

                <FlatList
                    ref={listRef}
                    data={threadRows}
                    keyExtractor={(item) => item.id}
                    style={styles.list}
                    contentContainerStyle={[
                        styles.listContent,
                        {
                            paddingBottom: theme.spacing.lg,
                            backgroundColor: palette.background,
                            justifyContent: isThreadEmpty ? "center" : "flex-end",
                        },
                    ]}
                    keyboardDismissMode="interactive"
                    keyboardShouldPersistTaps="handled"
                    maintainVisibleContentPosition={{
                        minIndexForVisible: 1,
                    }}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    onLayout={() => {
                        if (filteredMessages.length > 0) {
                            scrollToBottom(false);
                        }
                    }}
                    onContentSizeChange={() => {
                        if (filteredMessages.length > 0) {
                            scrollToBottom(previousMessageCount.current > 1);
                        }
                    }}
                    refreshControl={
                        onRefresh ? (
                            <RefreshControl
                                refreshing={Boolean(refreshing)}
                                onRefresh={onRefresh}
                                tintColor={palette.primary}
                            />
                        ) : undefined
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            {normalizedQuery ? (
                                <View style={styles.searchEmpty}>
                                    <Text style={[styles.searchEmptyTitle, { color: palette.textPrimary }]}>
                                        No matching messages
                                    </Text>
                                    <Text style={[styles.searchEmptyText, { color: palette.textSecondary }]}>
                                        Try a different keyword or sender name.
                                    </Text>
                                </View>
                            ) : (
                                <ChatEmptyState requestScoped={requestScoped} />
                            )}
                        </View>
                    }
                    ListHeaderComponent={
                        loadingOlder ? (
                            <View style={styles.olderLoading}>
                                <ActivityIndicator size="small" color={palette.primary} />
                                <Text style={[styles.olderLoadingText, { color: palette.textMuted }]}>
                                    Loading older messages
                                </Text>
                            </View>
                        ) : hasOlderMessages ? (
                            <View style={styles.olderHint}>
                                <Text style={[styles.olderHintText, { color: palette.textMuted }]}>
                                    Scroll up for older messages
                                </Text>
                            </View>
                        ) : null
                    }
                    renderItem={({ item }) => {
                        if (item.type === "date") {
                            return <DateSeparator date={item.date} />;
                        }

                        const message = item.message;
                        const isOwn = message.senderId === userId;
                        const previousMessage =
                            item.messageIndex > 0 ? filteredMessages[item.messageIndex - 1] : null;
                        const nextMessage =
                            item.messageIndex < filteredMessages.length - 1
                                ? filteredMessages[item.messageIndex + 1]
                                : null;
                        const groupedWithPrevious =
                            previousMessage?.senderId === message.senderId &&
                            previousMessage?.createdAt.slice(0, 10) === message.createdAt.slice(0, 10);
                        const groupedWithNext =
                            nextMessage?.senderId === message.senderId &&
                            nextMessage?.createdAt.slice(0, 10) === message.createdAt.slice(0, 10);
                        const senderMember = findConversationMember(message.senderId);

                        return (
                            <MessageBubble
                                message={message}
                                isOwn={isOwn}
                                showAvatar={!isOwn && !groupedWithNext}
                                showSender={!isOwn && !groupedWithPrevious}
                                groupedWithPrevious={groupedWithPrevious}
                                groupedWithNext={groupedWithNext}
                                deleting={deletingMessageId === message.id}
                                onAvatarPress={
                                    senderMember
                                        ? () => {
                                            setSelectedParticipant(senderMember);
                                        }
                                        : undefined
                                }
                                onLongPress={
                                    onDeleteMessage && isOwn && !message.deletedAt
                                        ? () => onDeleteMessage(message.id)
                                        : undefined
                                }
                            />
                        );
                    }}
                />

                <View
                    style={[
                        styles.composerShell,
                        {
                            backgroundColor: palette.background,
                            borderTopColor: palette.border,
                            paddingBottom: Math.max(insets.bottom, theme.spacing.sm),
                        },
                    ]}
                >
                    {typingLabel ? (
                        <Text style={[styles.typingHint, { color: palette.primary }]}>
                            {typingLabel}
                        </Text>
                    ) : null}

                    <MessageComposer
                        onSend={onSend}
                        onTyping={onTyping}
                        onStopTyping={onStopTyping}
                        disabled={!canSend}
                        sending={Boolean(sending)}
                        statusLabel={composerStatusLabel}
                    />
                </View>
            </View>

            <ParticipantProfileModal
                visible={Boolean(selectedParticipant)}
                participant={selectedParticipant}
                roleLabel={getParticipantRole(selectedParticipant)}
                onClose={() => {
                    setSelectedParticipant(null);
                }}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    headerShell: {
        borderBottomWidth: 1,
    },
    feedbackBar: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.sm,
        borderWidth: 1,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
    },
    searchBlock: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.md,
        gap: theme.spacing.xxs,
    },
    searchMeta: {
        ...theme.typography.textStyle.caption,
        paddingHorizontal: 2,
    },
    feedbackText: {
        ...theme.typography.textStyle.bodySmall,
        flex: 1,
    },
    list: {
        flex: 1,
    },
    listContent: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
    },
    emptyWrap: {
        flex: 1,
        justifyContent: "center",
        minHeight: 280,
    },
    searchEmpty: {
        alignItems: "center",
        gap: theme.spacing.xs,
    },
    searchEmptyTitle: {
        ...theme.typography.textStyle.bodyMedium,
        fontWeight: "700",
        textAlign: "center",
    },
    searchEmptyText: {
        ...theme.typography.textStyle.bodySmall,
        textAlign: "center",
    },
    olderLoading: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.xs,
        paddingTop: theme.spacing.xs,
        paddingBottom: theme.spacing.sm,
    },
    olderLoadingText: {
        ...theme.typography.textStyle.caption,
    },
    olderHint: {
        alignItems: "center",
        paddingTop: theme.spacing.xs,
        paddingBottom: theme.spacing.sm,
    },
    olderHintText: {
        ...theme.typography.textStyle.caption,
    },
    composerShell: {
        borderTopWidth: 1,
        paddingTop: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        gap: theme.spacing.xs,
    },
    typingHint: {
        ...theme.typography.textStyle.captionMedium,
        paddingHorizontal: 2,
        marginBottom: 2,
    },
});

export default Chat;
