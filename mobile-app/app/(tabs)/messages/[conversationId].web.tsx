import React from "react";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet } from "react-native";

import { ScreenView } from "@/design-system";
import Chat from "@/features/conversation/components/Chat";
import { useConversationThread } from "@/features/conversation/hooks/conversation.hook";
import { WebSectionShell } from "@/features/web/components/WebSectionShell";

export default function ConversationScreenWeb() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();

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
  } = useConversationThread({ conversationId: conversationId as string, autoMarkRead: true });

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
      <ScreenView style={{ padding: 0 }}>
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
          liveWarning={liveWarning}
          onRefresh={reload}
          onLoadOlder={loadOlderMessages}
          onSend={sendMessage}
          onTyping={notifyTypingActivity}
          onStopTyping={stopTyping}
          onDeleteMessage={deleteMessage}
          typingLabel={typingLabel}
          requestScoped={false}
        />
      </ScreenView>
    </WebSectionShell>
  );
}
const styles = StyleSheet.create({});
