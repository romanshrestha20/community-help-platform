import React from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { Row, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";

import { Message } from "../types/conversation.type";

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
    showAvatar?: boolean;
    showSender?: boolean;
    groupedWithPrevious?: boolean;
    groupedWithNext?: boolean;
    onLongPress?: () => void;
    onAvatarPress?: () => void;
    deleting?: boolean;
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
});

const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    isOwn,
    showAvatar = false,
    showSender = false,
    groupedWithPrevious = false,
    groupedWithNext = false,
    onLongPress,
    onAvatarPress,
    deleting = false,
}) => {
    const { palette } = useThemeContext();

    const handleLongPress = () => {
        if (!onLongPress || deleting || message.deletedAt) {
            return;
        }

        Alert.alert("Delete message", "This removes the message from the conversation.", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: onLongPress },
        ]);
    };

    const senderName = message.sender.fullName || message.sender.email || "Unknown";
    const messageText = message.deletedAt ? "Message deleted" : message.content || "Unsupported message";
    const readLabel = message.isRead ? "Read" : "Delivered";

    return (
        <Row
            align="flex-end"
            justify={isOwn ? "flex-end" : "flex-start"}
            style={[
                styles.row,
                {
                    marginTop: groupedWithPrevious ? 2 : theme.spacing.sm,
                    marginBottom: groupedWithNext ? 2 : theme.spacing.xs,
                },
            ]}
        >
            {!isOwn ? (
                showAvatar ? (
                    <ProfileAvatar
                        uri={message.sender.avatarUrl}
                        fullName={senderName}
                        size={28}
                        onPress={onAvatarPress}
                    />
                ) : (
                    <View style={styles.avatarSpacer} />
                )
            ) : null}

            <Stack gap="xxs" style={[styles.bubbleWrap, isOwn ? styles.ownWrap : styles.otherWrap]}>
                {!isOwn && showSender ? (
                    <Text style={[styles.senderLabel, { color: palette.textMuted }]} numberOfLines={1}>
                        {senderName}
                    </Text>
                ) : null}

                <Pressable
                    onLongPress={handleLongPress}
                    disabled={!onLongPress || deleting || Boolean(message.deletedAt)}
                    style={({ pressed }) => [
                        styles.bubble,
                        isOwn ? styles.ownBubble : styles.otherBubble,
                        {
                            backgroundColor: message.deletedAt
                                ? palette.surfaceMuted
                                : isOwn
                                    ? palette.primary
                                    : palette.surface,
                            borderColor: message.deletedAt
                                ? palette.border
                                : isOwn
                                    ? palette.primary
                                    : palette.border,
                            opacity: pressed ? 0.92 : 1,
                        },
                    ]}
                >
                    {deleting ? (
                        <ActivityIndicator size="small" color={isOwn ? palette.textInverse : palette.textPrimary} />
                    ) : (
                        <Text
                            style={[
                                styles.messageText,
                                {
                                    color: message.deletedAt
                                        ? palette.textMuted
                                        : isOwn
                                            ? palette.textInverse
                                            : palette.textPrimary,
                                },
                            ]}
                        >
                            {messageText}
                        </Text>
                    )}
                </Pressable>

                <Row gap="xs" justify={isOwn ? "flex-end" : "flex-start"}>
                    <Text style={[styles.metaText, { color: palette.textMuted }]}>
                        {timeFormatter.format(new Date(message.createdAt))}
                    </Text>
                    {isOwn && !message.deletedAt ? (
                        <Text style={[styles.metaText, { color: palette.textMuted }]}>
                            {readLabel}
                        </Text>
                    ) : null}
                </Row>
            </Stack>
        </Row>
    );
};

const styles = StyleSheet.create({
    row: {
        width: "100%",
    },
    avatarSpacer: {
        width: 28,
    },
    bubbleWrap: {
        maxWidth: "72%",
    },
    ownWrap: {
        marginLeft: theme.spacing.xl,
    },
    otherWrap: {
        marginRight: theme.spacing.lg,
        marginLeft: theme.spacing.xs,
    },
    senderLabel: {
        ...theme.typography.textStyle.caption,
        marginLeft: 2,
    },
    bubble: {
        borderWidth: 1,
        paddingHorizontal: theme.spacing.sm + 1,
        paddingVertical: 9,
        shadowColor: "#122013",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },
    ownBubble: {
        borderRadius: 18,
        borderBottomRightRadius: 6,
    },
    otherBubble: {
        borderRadius: 18,
        borderBottomLeftRadius: 6,
    },
    messageText: {
        ...theme.typography.textStyle.body,
        lineHeight: 21,
    },
    metaText: {
        ...theme.typography.textStyle.caption,
    },
});

export default MessageBubble;
