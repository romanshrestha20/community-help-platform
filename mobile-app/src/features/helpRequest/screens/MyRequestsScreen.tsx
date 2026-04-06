import React from "react";
import { FlatList, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { ScreenView, theme } from "@/design-system";
import { RequestCard } from "@/features/helpRequest/components/RequestCard";
import { RequestEmptyState } from "@/features/helpRequest/components/RequestEmptyState";
import { useRequestList } from "@/features/helpRequest/hooks/useRequestList";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

export const MyRequestsScreen = () => {
    const router = useRouter();
    const { palette } = useThemeContext();
    const { requests, loading, error, refreshing, refreshRequests } = useRequestList({
        scope: "mine",
    });

    return (
        <ScreenView>
            <AppHeader
                title="My Requests"
                subtitle="Track requests you posted and manage incoming bids."
            />

            <AppButton
                title="Create Request"
                onPress={() => router.push("/home/requests/new")}
                fullWidth={false}
            />

            <FlatList
                data={requests}
                keyExtractor={(item) => item.id}
                refreshing={refreshing}
                onRefresh={refreshRequests}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <RequestEmptyState
                        title={loading ? "Loading your requests" : "No requests yet"}
                        description={
                            error ||
                            "Requests you create will appear here so you can manage status and bids."
                        }
                    />
                }
                renderItem={({ item }) => (
                    <RequestCard
                        request={item}
                        onPress={() => router.push(`/home/requests/${item.id}`)}
                        primaryActionLabel="Manage"
                        onPrimaryAction={() => router.push(`/home/requests/${item.id}`)}
                    />
                )}
            />

            <Text style={[styles.caption, { color: palette.textSecondary }]}>Pull down to refresh your latest request activity.</Text>
        </ScreenView>
    );
};

const styles = StyleSheet.create({
    contentContainer: {
        gap: theme.spacing.sm,
        paddingBottom: theme.spacing.md,
    },
    caption: {
        marginTop: theme.spacing.sm,
        fontSize: theme.typography.fontSize.xs,
    },
});

export default MyRequestsScreen;
