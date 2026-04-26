import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppBackButton } from "@/components/ui/AppBackButton";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";
import { Row, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

import { Conversation } from "../types/conversation.type";
import { getOtherParticipant } from "../utils/conversation.utils";

interface ChatHeaderProps {
    conversation: Conversation;
    userId: string;
    userEmail?: string;
    onAvatarPress?: () => void;
}

const getStatusLabel = (status: Conversation["request"]["status"]) => {
    switch (status) {
        case "ASSIGNED":
            return "Live handoff";
        case "COMPLETED":
            return "Completed";
        case "CANCELLED":
            return "Closed";
        default:
            return "Waiting";
    }
};

const ChatHeader: React.FC<ChatHeaderProps> = ({ conversation, userId, userEmail, onAvatarPress }) => {
    const { palette } = useThemeContext();
    const other = getOtherParticipant(conversation, userId, userEmail);
    const displayName = other?.fullName || other?.email || "Assigned request";
    const statusActive = conversation.request.status === "ASSIGNED";

    return (
        <Row justify="space-between" align="center" style={styles.container}>
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
                    <Row align="center" gap="xs">
                        <View
                            style={[
                                styles.statusDot,
                                { backgroundColor: statusActive ? palette.primary : palette.textMuted },
                            ]}
                        />
                        <Text style={[styles.subtitle, { color: palette.textSecondary }]} numberOfLines={1}>
                            {getStatusLabel(conversation.request.status)}
                        </Text>
                    </Row>
                </Stack>
            </Row>

            <Pressable onPress={onAvatarPress} hitSlop={8}>
                <ProfileAvatar
                    uri={other?.avatarUrl}
                    fullName={displayName}
                    size={40}
                />
            </Pressable>
        </Row>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm + 2,
        paddingBottom: theme.spacing.sm + 2,
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
        fontWeight: "700",
        lineHeight: 24,
    },
    subtitle: {
        ...theme.typography.textStyle.caption,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
});

export default ChatHeader;
