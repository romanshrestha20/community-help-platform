import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card, Row, Stack, theme } from "@/design-system";
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
    error?: string | null;
    onRefresh?: () => void;
    onSend: (content: string) => Promise<unknown> | unknown;
    onDeleteMessage?: (messageId: string) => Promise<unknown> | unknown;
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

const getConversationStateLabel = (conversation: Conversation) => {
    switch (conversation.request.status) {
        case "ASSIGNED":
            return "Live conversation";
        case "COMPLETED":
            return "Request completed";
        case "CANCELLED":
            return "Request cancelled";
        default:
            return "Waiting for assignment";
    }
};

const Chat: React.FC<ChatProps> = ({
    conversation,
    messages,
    loading,
    refreshing,
    sending,
    deletingMessageId,
    error,
    onRefresh,
    onSend,
    onDeleteMessage,
}) => {
    const { palette } = useThemeContext();
    const insets = useSafeAreaInsets();
    const user = useAuthStore((state) => state.user);
    const userId = user?.id ?? "";
    const [selectedParticipant, setSelectedParticipant] = useState<ConversationMember | null>(null);
    const listRef = useRef<FlatList<ThreadRow>>(null);
    const previousMessageCount = useRef(0);

    const threadRows = useMemo(() => groupMessagesForTimeline(messages), [messages]);
    const canSend = conversation?.request.status === "ASSIGNED";
    const isThreadEmpty = threadRows.length === 0;
    const otherParticipant = useMemo(
        () => (conversation ? getOtherParticipant(conversation, userId) ?? null : null),
        [conversation, userId]
    );

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
        return <ChatEmptyState />;
    }

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
                        onAvatarPress={() => {
                            setSelectedParticipant(otherParticipant);
                        }}
                    />
                    <RequestContextBanner conversation={conversation} />
                    {conversation.starterNote ? (
                        <ConversationStarterBanner note={conversation.starterNote} />
                    ) : null}
                    {error ? (
                        <Card
                            style={[
                                styles.feedbackBar,
                                {
                                    backgroundColor: palette.dangerSoftFill,
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
                        </Card>
                    ) : null}
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
                    onLayout={() => {
                        if (messages.length > 0) {
                            scrollToBottom(false);
                        }
                    }}
                    onContentSizeChange={() => {
                        if (messages.length > 0) {
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
                            <ChatEmptyState />
                        </View>
                    }
                    renderItem={({ item }) => {
                        if (item.type === "date") {
                            return <DateSeparator date={item.date} />;
                        }

                        const message = item.message;
                        const isOwn = message.senderId === userId;
                        const previousMessage = item.messageIndex > 0 ? messages[item.messageIndex - 1] : null;
                        const nextMessage = item.messageIndex < messages.length - 1 ? messages[item.messageIndex + 1] : null;
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
                    <Stack gap="xxs">
                        <Text style={[styles.stateHint, { color: palette.textMuted }]}>
                            {canSend
                                ? `${getConversationStateLabel(conversation)}`
                                : "Messaging is locked until the request is assigned."}
                        </Text>
                    </Stack>

                    <MessageComposer
                        onSend={onSend}
                        disabled={!canSend}
                        sending={Boolean(sending)}
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
        marginBottom: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
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
        paddingTop: theme.spacing.xs,
    },
    emptyWrap: {
        flex: 1,
        justifyContent: "center",
        minHeight: 280,
    },
    composerShell: {
        borderTopWidth: 1,
        paddingTop: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        gap: 4,
    },
    stateHint: {
        ...theme.typography.textStyle.caption,
        paddingHorizontal: 2,
    },
});

export default Chat;
