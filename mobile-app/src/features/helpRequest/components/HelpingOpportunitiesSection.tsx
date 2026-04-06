import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/design-system";
import { HelpRequest } from "../types/helpRequest.types";
import { RequestCard } from "./RequestCard";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

interface HelpingOpportunitiesSectionProps {
    requests: HelpRequest[];
    onPressBid: (request: HelpRequest) => void;
}

export const HelpingOpportunitiesSection: React.FC<HelpingOpportunitiesSectionProps> = ({
    requests,
    onPressBid,
}) => {
    const { palette } = useThemeContext();

    return (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Opportunities</Text>
                <Text style={[styles.sectionCount, { color: palette.textSecondary, borderColor: palette.border }]}>{requests.length}</Text>
            </View>
            {requests.length === 0 ? (
                <Text style={[styles.emptyText, { color: palette.textSecondary }]}>No requests from other users found</Text>
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
        </View>
    );
};

const styles = StyleSheet.create({
    sectionContainer: {
        marginTop: 2,
        paddingVertical: theme.spacing.xxs,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing.sm,
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
    emptyText: {
        fontSize: theme.typography.fontSize.sm,
        paddingVertical: theme.spacing.sm,
    },
});