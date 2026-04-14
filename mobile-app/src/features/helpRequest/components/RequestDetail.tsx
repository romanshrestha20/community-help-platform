import React from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import { Card } from "@/design-system/layout/Card";
import { Stack } from "@/design-system/layout/Stack";
import { Row } from "@/design-system/layout/Row";
import { AppButton } from "@/components/ui/AppButton";
import { spacing, colors, typography } from "@/design-system";
import { HelpRequest, HelpRequestStatus } from "../types/helpRequest.types";
import { formatRequestLocation, getRequestCategoryLabel } from "../utils/requestDisplay";

interface RequestDetailProps {
    request: HelpRequest;
    onEdit?: () => void;
    onDelete?: () => void;
    onStatusChange?: (status: HelpRequestStatus) => void;
    onPlaceBid?: () => void;
    isOwner?: boolean;
    loading?: boolean;
}

const getStatusColor = (status: HelpRequestStatus): string => {
    switch (status) {
        case "OPEN":
            return colors.success;
        case "ASSIGNED":
            return colors.warning;
        case "COMPLETED":
            return colors.primary;
        case "CANCELLED":
            return colors.danger;
        default:
            return colors.textSecondary;
    }
};

export const RequestDetail: React.FC<RequestDetailProps> = ({
    request,
    onEdit,
    onDelete,
    onStatusChange,
    onPlaceBid,
    isOwner = false,
    loading = false,
}) => {
    const locationLabel = formatRequestLocation(request);
    const statusActions: { label: string; status: HelpRequestStatus; color?: string }[] = [];
    if (request.status === "OPEN") {
        statusActions.push({ label: "Mark as Assigned", status: "ASSIGNED" });
    }
    if (request.status === "ASSIGNED") {
        statusActions.push({ label: "Mark as Completed", status: "COMPLETED" });
        statusActions.push({ label: "Cancel", status: "CANCELLED", color: "danger" });
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Basic Info */}
            <Card style={styles.section}>
                <Stack gap="md">
                    <View>
                        <Text style={[styles.captionText, { color: colors.textSecondary }]}>Title</Text>
                        <Text style={styles.bodyText}>{request.title}</Text>
                    </View>

                    <View>
                        <Text style={[styles.captionText, { color: colors.textSecondary }]}>Requester</Text>
                        <Text style={styles.bodyText}>{request.requesterName}</Text>
                    </View>

                    <Row style={{ justifyContent: "space-between" }}>
                        <View>
                            <Text style={[styles.captionText, { color: colors.textSecondary }]}>Status</Text>
                            <Text
                                style={[
                                    styles.bodyText,
                                    { color: getStatusColor(request.status), fontWeight: typography.fontWeight.semibold },
                                ]}
                            >
                                {request.status}
                            </Text>
                        </View>
                        <View>
                            <Text style={[styles.captionText, { color: colors.textSecondary }]}>Category</Text>
                            <Text style={styles.bodyText}>{getRequestCategoryLabel(request)}</Text>
                        </View>
                    </Row>
                </Stack>
            </Card>

            {/* Description */}
            <Card style={styles.section}>
                <Stack gap="sm">
                    <Text style={[styles.captionText, { color: colors.textSecondary }]}>Description</Text>
                    <Text style={styles.bodyText}>{request.description}</Text>
                </Stack>
            </Card>

            {/* Budget & Location */}
            <Card style={styles.section}>
                <Stack gap="md">
                    {request.budget && (
                        <Row style={{ justifyContent: "space-between" }}>
                            <Text style={[styles.captionText, { color: colors.textSecondary }]}>Budget</Text>
                            <Text style={[styles.bodyText, { fontWeight: typography.fontWeight.semibold, color: colors.primary }]}>
                                ${request.budget}
                            </Text>
                        </Row>
                    )}

                    {locationLabel !== "Location not set" && (
                        <Row style={{ justifyContent: "space-between" }}>
                            <Text style={[styles.captionText, { color: colors.textSecondary }]}>Location</Text>
                            <Text style={styles.bodyText}>{locationLabel}</Text>
                        </Row>
                    )}

                    <Row style={{ justifyContent: "space-between" }}>
                        <Text style={[styles.captionText, { color: colors.textSecondary }]}>Bids Received</Text>
                        <Text style={styles.bodyText}>{request.bidCount}</Text>
                    </Row>

                    <Row style={{ justifyContent: "space-between" }}>
                        <Text style={[styles.captionText, { color: colors.textSecondary }]}>Created</Text>
                        <Text style={styles.captionText}>
                            {new Date(request.createdAt).toLocaleDateString()}
                        </Text>
                    </Row>
                </Stack>
            </Card>

            {/* Status Actions */}
            {isOwner && statusActions.length > 0 && (
                <Card style={styles.section}>
                    <Stack gap="sm">
                        <Text style={[styles.captionText, { fontWeight: typography.fontWeight.semibold }]}>Change Status</Text>
                        {statusActions.map((action, index) => (
                            <AppButton
                                key={index}
                                title={action.label}
                                onPress={() => onStatusChange?.(action.status)}
                                variant={action.color as any}
                                disabled={loading}
                            />
                        ))}
                    </Stack>
                </Card>
            )}

            {/* Edit/Delete Actions */}
            {isOwner && (
                <Card style={styles.section}>
                    <Stack gap="sm">
                        {onEdit && (
                            <AppButton
                                title="Edit Request"
                                onPress={onEdit}
                                disabled={loading}
                            />
                        )}
                        {onDelete && request.status !== "COMPLETED" && (
                            <AppButton
                                title="Delete Request"
                                onPress={onDelete}
                                variant="danger"
                                disabled={loading}
                            />
                        )}
                    </Stack>
                </Card>
            )}

            {/* Place Bid Action */}
            {!isOwner && request.status === "OPEN" && (
                <Card style={styles.section}>
                    <AppButton
                        title="Place a Bid"
                        onPress={onPlaceBid ?? (() => { })}
                        disabled={loading}
                    />
                </Card>
            )}
        </ScrollView>
    );
};

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
    container: {
        padding: spacing.lg,
    },
    section: {
        marginBottom: spacing.md,
    },
});
