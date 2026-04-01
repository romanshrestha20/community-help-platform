import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Card } from "@/design-system/layout/Card";
import { Stack } from "@/design-system/layout/Stack";
import { Row } from "@/design-system/layout/Row";
import { AppButton } from "@/components/ui/AppButton";
import { spacing, colors, typography } from "@/design-system";
import { Bid, BidStatus } from "../types/bid.types";

interface BidCardProps {
    bid: Bid;
    onPress?: () => void;
    onViewProfile?: () => void;
    onAccept?: () => void;
    onReject?: () => void;
    onUpdate?: () => void;
    onDelete?: () => void;
    canRespond?: boolean;
    canModify?: boolean;
    loading?: boolean;
    disableRespondActions?: boolean;
}

const getStatusColor = (status: BidStatus): string => {
    switch (status) {
        case "ACCEPTED":
            return colors.success;
        case "REJECTED":
            return colors.danger;
        default:
            return colors.warning;
    }
};

export const BidCard: React.FC<BidCardProps> = ({
    bid,
    onPress,
    onViewProfile,
    onAccept,
    onReject,
    onUpdate,
    onDelete,
    canRespond = false,
    canModify = false,
    loading = false,
    disableRespondActions = false,
}) => {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card style={styles.card}>
                <Stack gap="md">
                    {/* Header */}
                    <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Stack gap="xs" style={{ flex: 1 }}>
                            <Text style={[styles.bodyText, { fontWeight: typography.fontWeight.semibold }]}>
                                {bid.helperName}
                            </Text>
                        </Stack>

                        {/* Bid Amount */}
                        <Text
                            style={[
                                styles.bodyText,
                                { fontWeight: typography.fontWeight.semibold, color: colors.primary },
                            ]}
                        >
                            ${bid.amount.toFixed(2)}
                        </Text>
                    </Row>

                    {/* Message */}
                    <Text
                        style={[styles.captionText, { color: colors.textSecondary }]}
                        numberOfLines={3}
                    >
                        {bid.message}
                    </Text>

                    {/* Status and Date */}
                    <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
                        <View
                            style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusColor(bid.status) + "20" },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.captionText,
                                    {
                                        color: getStatusColor(bid.status),
                                        fontWeight: typography.fontWeight.semibold,
                                    },
                                ]}
                            >
                                {bid.status}
                            </Text>
                        </View>

                        <Text style={[styles.captionText, { color: colors.textSecondary }]}> 
                            {new Date(bid.createdAt).toLocaleDateString()}
                        </Text>
                    </Row>

                    {onViewProfile && (
                        <AppButton
                            title="View Profile"
                            onPress={onViewProfile}
                            variant="ghost"
                            disabled={loading}
                            fullWidth={false}
                        />
                    )}

                    {/* Actions - Respond to Bid (Requester) */}
                    {canRespond && bid.status === "PENDING" && (
                        <Row gap="sm">
                            <AppButton
                                title="Accept"
                                onPress={onAccept ?? (() => {})}
                                loading={loading}
                                disabled={loading || disableRespondActions}
                                fullWidth={false}
                            />
                            <AppButton
                                title="Reject"
                                onPress={onReject ?? (() => {})}
                                variant="danger"
                                loading={loading}
                                disabled={loading || disableRespondActions}
                                fullWidth={false}
                            />
                        </Row>
                    )}

                    {/* Actions - Modify Bid (Bidder) */}
                    {canModify && bid.status === "PENDING" && (
                        <Row gap="sm">
                            {onUpdate && (
                                <AppButton
                                    title="Update"
                                    onPress={onUpdate}
                                    disabled={loading}
                                    fullWidth={false}
                                />
                            )}
                            {onDelete && (
                                <AppButton
                                    title="Withdraw"
                                    onPress={onDelete}
                                    variant="danger"
                                    disabled={loading}
                                    fullWidth={false}
                                />
                            )}
                        </Row>
                    )}

                    {/* Delete Action for Rejected */}
                    {canModify && bid.status === "REJECTED" && onDelete && (
                        <AppButton
                            title="Delete"
                            onPress={onDelete}
                            variant="danger"
                            disabled={loading}
                        />
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
});
