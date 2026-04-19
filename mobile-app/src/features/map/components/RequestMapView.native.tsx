import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import MapView, { type Region } from "react-native-maps";

import { Card, Stack, theme } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { MapFloatingActions } from "@/features/map/components/MapFloatingActions";
import { RequestMap } from "@/features/map/components/RequestMap.native";
import { SelectedRequestSheet } from "@/features/map/components/SelectedRequestSheet";
import { useCurrentLocation } from "@/features/map/hooks/useCurrentLocation";
import { useRequestMap } from "@/features/map/hooks/useRequestMap";
import {
    MapRequestFilters,
    MapRequestItem,
    type MapBounds,
} from "@/features/map/types/map.types";
import { getBoundsFromRegion } from "@/features/map/utils/mapRegion";

type Props = {
    filters: MapRequestFilters;
    onOpenRequest: (requestId: string) => void;
};

const regionChangedEnough = (a: Region | null, b: Region | null) => {
    if (!a || !b) return false;

    const latDiff = Math.abs(a.latitude - b.latitude);
    const lngDiff = Math.abs(a.longitude - b.longitude);
    const latDeltaDiff = Math.abs(a.latitudeDelta - b.latitudeDelta);
    const lngDeltaDiff = Math.abs(a.longitudeDelta - b.longitudeDelta);

    return (
        latDiff > 0.002 ||
        lngDiff > 0.002 ||
        latDeltaDiff > 0.002 ||
        lngDeltaDiff > 0.002
    );
};

export const RequestMapView: React.FC<Props> = ({
    filters,
    onOpenRequest,
}) => {
    const { palette } = useThemeContext();
    const mapRef = useRef<MapView | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<MapRequestItem | null>(null);
    const [activeRegion, setActiveRegion] = useState<Region | null>(null);
    const [pendingRegion, setPendingRegion] = useState<Region | null>(null);
    const [appliedBounds, setAppliedBounds] = useState<MapBounds | null>(null);

    const {
        location,
        loading: locationLoading,
        permissionDenied,
        error: locationError,
        reload: reloadLocation,
    } = useCurrentLocation();

    const mergedFilters = useMemo<MapRequestFilters>(() => {
        return {
            ...filters,
            latitude: appliedBounds ? undefined : filters.latitude ?? location?.latitude,
            longitude: appliedBounds ? undefined : filters.longitude ?? location?.longitude,
            bounds: appliedBounds,
        };
    }, [appliedBounds, filters, location?.latitude, location?.longitude]);

    const {
        requests,
        loading: requestsLoading,
        error: requestsError,
        reload: reloadRequests,
    } = useRequestMap(mergedFilters, {
        autoFetch: Boolean(
            mergedFilters.bounds ||
            (mergedFilters.latitude != null && mergedFilters.longitude != null)
        ),
    });

    useEffect(() => {
        setSelectedRequest((current) => {
            if (!current) return null;
            return requests.find((request) => request.id === current.id) ?? null;
        });
    }, [requests]);

    useEffect(() => {
        setAppliedBounds(filters.bounds ?? null);
    }, [filters.bounds]);

    const handleRecenter = async () => {
        if (!mapRef.current || !location) return;

        const nextRegion = {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
        };

        mapRef.current.animateToRegion(nextRegion, 450);
        setPendingRegion(null);
        setActiveRegion(nextRegion);
        setAppliedBounds(null);

        await reloadRequests();
    };

    const handleReload = async () => {
        await reloadLocation();
        await reloadRequests();
    };

    const handleSearchArea = async () => {
        if (!pendingRegion) return;

        setActiveRegion(pendingRegion);
        setAppliedBounds(getBoundsFromRegion(pendingRegion));
        setPendingRegion(null);
    };

    const screenError = locationError ?? requestsError ?? null;
    const shouldShowSearchAreaButton = regionChangedEnough(
        activeRegion,
        pendingRegion
    );

    if (locationLoading) {
        return (
            <View style={styles.centerState}>
                <ActivityIndicator color={palette.primary} />
                <Text style={[styles.centerStateText, { color: palette.textSecondary }]}>
                    Locating nearby requests...
                </Text>
            </View>
        );
    }

    if (permissionDenied) {
        return (
            <Card
                style={[
                    styles.stateCard,
                    {
                        backgroundColor: palette.surface,
                        borderColor: palette.border,
                    },
                ]}
            >
                <Stack gap="sm">
                    <Text style={[styles.stateTitle, { color: palette.textPrimary }]}>
                        Location permission is required
                    </Text>
                    <Text style={[styles.stateBody, { color: palette.textSecondary }]}>
                        Allow location access to show nearby requests on the map.
                    </Text>
                    <AppButton title="Try again" variant="primary" onPress={handleReload} />
                </Stack>
            </Card>
        );
    }

    return (
        <View style={styles.container}>
            <RequestMap
                mapRef={mapRef}
                userLocation={location}
                requests={requests}
                onSelectRequest={setSelectedRequest}
                onPressMap={() => setSelectedRequest(null)}
                onRegionChangeComplete={(region, isGesture) => {
                    if (isGesture === false) return;

                    setPendingRegion(region);

                    if (!activeRegion) {
                        setActiveRegion(region);
                    }
                }}
            />

            <MapFloatingActions
                mappedCount={requests.length}
                onPressRecenter={handleRecenter}
            />

            {shouldShowSearchAreaButton ? (
                <Pressable
                    onPress={handleSearchArea}
                    style={[
                        styles.searchAreaButton,
                        {
                            backgroundColor: palette.surface,
                            borderColor: palette.border,
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.searchAreaButtonText,
                            { color: palette.textPrimary },
                        ]}
                    >
                        Search this area
                    </Text>
                </Pressable>
            ) : null}

            {requestsLoading ? (
                <View
                    style={[
                        styles.loadingBadge,
                        { backgroundColor: "rgba(255,255,255,0.94)" },
                    ]}
                >
                    <ActivityIndicator size="small" color={palette.primary} />
                    <Text style={[styles.loadingBadgeText, { color: palette.textPrimary }]}>
                        Updating map
                    </Text>
                </View>
            ) : null}

            {selectedRequest ? (
                <SelectedRequestSheet
                    request={selectedRequest}
                    onPress={() => onOpenRequest(selectedRequest.id)}
                />
            ) : null}

            {!requestsLoading && !screenError && requests.length === 0 ? (
                <Text style={[styles.emptyText, { color: palette.textSecondary }]}>
                    No nearby requests match the current map filters.
                </Text>
            ) : null}

            {screenError ? (
                <Text style={[styles.errorText, { color: palette.danger }]}>
                    {screenError}
                </Text>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: "hidden",
        borderRadius: 24,
    },
    stateCard: {
        flex: 1,
        justifyContent: "center",
    },
    stateTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
    },
    stateBody: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: 22,
    },
    centerState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.sm,
    },
    centerStateText: {
        fontSize: theme.typography.fontSize.sm,
    },
    loadingBadge: {
        position: "absolute",
        top: theme.spacing.md,
        left: theme.spacing.md,
        flexDirection: "row",
        alignItems: "center",
        columnGap: 8,
        borderRadius: theme.radius.fill,
        paddingHorizontal: 14,
        paddingVertical: 10,
        elevation: 3,
    },
    searchAreaButton: {
        position: "absolute",
        top: theme.spacing.md,
        alignSelf: "center",
        borderWidth: 1,
        borderRadius: theme.radius.fill,
        paddingHorizontal: 16,
        paddingVertical: 10,
        elevation: 3,
    },
    searchAreaButtonText: {
        fontSize: 13,
        fontWeight: "700",
    },
    loadingBadgeText: {
        fontSize: 13,
        fontWeight: "700",
    },
    emptyText: {
        position: "absolute",
        bottom: theme.spacing.md,
        alignSelf: "center",
        textAlign: "center",
        fontSize: theme.typography.fontSize.sm,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.92)",
    },
    errorText: {
        position: "absolute",
        bottom: theme.spacing.md,
        alignSelf: "center",
        textAlign: "center",
        fontSize: theme.typography.fontSize.xs,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.92)",
    },
});
