import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Card, colors, spacing, theme, typography } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
    title: string;
    subtitle?: string;
    compact?: boolean;
    onPress: () => void;
};

export const RequestFormTrigger = ({ title, subtitle, compact = false, onPress }: Props) => {
    const { palette } = useThemeContext();

    if (compact) {
        return (
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={title}
                onPress={onPress}
                style={[
                    styles.compactCard,
                    {
                        backgroundColor: palette.surfaceMuted,
                        borderColor: palette.border,
                    },
                ]}
                activeOpacity={0.82}
            >
                <View style={[styles.compactIcon, { backgroundColor: palette.primary }]}>
                    <Ionicons name="add" size={18} color={palette.textInverse} />
                </View>
                <View style={styles.compactCopy}>
                    <Text style={[styles.compactTitle, { color: palette.textPrimary }]}>{title}</Text>
                    <Text style={[styles.compactSubtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <Card style={styles.card}>
            <View style={styles.row}>
                <View style={styles.iconWrap}>
                    <Ionicons name="sparkles-outline" size={20} color={palette.primary} />
                </View>
                <View style={styles.copy}>
                    <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>
                    <Text style={[styles.subtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
                </View>
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={title}
                    onPress={onPress}
                    style={[
                        styles.quickAction,
                        { borderColor: palette.border, backgroundColor: palette.surface },
                    ]}
                    activeOpacity={0.8}
                >
                    <Ionicons name="arrow-up-right-box" size={18} color={palette.textPrimary} />
                </TouchableOpacity>
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        marginVertical: spacing.xs,
        borderRadius: theme.radius.lg,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.fill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    copy: {
        flex: 1,
    },
    title: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
    },
    subtitle: {
        marginTop: 2,
        fontSize: typography.fontSize.xs,
        lineHeight: 18,
    },
    quickAction: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.fill,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
    },
    compactCard: {
        minHeight: 56,
        borderRadius: theme.radius.lg,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
    },
    compactIcon: {
        width: 34,
        height: 34,
        borderRadius: theme.radius.fill,
        alignItems: "center",
        justifyContent: "center",
    },
    compactCopy: {
        flex: 1,
    },
    compactTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
    },
    compactSubtitle: {
        marginTop: 2,
        fontSize: typography.fontSize.xs,
    },
});