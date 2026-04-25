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
                    marginTop: groupedWithPrevious ? 1 : theme.spacing.sm,
                    marginBottom: groupedWithNext ? 1 : theme.spacing.xs,
                },
            ]}
        >
            {!isOwn ? (
                showAvatar ? (
                    <ProfileAvatar
                        uri={message.sender.avatarUrl}
                        fullName={senderName}
                        size={30}
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
                        groupedWithPrevious && (isOwn ? styles.ownBubbleConnectedTop : styles.otherBubbleConnectedTop),
                        groupedWithNext && (isOwn ? styles.ownBubbleConnectedBottom : styles.otherBubbleConnectedBottom),
                        {
                            backgroundColor: message.deletedAt
                                ? palette.surfaceSecondary
                                : isOwn
                                    ? palette.primary
                                    : palette.surface,
                            borderColor: message.deletedAt
                                ? palette.border
                                : isOwn
                                    ? palette.primary
                                    : palette.border,
                        },
                        message.deletedAt ? styles.deletedBubble : null,
                        pressed && !message.deletedAt ? styles.bubblePressed : null,
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

                <Row
                    gap="xs"
                    justify={isOwn ? "flex-end" : "flex-start"}
                    style={styles.metaRow}
                >
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
        width: 30,
    },
    bubbleWrap: {
        maxWidth: "82%",
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
        marginBottom: 1,
    },
    bubble: {
        borderWidth: 1,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 9,
    },
    ownBubble: {
        borderRadius: 22,
        borderBottomRightRadius: 8,
    },
    otherBubble: {
        borderRadius: 22,
        borderBottomLeftRadius: 8,
    },
    ownBubbleConnectedTop: {
        borderTopRightRadius: 10,
    },
    otherBubbleConnectedTop: {
        borderTopLeftRadius: 10,
    },
    ownBubbleConnectedBottom: {
        borderBottomRightRadius: 18,
    },
    otherBubbleConnectedBottom: {
        borderBottomLeftRadius: 18,
    },
    deletedBubble: {
        borderStyle: "dashed",
    },
    bubblePressed: {
        opacity: 0.92,
    },
    messageText: {
        ...theme.typography.textStyle.body,
    },
    metaRow: {
        marginTop: 1,
        paddingHorizontal: 2,
    },
    metaText: {
        ...theme.typography.textStyle.caption,
    },
});

export default MessageBubble;
