import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

const ChatLoadingState: React.FC = () => {
    const { palette } = useThemeContext();

    return (
        <View style={[styles.container, { backgroundColor: palette.background }]}>
            <ActivityIndicator size="large" color={palette.primary} />
            <Text style={[styles.label, { color: palette.textSecondary }]}>Loading conversation</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.sm,
    },
    label: {
        ...theme.typography.textStyle.bodySmall,
    },
});

export default ChatLoadingState;
