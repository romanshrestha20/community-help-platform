import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text } from "react-native";

import { Card, Row, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

interface ConversationStarterBannerProps {
    note: string;
}

const ConversationStarterBanner: React.FC<ConversationStarterBannerProps> = ({ note }) => {
    const { palette } = useThemeContext();

    return (
        <Stack style={styles.shell}>
            <Card
                style={[
                    styles.container,
                    {
                        backgroundColor: palette.infoSurface,
                        borderColor: palette.border,
                    },
                ]}
            >
                <Row align="flex-start" gap="xs">
                    <Ionicons name="document-text-outline" size={16} color={palette.secondary} />
                    <Stack gap="xxs" style={styles.textWrap}>
                        <Text style={[styles.title, { color: palette.textPrimary }]}>Starter note</Text>
                        <Text style={[styles.note, { color: palette.textSecondary }]}>{note}</Text>
                    </Stack>
                </Row>
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
    textWrap: {
        flex: 1,
    },
    title: {
        ...theme.typography.textStyle.labelStrong,
    },
    note: {
        ...theme.typography.textStyle.bodySmall,
    },
});

export default ConversationStarterBanner;
