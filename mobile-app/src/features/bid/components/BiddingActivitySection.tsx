import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card, theme } from "@/design-system";
import { Bid } from "../types/bid.types";
import { BidList } from "./BidList";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

interface BiddingActivitySectionProps {
    incomingHelperBids: Bid[];
    myBiddingActivity: Bid[];
}

export const BiddingActivitySection: React.FC<BiddingActivitySectionProps> = ({
    incomingHelperBids,
    myBiddingActivity,
}) => {
    const { palette } = useThemeContext();

    return (
        <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Bidding Activity</Text>
                <Text
                    style={[
                        styles.sectionCount,
                        { color: palette.textSecondary, borderColor: palette.border },
                    ]}
                >
                    {incomingHelperBids.length + myBiddingActivity.length}
                </Text>
            </View>

            <Text style={[styles.sectionSubtitle, { color: palette.textSecondary }]}>
                Clear split between helper and requester bid flow
            </Text>

            <View style={styles.activityBlock}>
                <Text style={[styles.activityLabel, { color: palette.textSecondary }]}>
                    Helpers bidding on your requests
                </Text>
                <BidList
                    bids={incomingHelperBids}
                    listPadding="none"
                    showHeader={false}
                    emptyMessage="No helper bids on your requests yet"
                />
            </View>

            <View style={[styles.activityDivider, { borderBottomColor: palette.border }]} />

            <View style={styles.activityBlock}>
                <Text style={[styles.activityLabel, { color: palette.textSecondary }]}>
                    Your bids as helper
                </Text>
                <BidList
                    bids={myBiddingActivity}
                    listPadding="none"
                    showHeader={false}
                    emptyMessage="No helper bids available in this feed yet"
                />
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
    },
    sectionCount: {
        fontSize: theme.typography.fontSize.xs,
        borderWidth: 1,
        borderRadius: theme.radius.fill,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
    },
    sectionSubtitle: {
        marginBottom: theme.spacing.md,
        fontSize: theme.typography.fontSize.sm,
    },
    activityBlock: {
        marginBottom: theme.spacing.sm,
    },
    activityLabel: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        marginBottom: theme.spacing.xs,
    },
    activityDivider: {
        borderBottomWidth: 1,
        marginVertical: theme.spacing.sm,
    },
});