import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card, theme } from "@/design-system";
import { HelpRequest } from "../types/helpRequest.types";
import { RequestCard } from "./RequestCard";

interface HelpingOpportunitiesSectionProps {
    requests: HelpRequest[];
    onPressBid: (request: HelpRequest) => void;
}

export const HelpingOpportunitiesSection: React.FC<HelpingOpportunitiesSectionProps> = ({
    requests,
    onPressBid,
}) => {
    return (
        <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Helping Opportunities</Text>
                <Text style={styles.sectionCount}>{requests.length}</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Requests posted by others that you can bid on</Text>
            {requests.length === 0 ? (
                <Text style={styles.emptyText}>No requests from other users found</Text>
            ) : (
                requests.map((request) => (
                    <RequestCard
                        key={request.id}
                        request={request}
                        primaryActionLabel={request.status === "OPEN" ? "Place Bid" : "Unavailable"}
                        primaryActionDisabled={request.status !== "OPEN"}
                        onPrimaryAction={() => onPressBid(request)}
                    />
                ))
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    sectionCard: {
        marginTop: theme.spacing.xs,
        paddingVertical: theme.spacing.sm,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing.xs,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.textPrimary,
    },
    sectionCount: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.textSecondary,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.fill,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
    },
    sectionSubtitle: {
        marginBottom: theme.spacing.md,
        color: theme.colors.textSecondary,
        fontSize: theme.typography.fontSize.sm,
    },
    emptyText: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.fontSize.sm,
        paddingVertical: theme.spacing.sm,
    },
});