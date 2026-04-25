import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useAuthStore } from "@/features/auth/store/auth.store";

import { Conversation } from "../types/conversation.type";

interface RequestContextBannerProps {
    conversation: Conversation;
}

const RequestContextBanner: React.FC<RequestContextBannerProps> = ({ conversation }) => {
    const { palette } = useThemeContext();
    const user = useAuthStore((state) => state.user);
    const userId = user?.id ?? "";
    const userEmail = user?.email ?? "";
    const me = conversation.members.find(
        (member) => (userId && member.id === userId) || (userEmail && member.email === userEmail)
    );
    const isRequester = me?.id === conversation.request.requesterId || userId === conversation.request.requesterId;
    const counterpartLabel = isRequester ? "Assigned helper" : "Requester";
    const counterpartId = isRequester
        ? conversation.request.assignedHelperId
        : conversation.request.requesterId;
    const counterpart = conversation.members.find((member) => member.id === counterpartId);
    const fallbackParticipant = conversation.members.find((member) => member.id !== me?.id);
    const counterpartName =
        counterpart?.fullName ||
        counterpart?.email ||
        fallbackParticipant?.fullName ||
        fallbackParticipant?.email ||
        "Conversation participant";
    const statusLabel =
        conversation.request.status === "ASSIGNED"
            ? "Live conversation"
            : conversation.request.status === "COMPLETED"
              ? "Read-only after completion"
              : "Conversation closed";

    return (
        <Stack style={styles.shell}>
            <Card
                style={[
                    styles.container,
                    {
                        backgroundColor: palette.surfaceSecondary,
                        borderColor: palette.border,
                    },
                ]}
            >
                <Stack gap="xs">
                    <View style={styles.topRow}>
                        <Text style={[styles.label, { color: palette.textMuted }]}>Request</Text>
                        <View
                            style={[
                                styles.statusPill,
                                {
                                    backgroundColor: palette.surfaceMuted,
                                    borderColor: palette.border,
                                },
                            ]}
                        >
                            <Text style={[styles.statusText, { color: palette.textSecondary }]}>
                                {statusLabel}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.title, { color: palette.textPrimary }]} numberOfLines={1}>
                        {conversation.request.title}
                    </Text>
                    <Text style={[styles.helperText, { color: palette.textSecondary }]} numberOfLines={1}>
                        {counterpartLabel}: {counterpartName}
                    </Text>
                </Stack>
            </Card>
        </Stack>
    );
};

const styles = StyleSheet.create({
    shell: {
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.xs,
    },
    container: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.sm,
    },
    label: {
        ...theme.typography.textStyle.caption,
    },
    title: {
        ...theme.typography.textStyle.bodySmallMedium,
    },
    helperText: {
        ...theme.typography.textStyle.caption,
    },
    statusPill: {
        borderWidth: 1,
        borderRadius: theme.radius.fill,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    statusText: {
        ...theme.typography.textStyle.caption,
    },
});

export default RequestContextBanner;
