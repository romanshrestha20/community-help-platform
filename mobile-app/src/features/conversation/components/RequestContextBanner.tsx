import React from "react";
import { StyleSheet, Text } from "react-native";

import { Card, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

import { Conversation } from "../types/conversation.type";

interface RequestContextBannerProps {
    conversation: Conversation;
}

const RequestContextBanner: React.FC<RequestContextBannerProps> = ({ conversation }) => {
    const { palette } = useThemeContext();

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
                <Stack gap="xxs">
                    <Text style={[styles.label, { color: palette.textMuted }]}>Request</Text>
                    <Text style={[styles.title, { color: palette.textPrimary }]} numberOfLines={1}>
                        {conversation.request.title}
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
        paddingVertical: theme.spacing.xs,
    },
    label: {
        ...theme.typography.textStyle.caption,
    },
    title: {
        ...theme.typography.textStyle.bodySmallMedium,
    },
});

export default RequestContextBanner;
