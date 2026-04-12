import React from "react";
import { useLocalSearchParams } from "expo-router";
import { ScreenView } from "@/design-system";
import Chat from "@/features/conversation/components/Chat";
import { useConversationThread } from "@/features/conversation/hooks/conversation.hook";

export default function ConversationScreen() {
    const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
    const {
        conversation,
        messages,
        loading,
        refreshing,
        sending,
        error,
        reload,
        sendMessage,
        deleteMessage,
        deletingMessageId,
    } = useConversationThread({
        conversationId: conversationId as string,
        autoMarkRead: true,
    });

    return (
        <ScreenView useSafeArea={false} style={{ padding: 0 }}>
            <Chat
                conversation={conversation}
                messages={messages}
                loading={loading}
                refreshing={refreshing}
                sending={sending}
                deletingMessageId={deletingMessageId}
                error={error}
                onRefresh={reload}
                onSend={sendMessage}
                onDeleteMessage={deleteMessage}
            />
        </ScreenView>
    );
}
