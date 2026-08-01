/**
 * Messages Tab Screen
 * Desktop: API-driven three-column messaging workspace
 * Mobile/Tablet: existing inbox flow
 */

import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import Inbox from "@/features/conversation/components/Inbox";
import { useConversations, useConversationThread } from "@/features/conversation/hooks/conversation.hook";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { WebSectionShell } from "@/features/web/components/WebSectionShell";
import { useBadgeCounts } from "@/hooks/useBadgeCounts";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { getHelpRequestById } from "@/features/helpRequest/services/helpRequest.service";
import type { HelpRequest } from "@/features/helpRequest/types/helpRequest.types";
import { formatRequestBudget, formatRequestLocation } from "@/features/helpRequest/utils/requestDisplay";
import { APP_ROUTES } from "@/config/routes";
import { getCloudinaryVariantUrl } from "@/utils/cloudinaryImage";

const formatTime = (value?: string | null) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not set";
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function MessagesScreen() {
  const { width } = useWindowDimensions();
  const { palette } = useThemeContext();
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.user?.id ?? "");
  const { messages: unreadTotal } = useBadgeCounts();
  const isDesktopWeb = Platform.OS === "web" && width >= 1200;

  const { conversations, loading, refreshing, reload } = useConversations();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [composerValue, setComposerValue] = useState("");
  const { notifications, markAllRead } = useNotifications();
  const [requestDetails, setRequestDetails] = useState<HelpRequest | null>(null);
  const [requestDetailsLoading, setRequestDetailsLoading] = useState(false);

  const {
    conversation,
    messages,
    sending,
    sendMessage,
    notifyTypingActivity,
    stopTyping,
  } = useConversationThread({
    conversationId: selectedConversationId ?? undefined,
    autoMarkRead: true,
  });

  useEffect(() => {
    if (!conversations.length) {
      setSelectedConversationId(null);
      return;
    }

    setSelectedConversationId((current) => {
      if (current && conversations.some((item) => item.id === current)) {
        return current;
      }
      return conversations[0].id;
    });
  }, [conversations]);

  useEffect(() => {
    if (!isDesktopWeb) {
      setRequestDetails(null);
      setRequestDetailsLoading(false);
      return;
    }

    const requestId = conversation?.request?.id;
    if (!requestId) {
      setRequestDetails(null);
      return;
    }

    let cancelled = false;
    setRequestDetailsLoading(true);

    void getHelpRequestById(requestId)
      .then((data) => {
        if (!cancelled) {
          setRequestDetails(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRequestDetails(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRequestDetailsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [conversation?.request?.id, isDesktopWeb]);

  const inbox = (
    <Inbox
      conversations={conversations}
      loading={loading}
      refreshing={refreshing}
      onRefresh={reload}
      onSelectConversation={(conv) => router.push(`/messages/${conv.id}`)}
      unreadTotal={unreadTotal}
    />
  );

  if (!isDesktopWeb) {
    return inbox;
  }

  const unreadConversations = conversations.filter((item) => item.unreadCount > 0).length;
  const activePartner = conversation?.members.find((member) => member.id !== currentUserId) ?? null;
  const request = conversation?.request;
  const visibleNotifications = notifications.slice(0, 4);

  const handleSend = async () => {
    const trimmed = composerValue.trim();
    if (!trimmed || sending) return;

    setComposerValue("");
    stopTyping();
    try {
      await sendMessage(trimmed);
    } catch {
      setComposerValue(trimmed);
    }
  };

  const requestLocationLabel = requestDetails ? formatRequestLocation(requestDetails) : "Not set";
  const requestBudgetLabel = requestDetails ? formatRequestBudget(requestDetails) : "Not set";
  const requestCategoryLabel = requestDetails?.category?.name || "Not set";
  const requesterLabel = requestDetails?.requesterName || requestDetails?.requesterId || "Unknown";
  const requestTimeLabel = requestDetails?.createdAt ? formatDateTime(requestDetails.createdAt) : "Not set";
  const requestDistanceLabel =
    typeof requestDetails?.distanceKm === "number" ? `${requestDetails.distanceKm.toFixed(1)} km away` : "Distance unavailable";
  const requestIdForNavigation = requestDetails?.id || request?.id || null;

  const navigateToRequest = () => {
    if (!requestIdForNavigation) return;
    router.push(APP_ROUTES.HOME_REQUEST_DETAILS(requestIdForNavigation));
  };

  return (
    <WebSectionShell activeKey="messages" fullBleedContent>
      <View style={styles.desktopRoot}>
        <View style={[styles.column, styles.leftColumn, { borderColor: palette.border }]}> 
          <Text style={[styles.messagesTitle, { color: palette.textPrimary }]}>Messages</Text>

          <View style={[styles.searchBox, { borderColor: palette.border, backgroundColor: palette.surface }]}> 
            <Ionicons name="search-outline" size={18} color={palette.textSecondary} />
            <TextInput
              placeholder="Search conversations..."
              placeholderTextColor={palette.textMuted}
              style={[styles.searchInput, { color: palette.textPrimary }]}
            />
          </View>

          <View style={styles.tabsRow}>
            <TabPill active label="All" />
            <TabPill label={`Unread ${unreadConversations}`} />
            <TabPill label="Requests" />
          </View>

          <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent}>
            {conversations.slice(0, 12).map((item) => {
              const partner = item.members.find((member) => member.id !== currentUserId) ?? item.members[0];
              const name = partner?.fullName || "Community member";
              const preview = item.lastMessage?.content || "No messages yet";
              const time = formatTime(item.lastMessage?.createdAt ?? item.updatedAt);
              const unread = item.unreadCount;
              const active = item.id === selectedConversationId;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedConversationId(item.id)}
                  style={({ pressed }) => [
                    styles.conversationRow,
                    {
                      borderColor: active ? palette.primary : palette.border,
                      backgroundColor: active ? palette.surfaceMuted : pressed ? palette.surfaceMuted : "transparent",
                    },
                  ]}
                >
                  <View style={[styles.avatar, { backgroundColor: palette.primarySoft }]}> 
                    <Text style={[styles.avatarText, { color: palette.primary }]}> 
                      {name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.rowBody}>
                    <View style={styles.rowTop}>
                      <Text style={[styles.rowName, { color: palette.textPrimary }]} numberOfLines={1}>{name}</Text>
                      <Text style={[styles.rowTime, { color: palette.textSecondary }]}>{time}</Text>
                    </View>

                    <View style={styles.rowBottom}>
                      <Text style={[styles.rowPreview, { color: palette.textSecondary }]} numberOfLines={1}>{preview}</Text>
                      {unread > 0 ? (
                        <View style={[styles.unreadBadge, { backgroundColor: palette.primary }]}> 
                          <Text style={[styles.unreadText, { color: palette.textInverse }]}>{unread}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={[styles.column, styles.centerColumn, { borderColor: palette.border }]}> 
          <View style={[styles.chatHeader, { borderColor: palette.border }]}> 
            <View>
              <Text style={[styles.chatName, { color: palette.textPrimary }]}>{activePartner?.fullName || "Select conversation"}</Text>
              <View style={styles.onlineRow}>
                <View style={[styles.onlineDot, { backgroundColor: palette.success }]} />
                <Text style={[styles.onlineText, { color: palette.textSecondary }]}>Online</Text>
              </View>
            </View>

            <Pressable
              onPress={navigateToRequest}
              disabled={!requestIdForNavigation}
              style={[
                styles.viewRequestButton,
                {
                  borderColor: palette.border,
                  backgroundColor: palette.surface,
                  opacity: requestIdForNavigation ? 1 : 0.5,
                },
              ]}
            >
              <Text style={[styles.viewRequestText, { color: palette.textPrimary }]}>View request</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.chatScroll} contentContainerStyle={styles.chatContent}>
            {messages.map((message) => {
              const outgoing = message.senderId === currentUserId;
              return (
                <View
                  key={message.id}
                  style={[
                    styles.bubble,
                    {
                      alignSelf: outgoing ? "flex-end" : "flex-start",
                      backgroundColor: outgoing ? palette.primarySoft : palette.surfaceMuted,
                    },
                  ]}
                >
                  {message.content ? <Text style={[styles.bubbleText, { color: palette.textPrimary }]}>{message.content}</Text> : null}
                  {(message.images?.length ?? 0) > 0 ? (
                    <Image
                      source={{ uri: getCloudinaryVariantUrl(message.images[0].url, "thumbnail") }}
                      style={styles.vanImage}
                    />
                  ) : null}
                  <Text style={[styles.bubbleTime, { color: palette.textSecondary }]}>{formatTime(message.createdAt)}</Text>
                </View>
              );
            })}

          </ScrollView>

          <View style={[styles.composer, { borderColor: palette.border, backgroundColor: palette.surface }]}> 
            <Ionicons name="attach-outline" size={20} color={palette.textSecondary} />
            <TextInput
              placeholder="Type a message..."
              placeholderTextColor={palette.textMuted}
              style={[styles.composerInput, { color: palette.textPrimary }]}
              value={composerValue}
              onChangeText={(value) => {
                setComposerValue(value);
                if (value.trim()) {
                  notifyTypingActivity();
                } else {
                  stopTyping();
                }
              }}
              onSubmitEditing={() => {
                void handleSend();
              }}
            />
            <Ionicons name="happy-outline" size={20} color={palette.textSecondary} />
            <Pressable
              onPress={() => {
                void handleSend();
              }}
              style={[styles.sendButton, { backgroundColor: palette.primary }]}
            >
              <Ionicons name="send" size={16} color={palette.textInverse} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.column, styles.rightColumn]}>
          <View style={[styles.panel, { borderColor: palette.border, backgroundColor: palette.surface }]}> 
            <Text style={[styles.panelEyebrow, { color: palette.textMuted }]}>REQUEST CONTEXT</Text>
            <Text style={[styles.panelTitle, { color: palette.textPrimary }]}>
              {requestDetails?.title || request?.title || "No request selected"}
            </Text>
            <Text style={[styles.panelBody, { color: palette.textSecondary }]}>
              Status: {requestDetails?.status || request?.status || "Unknown"}
            </Text>
            {requestDetailsLoading ? (
              <Text style={[styles.panelBody, { color: palette.textSecondary }]}>Loading request details...</Text>
            ) : null}

            <View style={styles.metaGrid}>
              <MetaItem icon="pricetag-outline" label={`Category: ${requestCategoryLabel}`} />
              <MetaItem icon="location-outline" label={`Location: ${requestLocationLabel}`} />
              <MetaItem icon="cash-outline" label={`Budget: ${requestBudgetLabel}`} />
              <MetaItem icon="time-outline" label={`Requested: ${requestTimeLabel}`} />
              <MetaItem icon="navigate-outline" label={requestDistanceLabel} />
              <MetaItem icon="person-outline" label={`Requester: ${requesterLabel}`} />
            </View>

            <Pressable
              onPress={navigateToRequest}
              disabled={!requestIdForNavigation}
              style={[styles.contextButton, { borderColor: palette.border, backgroundColor: palette.surfaceMuted }]}
            >
              <Text style={[styles.contextButtonText, { color: palette.textPrimary }]}>View request</Text>
            </Pressable>
          </View>

          <View style={[styles.panel, { borderColor: palette.border, backgroundColor: palette.surface }]}> 
            <View style={styles.notifHeader}>
              <Text style={[styles.panelEyebrow, { color: palette.textMuted }]}>NOTIFICATIONS</Text>
              <Pressable onPress={() => void markAllRead()}>
                <Text style={[styles.markAllText, { color: palette.primary }]}>Mark all as read</Text>
              </Pressable>
            </View>
            {visibleNotifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                title={notification.title}
                detail={notification.body}
                time={formatTime(notification.createdAt)}
              />
            ))}
          </View>
        </View>
      </View>
    </WebSectionShell>
  );
}

const TabPill = ({ label, active = false }: { label: string; active?: boolean }) => {
  const { palette } = useThemeContext();
  return (
    <View
      style={[
        styles.tabPill,
        {
          backgroundColor: active ? palette.primary : palette.surfaceMuted,
        },
      ]}
    >
      <Text style={[styles.tabPillText, { color: active ? palette.textInverse : palette.textPrimary }]}>{label}</Text>
    </View>
  );
};

const MetaItem = ({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) => {
  const { palette } = useThemeContext();
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={14} color={palette.textSecondary} />
      <Text style={[styles.metaText, { color: palette.textSecondary }]}>{label}</Text>
    </View>
  );
};

const NotificationRow = ({ title, detail, time }: { title: string; detail: string; time: string }) => {
  const { palette } = useThemeContext();
  return (
    <View style={[styles.notifRow, { borderColor: palette.border }]}> 
      <View style={styles.notifTop}>
        <Text style={[styles.notifTitle, { color: palette.textPrimary }]}>{title}</Text>
        <Text style={[styles.notifTime, { color: palette.textSecondary }]}>{time}</Text>
      </View>
      <Text style={[styles.notifDetail, { color: palette.textSecondary }]}>{detail}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  desktopRoot: { flex: 1, flexDirection: "row", minHeight: 0 },
  column: { minHeight: 0 },
  leftColumn: { width: 360, borderRightWidth: 1, padding: 14, gap: 12 },
  centerColumn: { flex: 1, borderRightWidth: 1 },
  rightColumn: { width: 360, padding: 14, gap: 12 },
  messagesTitle: { fontSize: 34, fontWeight: "800" },
  searchBox: {
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  tabsRow: { flexDirection: "row", gap: 8 },
  tabPill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  tabPillText: { fontWeight: "700", fontSize: 13 },
  listScroll: { flex: 1 },
  listContent: { gap: 8, paddingBottom: 8 },
  conversationRow: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  avatarText: { fontWeight: "800", fontSize: 14 },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  rowName: { fontWeight: "700", fontSize: 15, flex: 1 },
  rowTime: { fontSize: 12 },
  rowBottom: { marginTop: 4, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  rowPreview: { fontSize: 13, flex: 1 },
  unreadBadge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: "center", justifyContent: "center" },
  unreadText: { fontSize: 12, fontWeight: "700" },
  chatHeader: { borderBottomWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chatName: { fontSize: 28, fontWeight: "800" },
  onlineRow: { marginTop: 4, flexDirection: "row", alignItems: "center", gap: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  onlineText: { fontSize: 13 },
  viewRequestButton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  viewRequestText: { fontWeight: "700", fontSize: 14 },
  chatScroll: { flex: 1 },
  chatContent: { padding: 14, gap: 10 },
  bubble: { maxWidth: "74%", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTime: { fontSize: 12, alignSelf: "flex-end" },
  vanImage: { width: 280, height: 140, borderRadius: 12 },
  composer: { borderTopWidth: 1, padding: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  composerInput: { flex: 1, fontSize: 15 },
  sendButton: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  panel: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  panelEyebrow: { fontSize: 12, letterSpacing: 1, fontWeight: "700" },
  panelTitle: { fontSize: 16, fontWeight: "800" },
  panelBody: { fontSize: 13, lineHeight: 18 },
  metaGrid: { marginTop: 6, gap: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaText: { fontSize: 13 },
  contextButton: { marginTop: 10, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  contextButtonText: { fontWeight: "700" },
  notifHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  markAllText: { fontSize: 12, fontWeight: "700" },
  notifRow: { borderTopWidth: 1, paddingTop: 10, marginTop: 8, gap: 4 },
  notifTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  notifTitle: { fontWeight: "700", fontSize: 14, flex: 1 },
  notifDetail: { fontSize: 13, lineHeight: 18 },
  notifTime: { fontSize: 12 },
});
