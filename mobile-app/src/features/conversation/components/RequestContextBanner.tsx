import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/design-system";
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
    const counterpartLabel = isRequester ? "Helper" : "Requester";
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

    return (
        <View
            style={[
                styles.container,
                {
                    borderTopColor: palette.border,
                    borderBottomColor: palette.border,
                },
            ]}
        >
            <View style={styles.topRow}>
                <Text style={[styles.label, { color: palette.textSecondary }]}>Request</Text>
                <Text style={[styles.state, { color: palette.textSecondary }]}>
                    {conversation.request.status === "ASSIGNED" ? "Live" : "Archive"}
                </Text>
            </View>
            <Text style={[styles.title, { color: palette.textPrimary }]} numberOfLines={2}>
                {conversation.request.title}
            </Text>
            <Text style={[styles.meta, { color: palette.textSecondary }]} numberOfLines={1}>
                {counterpartLabel}: {counterpartName}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 2,
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.xs,
        paddingVertical: theme.spacing.sm + 2,
        borderTopWidth: 1,
        borderBottomWidth: 1,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.sm,
    },
    label: {
        ...theme.typography.textStyle.caption,
        textTransform: "uppercase",
        letterSpacing: 0.7,
    },
    state: {
        ...theme.typography.textStyle.caption,
    },
    title: {
        ...theme.typography.textStyle.bodySmallMedium,
        lineHeight: 23,
    },
    meta: {
        ...theme.typography.textStyle.caption,
    },
});

export default RequestContextBanner;
