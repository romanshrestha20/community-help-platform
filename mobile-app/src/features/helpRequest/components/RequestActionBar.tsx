import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ActionSheet } from "@/components/ui/ActionSheet";
import { Card, Row, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { HelpRequest, HelpRequestStatus } from "../types/helpRequest.types";
import { canDeleteRequest, canTransitionRequestStatus } from "../utils/requestValidation";

type Props = {
    request: HelpRequest;
    loading?: boolean;
    deleting?: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onUpdateStatus: (status: HelpRequestStatus) => Promise<unknown> | unknown;
};

export const RequestActionBar = ({
    request,
    loading = false,
    deleting = false,
    onEdit,
    onDelete,
    onUpdateStatus,
}: Props) => {
    const { palette } = useThemeContext();
    const [pendingStatusAction, setPendingStatusAction] = useState<HelpRequestStatus | null>(null);
    const [menuVisible, setMenuVisible] = useState(false);

    const canAssign = canTransitionRequestStatus(request.status, "ASSIGNED");
    const canComplete = canTransitionRequestStatus(request.status, "COMPLETED");
    const canCancel = canTransitionRequestStatus(request.status, "CANCELLED");
    const canDelete = canDeleteRequest(request.status);

    const isBusy = loading || deleting;
    const statusActionBusy = isBusy || pendingStatusAction !== null;

    useEffect(() => {
        setPendingStatusAction(null);
    }, [request.status]);

    const handleStatusAction = async (status: HelpRequestStatus) => {
        if (statusActionBusy) return;

        setPendingStatusAction(status);

        const result = await Promise.resolve(onUpdateStatus(status));
        if (!result) {
            setPendingStatusAction(null);
        }

        setMenuVisible(false);
    };

    const handleEdit = () => {
        setMenuVisible(false);
        onEdit();
    };

    const handleDelete = () => {
        setMenuVisible(false);
        onDelete();
    };

    const actionItems = [
        {
            key: "edit",
            label: "Edit Request",
            onPress: handleEdit,
            variant: "default" as const,
            disabled: isBusy,
            icon: <Ionicons name="create-outline" size={16} color={palette.primary} />,
        },
        {
            key: "assigned",
            label: "Mark Assigned",
            onPress: () => handleStatusAction("ASSIGNED"),
            variant: "default" as const,
            disabled: !canAssign || statusActionBusy,
            icon: <Ionicons name="person-add-outline" size={16} color={palette.primary} />,
            closeOnPress: false,
        },
        {
            key: "completed",
            label: "Mark Completed",
            onPress: () => handleStatusAction("COMPLETED"),
            variant: "default" as const,
            disabled: !canComplete || statusActionBusy,
            icon: <Ionicons name="checkmark-circle-outline" size={16} color={palette.primary} />,
            closeOnPress: false,
        },
        {
            key: "cancel",
            label: "Cancel Request",
            onPress: () => handleStatusAction("CANCELLED"),
            variant: "default" as const,
            disabled: !canCancel || statusActionBusy,
            icon: <Ionicons name="close-circle-outline" size={16} color={palette.primary} />,
            closeOnPress: false,
        },
        {
            key: "delete",
            label: "Delete Request",
            onPress: handleDelete,
            variant: "destructive" as const,
            disabled: !canDelete || loading,
            loading: deleting,
            icon: <Ionicons name="trash-outline" size={16} color={palette.textInverse} />,
        },
    ];

    return (
        <>
            <Card style={[styles.card, { borderColor: palette.border }]}>
                <Row justify="space-between" align="flex-start" style={styles.headerRow}>
                    <View style={styles.titleWrap}>
                        <Row gap="xs" align="center">
                            <Ionicons name="settings-outline" size={16} color={palette.textSecondary} />
                            <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                                Manage Request
                            </Text>
                        </Row>
                        <Text style={[styles.sectionSubtitle, { color: palette.textSecondary }]}>
                            Open quick actions from the menu.
                        </Text>
                    </View>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Open request action menu"
                        onPress={() => setMenuVisible(true)}
                        disabled={isBusy}
                        style={[
                            styles.menuButton,
                            {
                                borderColor: palette.border,
                                backgroundColor: palette.surfaceMuted,
                            },
                            isBusy ? styles.menuButtonDisabled : null,
                        ]}
                    >
                        <Ionicons name="ellipsis-horizontal" size={18} color={palette.textPrimary} />
                    </Pressable>
                </Row>
            </Card>

            <ActionSheet
                visible={menuVisible}
                title="Request Actions"
                description="Choose what you want to do with this request."
                actions={actionItems}
                onClose={() => setMenuVisible(false)}
                dismissOnBackdrop
            />
        </>
    );
};

const styles = StyleSheet.create({
    card: {
        marginTop: theme.spacing.md,
        borderWidth: 1,
        padding: theme.spacing.md,
    },
    headerRow: {
        width: "100%",
    },
    titleWrap: {
        flex: 1,
        paddingRight: theme.spacing.sm,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    sectionSubtitle: {
        marginTop: theme.spacing.xxs,
        fontSize: theme.typography.fontSize.sm,
    },
    menuButton: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    menuButtonDisabled: {
        opacity: 0.6,
    },
});