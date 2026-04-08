import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { spacing, colors, typography, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
    title: string;
    subtitle: string;
};

export const RequestFormHero = ({ title, subtitle }: Props) => {
    const { palette } = useThemeContext();

    return (
        <View
            style={[
                styles.card,
                { backgroundColor: palette.surfaceMuted, borderColor: palette.border },
            ]}
        >
            <View style={[styles.icon, { backgroundColor: palette.primary }]}>
                <Ionicons name="document-text-outline" size={18} color={palette.textInverse} />
            </View>
            <View style={styles.copy}>
                <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>
                <Text style={[styles.subtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
    },
    icon: {
        width: 42,
        height: 42,
        borderRadius: theme.radius.fill,
        alignItems: "center",
        justifyContent: "center",
    },
    copy: {
        flex: 1,
    },
    title: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
    subtitle: {
        marginTop: 4,
        fontSize: typography.fontSize.sm,
        lineHeight: 20,
    },
});