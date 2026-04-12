import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

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

const ConversationListItem: React.FC<ConversationListItemProps> = ({
    conversation,
    userId,
    onPress,
}) => {
    const { palette } = useThemeContext();
    const other = getOtherParticipant(conversation, userId);
    const displayName = other?.fullName || other?.email || "Conversation";
    const avatarLetter = displayName.charAt(0).toUpperCase();
    const lastActivity = conversation.lastMessage?.createdAt || conversation.updatedAt;

    return (
        <Pressable onPress={onPress} style={({ pressed }) => [pressed ? styles.pressed : null]}>
            <View
                style={[
                    styles.card,
                    {
                        backgroundColor: palette.surface,
                        borderColor: palette.border,
                    },
                ]}
            >
                {other?.avatarUrl ? (
                    <Image source={{ uri: other.avatarUrl }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: palette.surfaceMuted }]}>
                        <Text style={[styles.avatarLabel, { color: palette.textSecondary }]}>
                            {avatarLetter}
                        </Text>
                    </View>
                )}

                <View style={styles.content}>
                    <View style={styles.topRow}>
                        <Text style={[styles.name, { color: palette.textPrimary }]} numberOfLines={1}>
                            {displayName}
                        </Text>
                        <Text style={[styles.date, { color: palette.textMuted }]}>
                            {relativeDateFormatter.format(new Date(lastActivity))}
                        </Text>
                    </View>

                    <Text style={[styles.preview, { color: palette.textSecondary }]} numberOfLines={2}>
                        {getLastMessagePreview(conversation, userId)}
                    </Text>

                    <View style={styles.bottomRow}>
                        <View
                            style={[
                                styles.requestChip,
                                {
                                    backgroundColor: palette.surfaceSecondary,
                                    borderColor: palette.border,
                                },
                            ]}
                        >
                            <Ionicons name="document-text-outline" size={12} color={palette.textMuted} />
                            <Text style={[styles.requestChipText, { color: palette.textSecondary }]} numberOfLines={1}>
                                {conversation.request.title}
                            </Text>
                        </View>

                        {conversation.unreadCount > 0 ? (
                            <View style={[styles.unreadBadge, { backgroundColor: palette.primary }]}>
                                <Text style={[styles.unreadLabel, { color: palette.textInverse }]}>
                                    {conversation.unreadCount}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                </View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    pressed: {
        opacity: 0.92,
    },
    card: {
        flexDirection: "row",
        borderWidth: 1,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatarFallback: {
        alignItems: "center",
        justifyContent: "center",
    },
    avatarLabel: {
        ...theme.typography.textStyle.bodyMedium,
    },
    content: {
        flex: 1,
        marginLeft: theme.spacing.sm,
        minWidth: 0,
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    name: {
        ...theme.typography.textStyle.bodyMedium,
        flex: 1,
    },
    date: {
        ...theme.typography.textStyle.caption,
    },
    preview: {
        ...theme.typography.textStyle.bodySmall,
        marginTop: 4,
    },
    bottomRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
    requestChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 6,
        flex: 1,
        minWidth: 0,
    },
    requestChipText: {
        ...theme.typography.textStyle.caption,
        flex: 1,
    },
    unreadBadge: {
        minWidth: 24,
        height: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 6,
    },
    unreadLabel: {
        ...theme.typography.textStyle.captionMedium,
    },
});

export default ConversationListItem;
