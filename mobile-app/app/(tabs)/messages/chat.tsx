import React from "react";
import { useLocalSearchParams } from "expo-router";

import { ScreenView } from "@/design-system";
import Chat from "@/features/conversation/components/Chat";
import { useConversationThread } from "@/features/conversation/hooks/conversation.hook";

export default function ConversationChatRoute() {
    const { conversationId, requestId } = useLocalSearchParams<{
        conversationId?: string;
        requestId?: string;
    }>();

    const {
        conversation,
        messages,
        loading,
        refreshing,
        sending,
        error,
        reload,
        loadOlderMessages,
        loadingOlder,
        hasOlderMessages,
        sendMessage,
        deleteMessage,
        deletingMessageId,
    } = useConversationThread({
        conversationId: typeof conversationId === "string" ? conversationId : undefined,
        requestId: typeof requestId === "string" ? requestId : undefined,
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
                loadingOlder={loadingOlder}
                hasOlderMessages={hasOlderMessages}
                error={error}
                onRefresh={reload}
                onLoadOlder={loadOlderMessages}
                onSend={sendMessage}
                onDeleteMessage={deleteMessage}
            />
        </ScreenView>
    );
}
