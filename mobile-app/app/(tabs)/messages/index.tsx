/**
 * Messages Tab Screen
 * Displays list of user messages and conversations
 */

import React from "react";
import { useRouter } from "expo-router";
import { useConversations } from "@/features/conversation/hooks/conversation.hook";
import Inbox from "@/features/conversation/components/Inbox";
import { useBadgeCounts } from "@/hooks/useBadgeCounts";

export default function MessagesScreen() {
    const { conversations, loading, refreshing, reload } = useConversations();
    const router = useRouter();
    const { messages: unreadTotal } = useBadgeCounts();

    return (
        <Inbox
            conversations={conversations}
            loading={loading}
            refreshing={refreshing}
            onRefresh={reload}
            onSelectConversation={(conv) => router.push(`/messages/${conv.id}`)}
            unreadTotal={unreadTotal}
        />
    );
}
