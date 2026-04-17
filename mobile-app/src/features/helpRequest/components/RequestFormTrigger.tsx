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
                        backgroundColor: palette.primary,
                        borderColor: palette.primary,
                        shadowColor: palette.primary,
                    },
                ]}
                activeOpacity={0.82}
            >
                <View style={[styles.compactIcon, { backgroundColor: "rgba(255,255,255,0.16)" }]}>
                    <Ionicons name="add" size={18} color={palette.textInverse} />
                </View>
                <View style={styles.compactCopy}>
                    <Text style={[styles.compactTitle, { color: palette.textInverse }]}>{title}</Text>
                    {subtitle ? (
                        <Text style={[styles.compactSubtitle, { color: "rgba(255,255,255,0.78)" }]}>{subtitle}</Text>
                    ) : null}
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
        alignSelf: "flex-start",
        minHeight: 42,
        borderRadius: theme.radius.fill,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: 6,
        borderWidth: 1,
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 4,
    },
    compactIcon: {
        width: 26,
        height: 26,
        borderRadius: theme.radius.fill,
        alignItems: "center",
        justifyContent: "center",
    },
    compactCopy: {
        flexShrink: 1,
    },
    compactTitle: {
        fontSize: 13,
        fontWeight: typography.fontWeight.bold,
    },
    compactSubtitle: {
        marginTop: 2,
        fontSize: typography.fontSize.xs,
    },
});
