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
    isFirst?: boolean;
    isLast?: boolean;
}

const relativeDateFormatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
});

const ConversationListItem: React.FC<ConversationListItemProps> = ({
    conversation,
    userId,
    onPress,
    isFirst = false,
    isLast = false,
}) => {
    const { palette } = useThemeContext();
    const other = getOtherParticipant(conversation, userId);
    const displayName = other?.fullName || other?.email || "Conversation";
    const lastActivity = conversation.lastMessage?.createdAt || conversation.updatedAt;
    const hasUnread = conversation.unreadCount > 0;

    const statusTone = (() => {
        switch (conversation.request.status) {
            case "OPEN":
                return {
                    backgroundColor: palette.primarySoft,
                    color: palette.primary,
                    label: "Open",
                };
            case "ASSIGNED":
                return {
                    backgroundColor: palette.accentSoft,
                    color: palette.accent,
                    label: "Assigned",
                };
            case "COMPLETED":
                return {
                    backgroundColor: palette.successSoft,
                    color: palette.success,
                    label: "Completed",
                };
            case "CANCELLED":
            default:
                return {
                    backgroundColor: palette.dangerSoftFill,
                    color: palette.danger,
                    label: "Closed",
                };
        }
    })();

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.pressable,
                pressed ? styles.pressed : null,
            ]}
        >
            <View
                style={[
                    styles.row,
                    {
                        backgroundColor: hasUnread ? palette.surface : palette.surfaceSecondary,
                        borderColor: hasUnread ? palette.primarySoft : palette.border,
                    },
                    isFirst ? styles.firstRow : null,
                    isLast ? styles.lastRow : null,
                ]}
            >
                <View style={styles.leadingWrap}>
                    <ProfileAvatar
                        uri={other?.avatarUrl}
                        fullName={displayName}
                        size={52}
                    />

                    {hasUnread ? (
                        <View
                            style={[
                                styles.presenceDot,
                                { backgroundColor: palette.primary },
                            ]}
                        />
                    ) : null}
                </View>

                <View style={styles.content}>
                    <View style={styles.topRow}>
                        <View style={styles.titleCluster}>
                            <Text
                                style={[styles.name, { color: palette.textPrimary }]}
                                numberOfLines={1}
                            >
                                {displayName}
                            </Text>

                            <View
                                style={[
                                    styles.statusBadge,
                                    { backgroundColor: statusTone.backgroundColor },
                                ]}
                            >
                                <Text style={[styles.statusLabel, { color: statusTone.color }]}>
                                    {statusTone.label}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.trailingMeta}>
                            <Text style={[styles.date, { color: palette.textMuted }]}>
                                {relativeDateFormatter.format(new Date(lastActivity))}
                            </Text>
                            {hasUnread ? (
                                <View
                                    style={[
                                        styles.unreadBadge,
                                        { backgroundColor: palette.primary },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.unreadLabel,
                                            { color: palette.textInverse },
                                        ]}
                                    >
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

                    <Text
                        style={[
                            styles.preview,
                            {
                                color: hasUnread
                                    ? palette.textPrimary
                                    : palette.textSecondary,
                            },
                        ]}
                        numberOfLines={2}
                    >
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
                            <Ionicons
                                name="document-text-outline"
                                size={12}
                                color={palette.textMuted}
                            />
                            <Text
                                style={[
                                    styles.requestChipText,
                                    { color: palette.textSecondary },
                                ]}
                                numberOfLines={1}
                            >
                                {conversation.request.title}
                            </Text>
                        </View>

                        <Text style={[styles.threadMeta, { color: palette.textMuted }]}>
                            {conversation.lastMessage ? "Recent reply" : "New thread"}
                        </Text>
                    </View>
                </View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    pressable: {
        borderRadius: 26,
    },
    pressed: {
        opacity: 0.9,
    },
    row: {
        flexDirection: "row",
        borderWidth: 1,
        borderRadius: 26,
        padding: theme.spacing.md,
        shadowColor: "#122013",
        shadowOpacity: 0.04,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 1,
    },
    firstRow: {
        marginTop: 0,
    },
    lastRow: {
        marginBottom: 0,
    },
    leadingWrap: {
        position: "relative",
    },
    presenceDot: {
        position: "absolute",
        right: 1,
        bottom: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
    content: {
        flex: 1,
        marginLeft: theme.spacing.sm,
        minWidth: 0,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: theme.spacing.sm,
    },
    titleCluster: {
        flex: 1,
        minWidth: 0,
        gap: 6,
    },
    name: {
        ...theme.typography.textStyle.bodyMedium,
        flex: 1,
        fontWeight: "700",
    },
    statusBadge: {
        alignSelf: "flex-start",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    statusLabel: {
        ...theme.typography.textStyle.caption,
        fontWeight: "700",
    },
    trailingMeta: {
        alignItems: "flex-end",
        gap: 8,
    },
    date: {
        ...theme.typography.textStyle.caption,
    },
    preview: {
        ...theme.typography.textStyle.bodySmall,
        marginTop: 8,
        lineHeight: 21,
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
    threadMeta: {
        ...theme.typography.textStyle.caption,
        fontWeight: "600",
    },
    unreadBadge: {
        minWidth: 26,
        height: 26,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 6,
    },
    unreadLabel: {
        ...theme.typography.textStyle.captionMedium,
    },
});

export default ConversationListItem;
