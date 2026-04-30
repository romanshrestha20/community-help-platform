import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";

import { Conversation } from "../types/conversation.type";
import { getLastMessagePreview, getOtherParticipant } from "../utils/conversation.utils";

interface ConversationListItemProps {
    conversation: Conversation;
    userId: string;
    onPress: () => void;
}

const relativeDateFormatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
});

const getStatusLabel = (status: Conversation["request"]["status"]) =>
    status === "ASSIGNED"
        ? "Live"
        : status === "COMPLETED"
          ? "Completed"
          : status === "CANCELLED"
            ? "Closed"
            : "Pending";

const ConversationListItem: React.FC<ConversationListItemProps> = ({
    conversation,
    userId,
    onPress,
}) => {
    const { palette } = useThemeContext();
    const other = getOtherParticipant(conversation, userId);
    const displayName = other?.fullName || other?.email || "Conversation";
    const lastActivity = conversation.lastMessage?.createdAt || conversation.updatedAt;
    const hasUnread = conversation.unreadCount > 0;
    const preview = getLastMessagePreview(conversation, userId);
    const isLive = conversation.request.status === "ASSIGNED";

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.pressable,
                {
                    backgroundColor: pressed ? palette.surfaceMuted : "transparent",
                    borderColor: hasUnread ? palette.primarySoft : palette.border,
                },
            ]}
        >
            <View style={styles.leading}>
                <ProfileAvatar uri={other?.avatarUrl} fullName={displayName} size={48} />
                {hasUnread ? <View style={[styles.dot, { backgroundColor: palette.primary }]} /> : null}
            </View>

            <View style={styles.content}>
                <View style={styles.topRow}>
                    <Text
                        style={[
                            styles.name,
                            { color: palette.textPrimary },
                            hasUnread ? styles.nameUnread : null,
                        ]}
                        numberOfLines={1}
                    >
                        {displayName}
                    </Text>
                    <Text style={[styles.date, { color: palette.textMuted }]}>
                        {relativeDateFormatter.format(new Date(lastActivity))}
                    </Text>
                </View>

                <Text
                    style={[
                        styles.preview,
                        { color: palette.textSecondary },
                        hasUnread ? styles.previewUnread : null,
                    ]}
                    numberOfLines={1}
                >
                    {preview}
                </Text>

                <View style={styles.bottomRow}>
                    <Text style={[styles.request, { color: palette.textMuted }]} numberOfLines={1}>
                        {conversation.request.title}
                    </Text>

                    <View style={styles.trailing}>
                        <View style={styles.statusWrap}>
                            {isLive ? (
                                <View style={[styles.liveDot, { backgroundColor: palette.primary }]} />
                            ) : null}
                            <Text
                                style={[
                                    styles.status,
                                    {
                                        color:
                                            conversation.request.status === "ASSIGNED"
                                                ? palette.primary
                                                : palette.textSecondary,
                                    },
                                ]}
                            >
                                {getStatusLabel(conversation.request.status)}
                            </Text>
                        </View>
                        {hasUnread ? (
                            <View style={[styles.unreadBadge, { backgroundColor: palette.primary }]}>
                                <Text style={[styles.unreadLabel, { color: palette.textInverse }]}>
                                    {conversation.unreadCount}
                                </Text>
                            </View>
                        ) : (
                            <Ionicons
                                name="chevron-forward-outline"
                                size={16}
                                color={palette.textMuted}
                            />
                        )}
                    </View>
                </View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    pressable: {
        flexDirection: "row",
        gap: theme.spacing.sm,
        borderWidth: 1,
        borderRadius: theme.radius.lg,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
    },
    leading: {
        position: "relative",
    },
    dot: {
        position: "absolute",
        right: 0,
        top: 1,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
    content: {
        flex: 1,
        minWidth: 0,
        gap: 6,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: theme.spacing.sm,
    },
    name: {
        ...theme.typography.textStyle.bodyMedium,
        flex: 1,
        fontWeight: "700",
    },
    nameUnread: {
        fontWeight: "800",
    },
    date: {
        ...theme.typography.textStyle.caption,
    },
    preview: {
        ...theme.typography.textStyle.bodySmall,
        lineHeight: 20,
    },
    previewUnread: {
        fontWeight: "700",
    },
    bottomRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.sm,
    },
    request: {
        ...theme.typography.textStyle.caption,
        flex: 1,
    },
    trailing: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    statusWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    status: {
        ...theme.typography.textStyle.captionMedium,
    },
    unreadBadge: {
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 6,
    },
    unreadLabel: {
        ...theme.typography.textStyle.caption,
        fontWeight: "700",
    },
});

export default ConversationListItem;
