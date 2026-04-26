import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/design-system/theme";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

const InboxEmptyState: React.FC = () => {
    const { palette } = useThemeContext();

    return (
        <View style={styles.shell}>
            <View style={[styles.iconWrap, { backgroundColor: palette.surfaceMuted }]}>
                <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={24}
                    color={palette.textSecondary}
                />
            </View>

            <Text style={[styles.title, { color: palette.textPrimary }]}>
                No conversations yet
            </Text>
            <Text style={[styles.body, { color: palette.textSecondary }]}>
                Chats appear once a helper is assigned to a request and the handoff begins.
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    shell: {
        alignItems: "center",
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.xl,
    },
    iconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        textAlign: "center",
    },
    body: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: 22,
        textAlign: "center",
        maxWidth: 280,
    },
});

export default InboxEmptyState;
