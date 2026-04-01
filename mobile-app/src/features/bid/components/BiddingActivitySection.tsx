import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card, theme } from "@/design-system";
import { Bid } from "../types/bid.types";
import { BidList } from "./BidList";

interface BiddingActivitySectionProps {
    incomingHelperBids: Bid[];
    myBiddingActivity: Bid[];
}

export const BiddingActivitySection: React.FC<BiddingActivitySectionProps> = ({
    incomingHelperBids,
    myBiddingActivity,
}) => {
    return (
        <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Bidding Activity</Text>
                <Text style={styles.sectionCount}>{incomingHelperBids.length + myBiddingActivity.length}</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Clear split between helper and requester bid flow</Text>

            <View style={styles.activityBlock}>
                <Text style={styles.activityLabel}>Helpers bidding on your requests</Text>
                <BidList bids={incomingHelperBids} emptyMessage="No helper bids on your requests yet" />
            </View>

            <View style={styles.activityDivider} />

            <View style={styles.activityBlock}>
                <Text style={styles.activityLabel}>Your bids as helper</Text>
                <BidList bids={myBiddingActivity} emptyMessage="No helper bids available in this feed yet" />
            </View>
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
    activityBlock: {
        marginBottom: theme.spacing.sm,
    },
    activityLabel: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        marginBottom: theme.spacing.xs,
    },
    activityDivider: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        marginVertical: theme.spacing.sm,
    },
});