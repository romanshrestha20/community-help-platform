import React from "react";
import { StyleSheet, Text } from "react-native";

import { AppBackButton } from "@/components/ui/AppBackButton";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";
import { Row, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

import { Conversation } from "../types/conversation.type";
import { getOtherParticipant } from "../utils/conversation.utils";

interface ChatHeaderProps {
    conversation: Conversation;
    userId: string;
    onAvatarPress?: () => void;
}

const getStatusLabel = (status: Conversation["request"]["status"]) => {
    switch (status) {
        case "ASSIGNED":
            return "Active";
        case "COMPLETED":
            return "Completed";
        case "CANCELLED":
            return "Cancelled";
        default:
            return "Pending";
    }
};

const ChatHeader: React.FC<ChatHeaderProps> = ({ conversation, userId, onAvatarPress }) => {
    const { palette } = useThemeContext();
    const other = getOtherParticipant(conversation, userId);
    const displayName = other?.fullName || other?.email || "Conversation";

    return (
        <Row justify="space-between" style={styles.container}>
            <Row gap="sm" style={styles.leftSection}>
                <AppBackButton
                    title=""
                    iconOnly
                    size="sm"
                    variant="secondary"
                    fallback="/messages"
                />

                <Stack gap="xxs" style={styles.titleWrap}>
                    <Text style={[styles.title, { color: palette.textPrimary }]} numberOfLines={1}>
                        {displayName}
                    </Text>
                    <Text style={[styles.subtitle, { color: palette.textMuted }]} numberOfLines={1}>
                        {getStatusLabel(conversation.request.status)}
                    </Text>
                </Stack>
            </Row>

            <ProfileAvatar
                uri={other?.avatarUrl}
                fullName={displayName}
                size={40}
                onPress={onAvatarPress}
            />
        </Row>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.xs,
        paddingBottom: theme.spacing.sm,
    },
    leftSection: {
        flex: 1,
        minWidth: 0,
    },
    titleWrap: {
        flex: 1,
        minWidth: 0,
        justifyContent: "center",
    },
    title: {
        ...theme.typography.textStyle.bodyMedium,
    },
    subtitle: {
        ...theme.typography.textStyle.caption,
    },
});

export default ChatHeader;
