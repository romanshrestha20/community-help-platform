import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Card } from "@/design-system/layout/Card";
import { Stack } from "@/design-system/layout/Stack";
import { Row } from "@/design-system/layout/Row";
import { AppButton } from "@/components/ui/AppButton";
import { spacing, colors, typography } from "@/design-system";
import { HelpRequest, HelpRequestStatus } from "../types/helpRequest.types";

interface RequestCardProps {
    request: HelpRequest;
    onPress?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onStatusChange?: (status: HelpRequestStatus) => void;
    isOwner?: boolean;
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

export const RequestCard: React.FC<RequestCardProps> = ({
    request,
    onPress,
    onEdit,
    onDelete,
    onStatusChange,
    isOwner = false,
}) => {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card style={styles.card}>
                <Stack gap="md">
                    {/* Header */}
                    <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.bodyText, { fontWeight: typography.fontWeight.semibold }]} numberOfLines={2}>
                                {request.title}
                            </Text>
                            <Text style={[styles.captionText, { color: colors.textSecondary }]}> 
                                {request.requesterName}
                            </Text>
                        </View>

                        {/* Status Badge */}
                        <View
                            style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusColor(request.status) + "20" },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.captionText,
                                    {
                                        color: getStatusColor(request.status),
                                        fontWeight: typography.fontWeight.semibold,
                                    },
                                ]}
                            >
                                {request.status}
                            </Text>
                        </View>
                    </Row>

                    {/* Description */}
                    <Text style={[styles.captionText, { color: colors.textSecondary }]} numberOfLines={2}>
                        {request.description}
                    </Text>

                    {/* Details Row */}
                    <Row style={{ justifyContent: "space-between" }}>
                        <Text style={[styles.captionText, { color: colors.textSecondary, fontWeight: typography.fontWeight.semibold }]}>
                            ${request.budget || "N/A"}
                        </Text>
                        <Text style={[styles.captionText, { color: colors.textSecondary }]}> 
                            {request.bidCount} bids
                        </Text>
                        {request.city && request.country && (
                            <Text style={[styles.captionText, { color: colors.textSecondary }]}> 
                                {request.city}, {request.country}
                            </Text>
                        )}
                    </Row>

                    {/* Category Badge */}
                    <View style={styles.categoryBadge}>
                        <Text style={[styles.captionText, { color: colors.primary }]}> 
                            {request.category}
                        </Text>
                    </View>

                    {/* Actions */}
                    {isOwner && (
                        <Row gap="sm">
                            {onEdit && (
                                <AppButton
                                    title="Edit"
                                    onPress={onEdit}
                                    variant="primary"
                                    fullWidth={false}
                                />
                            )}
                            {onDelete && (
                                <AppButton
                                    title="Delete"
                                    onPress={onDelete}
                                    variant="danger"
                                    fullWidth={false}
                                />
                            )}
                        </Row>
                    )}
                </Stack>
            </Card>
        </TouchableOpacity>
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
    card: {
        marginBottom: spacing.md,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 4,
    },
    categoryBadge: {
        alignSelf: "flex-start",
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 4,
        backgroundColor: colors.primary + "10",
    },
});
