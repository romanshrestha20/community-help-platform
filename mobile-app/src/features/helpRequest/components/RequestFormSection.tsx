import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { Card, Stack, spacing, colors, typography, theme } from "@/design-system";

type Props = {
    title: string;
    description?: string;
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
};

export const RequestFormSection = ({ title, description, children, style }: Props) => {
    return (
        <Card style={[styles.card, style]}>
            <Stack gap="sm">
                <View style={styles.header}>
                    <View style={styles.titleWrap}>
                        <Text style={styles.title}>{title}</Text>
                        {description ? <Text style={styles.description}>{description}</Text> : null}
                    </View>
                </View>

                {children}
            </Stack>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: spacing.md,
        borderRadius: theme.radius.lg,
    },
    header: {
        gap: 2,
    },
    titleWrap: {
        gap: 2,
    },
    title: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
        color: colors.textPrimary,
    },
    description: {
        fontSize: typography.fontSize.xs,
        lineHeight: 18,
        color: colors.textSecondary,
    },
});