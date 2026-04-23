import React, { useEffect, useMemo, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card, theme } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";
import { AppLocation } from "@/features/location/types/location.types";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";
import { getReadableLocationLabel } from "@/features/location/utils/distance";
import {
    formatCompactAddress,
    shortenPlainAddress,
} from "@/features/location/utils/address";

interface GreetingOverviewProps {
    name?: string;
    avatarUrl?: string | null;
    activeRequests: number;
    recentBids: number;
    location?: string;
    onUpdateLocation?: (location: AppLocation) => void;
    onOfferHelp?: () => void;
    onRequestHelp?: () => void;
    showActions?: boolean;
}

export const GreetingOverview: React.FC<GreetingOverviewProps> = ({
    name = "User",
    avatarUrl,
    activeRequests,
    recentBids,
    location = "N/A",
    onUpdateLocation,
    onOfferHelp,
    onRequestHelp,
    showActions = true,
}) => {
    const { palette } = useThemeContext();
    const [localLocation, setLocalLocation] = useState(location);

    const locationPicker = useLocationPicker({
        autoUseCurrentLocationOnMount: true,
    });

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    }, []);

    const weekdayLabel = useMemo(() => {
        return new Date().toLocaleDateString(undefined, { weekday: "long" });
    }, []);

    const currentLocationText = useMemo(() => {
        if (locationPicker.value) {
            return (
                formatCompactAddress(locationPicker.value, "") ||
                getReadableLocationLabel(locationPicker.value) ||
                "N/A"
            );
        }

        return shortenPlainAddress(localLocation || location || "N/A", "N/A");
    }, [locationPicker.value, localLocation, location]);

    const statusText = useMemo(() => {
        if (activeRequests <= 0) {
            return "No requests nearby right now";
        }

        if (activeRequests === 1) {
            return "1 request nearby";
        }

        return `${activeRequests} requests nearby`;
    }, [activeRequests]);

    useEffect(() => {
        setLocalLocation(location);
    }, [location]);

    useEffect(() => {
        if (!locationPicker.value) return;

        const nextLocation =
            formatCompactAddress(locationPicker.value, "") ||
            getReadableLocationLabel(locationPicker.value) ||
            "";
        setLocalLocation(nextLocation);
        onUpdateLocation?.(locationPicker.value);
    }, [locationPicker.value, onUpdateLocation]);

    return (
        <Card
            style={[
                styles.container,
                {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                    shadowColor: palette.textPrimary,
                },
            ]}
        >
            <View
                pointerEvents="none"
                style={[
                    styles.accentOrb,
                    { backgroundColor: `${palette.primary}14` },
                ]}
            />

            <View style={styles.headerRow}>
                <View style={styles.identityBlock}>
                    <Text style={[styles.eyebrow, { color: palette.textSecondary }]}>
                        {weekdayLabel}
                    </Text>
                    <Text style={[styles.title, { color: palette.textPrimary }]} numberOfLines={1}>
                        {greeting},{"\n"}{name}
                    </Text>
                </View>

                <ProfileAvatar
                    uri={avatarUrl}
                    fullName={name} size={42} />
            </View>

            <View style={styles.metaRow}>
                <Pressable
                    onPress={locationPicker.useCurrentLocation}
                    disabled={locationPicker.loading}
                    style={({ pressed }) => [
                        styles.locationChip,
                        {
                            backgroundColor: palette.surfaceMuted,
                            borderColor: palette.border,
                            opacity: pressed ? 0.78 : 1,
                        },
                    ]}
                >
                    <Ionicons
                        name={locationPicker.loading ? "sync-outline" : "location-outline"}
                        size={16}
                        color={palette.textSecondary}
                    />
                    <Text
                        style={[styles.locationText, { color: palette.textSecondary }]}
                        numberOfLines={1}
                    >
                        {locationPicker.loading ? "Updating location..." : currentLocationText}
                    </Text>
                </Pressable>

                <View
                    style={[
                        styles.statPill,
                        {
                            backgroundColor: palette.surfaceMuted,
                            borderColor: palette.border,
                        },
                    ]}
                >
                    <Text style={[styles.statValue, { color: palette.textPrimary }]}>
                        {recentBids}
                    </Text>
                    <Text style={[styles.statLabel, { color: palette.textSecondary }]}>
                        bids
                    </Text>
                </View>
            </View>

            <Text style={[styles.statusText, { color: palette.textSecondary }]}>
                {statusText}
            </Text>

            {locationPicker.error ? (
                <Text style={[styles.errorText, { color: palette.danger }]}>
                    {locationPicker.error}
                </Text>
            ) : null}

            {showActions ? (
                <View style={styles.actionsRow}>
                    <View style={styles.primaryAction}>
                        <AppButton
                            title="Offer Help"
                            onPress={onOfferHelp ?? (() => { })}
                        />
                    </View>

                    <View style={styles.secondaryAction}>
                        <AppButton
                            title="Request Help"
                            onPress={onRequestHelp ?? (() => { })}
                            variant="secondary"
                        />
                    </View>
                </View>
            ) : null}
        </Card>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: theme.spacing.xs,
        borderRadius: 24,
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
        overflow: "hidden",
        borderWidth: 1,
        shadowOpacity: 0.06,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
    },
    accentOrb: {
        position: "absolute",
        width: 180,
        height: 180,
        borderRadius: 999,
        top: -56,
        right: -48,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: theme.spacing.sm,
    },
    identityBlock: {
        flex: 1,
        gap: 2,
        paddingTop: 0,
    },
    eyebrow: {
        fontSize: theme.typography.fontSize.xs,
        lineHeight: theme.typography.lineHeight.xs,
        textTransform: "uppercase",
        letterSpacing: 0.7,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    title: {
        fontSize: theme.typography.fontSize.lg,
        lineHeight: theme.typography.lineHeight.lg,
        fontWeight: theme.typography.fontWeight.bold,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    locationChip: {
        flex: 1,
        minHeight: 44,
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: theme.spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    locationText: {
        flex: 1,
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
        fontWeight: theme.typography.fontWeight.medium,
    },
    statPill: {
        minHeight: 44,
        minWidth: 74,
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: theme.spacing.md,
        alignItems: "center",
        justifyContent: "center",
    },
    statValue: {
        fontSize: theme.typography.fontSize.md,
        lineHeight: theme.typography.lineHeight.md,
        fontWeight: theme.typography.fontWeight.bold,
    },
    statLabel: {
        fontSize: theme.typography.fontSize.xs,
        lineHeight: theme.typography.lineHeight.xs,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    statusText: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
    },
    errorText: {
        fontSize: theme.typography.fontSize.xs,
        lineHeight: theme.typography.lineHeight.xs,
    },
    actionsRow: {
        flexDirection: "row",
        gap: theme.spacing.sm,
        paddingTop: theme.spacing.xxs,
    },
    primaryAction: {
        flex: 1.1,
    },
    secondaryAction: {
        flex: 1,
    },
});