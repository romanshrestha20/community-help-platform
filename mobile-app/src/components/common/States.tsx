import React from "react";
import { View, StyleSheet, Text } from "react-native";
import {Card }from "@/design-system/layout/Card";
import {Stack} from "@/design-system/layout/Stack";
import {AppButton} from "@/components/ui/AppButton";
import { spacing, colors, typography } from "@/design-system/tokens";

interface EmptyStateProps {
    title?: string;
    message?: string;
    icon?: string;
    actionLabel?: string;
    onAction?: () => void;
}

interface ErrorStateProps {
    title?: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}

interface LoadingStateProps {
    message?: string;
}

interface ConfirmDialogProps {
    title: string;
    message: string;
    cancelLabel?: string;
    confirmLabel?: string;
    onCancel: () => void;
    onConfirm: () => void;
    isDangerous?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title = "No Data",
    message = "No items found",
    actionLabel,
    onAction,
}) => (
    <View style={styles.emptyContainer}>
        <Card>
            <Stack gap="md" style={{ alignItems: "center" }}>
                <Text style={[styles.bodyText, { fontWeight: typography.fontWeight.semibold }]}>{title}</Text>
                <Text style={[styles.captionText, { color: colors.textSecondary, textAlign: "center" }]}>
                    {message}
                </Text>
                {actionLabel && onAction && (
                    <AppButton title={actionLabel} onPress={onAction} />
                )}
            </Stack>
        </Card>
    </View>
);

export const ErrorState: React.FC<ErrorStateProps> = ({
    title = "Error",
    message,
    actionLabel = "Retry",
    onAction,
}) => (
    <View style={styles.errorContainer}>
        <Card style={{ backgroundColor: colors.dangerSoft }}>
            <Stack gap="md">
                <Text style={[styles.bodyText, { color: colors.danger, fontWeight: typography.fontWeight.semibold }]}>
                    {title}
                </Text>
                <Text style={[styles.captionText, { color: colors.danger }]}>{message}</Text>
                {onAction && <AppButton title={actionLabel} onPress={onAction} />}
            </Stack>
        </Card>
    </View>
);

export const LoadingState: React.FC<LoadingStateProps> = ({
    message = "Loading...",
}) => (
    <View style={styles.loadingContainer}>
        <Card>
            <Stack gap="md" style={{ alignItems: "center" }}>
                <Text style={styles.bodyText}>{message}</Text>
            </Stack>
        </Card>
    </View>
);

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    title,
    message,
    cancelLabel = "Cancel",
    confirmLabel = "Confirm",
    onCancel,
    onConfirm,
    isDangerous = false,
}) => (
    <View style={styles.dialogContainer}>
        <Card>
            <Stack gap="md">
                <Text style={[styles.bodyText, { fontWeight: typography.fontWeight.semibold }]}>{title}</Text>
                <Text style={[styles.captionText, { color: colors.textSecondary }]}>{message}</Text>

                <View style={styles.buttonRow}>
                    <AppButton
                        title={cancelLabel}
                        onPress={onCancel}
                        variant="primary"
                        fullWidth={false}
                    />
                    <AppButton
                        title={confirmLabel}
                        onPress={onConfirm}
                        variant={isDangerous ? "danger" : "primary"}
                        fullWidth={false}
                    />
                </View>
            </Stack>
        </Card>
    </View>
);

const styles = StyleSheet.create({
    bodyText: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.md,
        lineHeight: typography.lineHeight.md,
        fontWeight: typography.fontWeight.regular,
        color: colors.textPrimary,
    },
    captionText: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        lineHeight: typography.lineHeight.sm,
        fontWeight: typography.fontWeight.regular,
        color: colors.textPrimary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.lg,
    },
    errorContainer: {
        padding: spacing.lg,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.lg,
    },
    dialogContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.lg,
    },
    buttonRow: {
        flexDirection: "row",
        gap: spacing.sm,
        justifyContent: "flex-end",
    },
});
