import React from "react";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet } from "react-native";

import { ScreenView } from "@/design-system";
import Chat from "@/features/conversation/components/Chat";
import { useConversationThread } from "@/features/conversation/hooks/conversation.hook";
import { WebSectionShell } from "@/features/web/components/WebSectionShell";

export default function ConversationChatWebRoute() {
  const { conversationId, requestId } = useLocalSearchParams<{ conversationId?: string; requestId?: string }>();

  const {
    conversation,
    messages,
    loading,
    refreshing,
    sending,
    error,
    liveWarning,
    reload,
    loadOlderMessages,
    loadingOlder,
    hasOlderMessages,
    sendMessage,
    deleteMessage,
    deletingMessageId,
    typingUserId,
    notifyTypingActivity,
    stopTyping,
  } = useConversationThread({
    conversationId: typeof conversationId === "string" ? conversationId : undefined,
    requestId: typeof requestId === "string" ? requestId : undefined,
    autoMarkRead: true,
  });

  const typingLabel = typingUserId
    ? (() => {
        const typingMember = conversation?.members.find((member) => member.id === typingUserId);
        const name = typingMember?.fullName || typingMember?.email || "Someone";
        return `${name} is typing...`;
      })()
    : null;

  return (
    <WebSectionShell
      activeKey="messages"
      fullBleedContent
    >
      <ScreenView useSafeArea={false} style={{ padding: 0 }}>
        <Chat
          conversation={conversation}
          requestId={typeof requestId === "string" ? requestId : undefined}
          messages={messages}
          loading={loading}
          refreshing={refreshing}
          sending={sending}
          deletingMessageId={deletingMessageId}
          loadingOlder={loadingOlder}
          hasOlderMessages={hasOlderMessages}
          error={error}
          liveWarning={liveWarning}
          onRefresh={reload}
          onLoadOlder={loadOlderMessages}
          onSend={sendMessage}
          onTyping={notifyTypingActivity}
          onStopTyping={stopTyping}
          onDeleteMessage={deleteMessage}
          typingLabel={typingLabel}
          requestScoped={typeof requestId === "string"}
        />
      </ScreenView>
    </WebSectionShell>
  );
}
const styles = StyleSheet.create({});
