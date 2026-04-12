import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppModal } from "@/components/ui/AppModal";
import { Row, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";

import { ConversationMember } from "../types/conversation.type";

type Props = {
    visible: boolean;
    participant: ConversationMember | null;
    roleLabel?: string;
    onClose: () => void;
};

const joinedFormatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
});

const ConversationParticipantModal = ({
    visible,
    participant,
    roleLabel,
    onClose,
}: Props) => {
    const { palette } = useThemeContext();

    const joinedLabel = useMemo(() => {
        if (!participant?.joinedAt) {
            return "Not available";
        }

        return joinedFormatter.format(new Date(participant.joinedAt));
    }, [participant?.joinedAt]);

    const displayName = participant?.fullName || participant?.email || "Participant";

    return (
        <AppModal
            visible={visible}
            title="Participant Profile"
            onClose={onClose}
            showCloseButton
            scrollable
            actions={(
                <AppButton
                    title="Done"
                    variant="ghost"
                    fullWidth={false}
                    onPress={onClose}
                />
            )}
        >
            <View style={styles.avatarWrap}>
                <ProfileAvatar
                    uri={participant?.avatarUrl}
                    fullName={displayName}
                    size={76}
                />
            </View>

            <Stack gap="xs">
                <Row justify="space-between" align="center" style={styles.profileRow}>
                    <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>Name</Text>
                    <Text style={[styles.profileValue, { color: palette.textPrimary }]}>{displayName}</Text>
                </Row>

                <Row justify="space-between" align="center" style={styles.profileRow}>
                    <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>Role</Text>
                    <Text style={[styles.profileValue, { color: palette.textPrimary }]}>
                        {roleLabel || "Conversation participant"}
                    </Text>
                </Row>

                <Row justify="space-between" align="center" style={styles.profileRow}>
                    <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>Email</Text>
                    <Text style={[styles.profileValue, { color: palette.textPrimary }]}>
                        {participant?.email || "Not available"}
                    </Text>
                </Row>

                <Row justify="space-between" align="center" style={styles.profileRow}>
                    <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>Joined</Text>
                    <Text style={[styles.profileValue, { color: palette.textPrimary }]}>{joinedLabel}</Text>
                </Row>
            </Stack>
        </AppModal>
    );
};

const styles = StyleSheet.create({
    avatarWrap: {
        alignItems: "center",
        marginBottom: theme.spacing.xs,
    },
    profileRow: {
        gap: theme.spacing.sm,
    },
    profileLabel: {
        ...theme.typography.textStyle.captionMedium,
    },
    profileValue: {
        ...theme.typography.textStyle.bodySmallMedium,
        flex: 1,
        textAlign: "right",
    },
});

export default ConversationParticipantModal;
