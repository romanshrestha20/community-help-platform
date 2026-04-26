import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Row, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

interface ConversationStarterBannerProps {
    note: string;
}

const ConversationStarterBanner: React.FC<ConversationStarterBannerProps> = ({ note }) => {
    const { palette } = useThemeContext();

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: palette.surfaceMuted,
                    borderColor: palette.border,
                },
            ]}
        >
            <Row align="flex-start" gap="xs">
                <Ionicons name="information-circle-outline" size={16} color={palette.textSecondary} />
                <Text style={[styles.note, { color: palette.textSecondary }]}>{note}</Text>
            </Row>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
        borderWidth: 1,
        borderRadius: theme.radius.md,
    },
    note: {
        ...theme.typography.textStyle.bodySmall,
        flex: 1,
        lineHeight: 20,
    },
});

export default ConversationStarterBanner;
