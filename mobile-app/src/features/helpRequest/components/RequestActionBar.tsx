import React from "react";
import { StyleSheet, Text } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { Card, Row, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { HelpRequest, HelpRequestStatus } from "../types/helpRequest.types";
import { canDeleteRequest, canTransitionRequestStatus } from "../utils/requestValidation";

type Props = {
    request: HelpRequest;
    loading?: boolean;
    deleting?: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onUpdateStatus: (status: HelpRequestStatus) => void;
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
    const canAssign = canTransitionRequestStatus(request.status, "ASSIGNED");
    const canComplete = canTransitionRequestStatus(request.status, "COMPLETED");
    const canCancel = canTransitionRequestStatus(request.status, "CANCELLED");
    const canDelete = canDeleteRequest(request.status);

    return (
        <Card>
            <Stack gap="sm">
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Owner actions</Text>

                <Row gap="sm" style={styles.wrapRow}>
                    <AppButton
                        title="Edit Request"
                        onPress={onEdit}
                        variant="secondary"
                        fullWidth={false}
                        disabled={loading || deleting}
                    />

                    <AppButton
                        title="Mark Assigned"
                        onPress={() => onUpdateStatus("ASSIGNED")}
                        fullWidth={false}
                        disabled={!canAssign || loading || deleting}
                    />

                    <AppButton
                        title="Mark Completed"
                        onPress={() => onUpdateStatus("COMPLETED")}
                        variant="secondary"
                        fullWidth={false}
                        disabled={!canComplete || loading || deleting}
                    />
                </Row>

                <AppButton
                    title="Cancel Request"
                    onPress={() => onUpdateStatus("CANCELLED")}
                    variant="secondary"
                    disabled={!canCancel || loading || deleting}
                />

                <AppButton
                    title="Delete Request"
                    onPress={onDelete}
                    variant="danger"
                    loading={deleting}
                    disabled={!canDelete || loading}
                />
            </Stack>
        </Card>
    );
};

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    wrapRow: {
        flexWrap: "wrap",
    },
});
