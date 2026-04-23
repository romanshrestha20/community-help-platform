import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
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
    type Coordinates,
} from "@/features/map/types/map.types";
import { getBoundsFromRegion } from "@/features/map/utils/mapRegion";

type Props = {
    filters: MapRequestFilters;
    onOpenRequest: (requestId: string) => void;
    onBidRequest?: (request: MapRequestItem) => void;
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
    onBidRequest,
}) => {
    const { palette } = useThemeContext();
    const mapRef = useRef<MapView | null>(null);
    const boundsUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<MapRequestItem | null>(null);
    const [appliedBounds, setAppliedBounds] = useState<MapBounds | null>(null);
    const [appliedCenter, setAppliedCenter] = useState<Coordinates | null>(null);
    const [pendingBounds, setPendingBounds] = useState<MapBounds | null>(null);
    const [pendingCenter, setPendingCenter] = useState<Coordinates | null>(null);

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
            latitude: appliedCenter?.latitude ?? filters.latitude ?? location?.latitude,
            longitude: appliedCenter?.longitude ?? filters.longitude ?? location?.longitude,
            bounds: appliedBounds,
        };
    }, [appliedBounds, appliedCenter, filters, location?.latitude, location?.longitude]);

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

    useEffect(() => {
        if (filters.latitude != null && filters.longitude != null) {
            const nextCenter = {
                latitude: filters.latitude,
                longitude: filters.longitude,
            };
            setAppliedCenter(nextCenter);
            setPendingCenter(null);
        } else if (location?.latitude != null && location?.longitude != null) {
            const nextCenter = {
                latitude: location.latitude,
                longitude: location.longitude,
            };
            setAppliedCenter(nextCenter);
            setPendingCenter(null);
        }
    }, [filters.latitude, filters.longitude, location?.latitude, location?.longitude]);

    useEffect(() => {
        return () => {
            if (boundsUpdateTimeoutRef.current) {
                clearTimeout(boundsUpdateTimeoutRef.current);
            }
        };
    }, []);

    const handleRecenter = async () => {
        const fallbackCenter =
            (location?.latitude != null && location?.longitude != null)
                ? { latitude: location.latitude, longitude: location.longitude }
                : (filters.latitude != null && filters.longitude != null)
                    ? { latitude: filters.latitude, longitude: filters.longitude }
                    : null;

        if (!mapRef.current || !fallbackCenter) return;

        const nextRegion = {
            latitude: fallbackCenter.latitude,
            longitude: fallbackCenter.longitude,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
        };

        mapRef.current.animateToRegion(nextRegion, 450);
        setSelectedRequest(null);
        setAppliedCenter(fallbackCenter);
        setAppliedBounds(null);
        setPendingBounds(null);
        setPendingCenter(null);

        await reloadLocation();
    };

    const handleReload = async () => {
        await reloadLocation();
        await reloadRequests();
    };

    const handleSearchThisArea = async () => {
        if (!pendingBounds || !pendingCenter) return;

        setAppliedBounds(pendingBounds);
        setAppliedCenter(pendingCenter);
        setPendingBounds(null);
        await reloadRequests();
    };

    const resolvedUserLocation =
        location ??
        (filters.latitude != null && filters.longitude != null
            ? { latitude: filters.latitude, longitude: filters.longitude }
            : null);
    const hasFallbackCenter =
        filters.latitude != null &&
        filters.longitude != null &&
        Number.isFinite(filters.latitude) &&
        Number.isFinite(filters.longitude);
    const showPermissionDeniedState = permissionDenied && !hasFallbackCenter && !location;
    const screenError = requestsError ?? (showPermissionDeniedState ? locationError : null) ?? null;
    const showSearchThisArea = Boolean(
        pendingBounds &&
            pendingCenter &&
            (!appliedBounds || pendingBounds !== appliedBounds)
    );

    if (locationLoading && !resolvedUserLocation) {
        return (
            <View style={styles.centerState}>
                <ActivityIndicator color={palette.primary} />
                <Text style={[styles.centerStateText, { color: palette.textSecondary }]}>
                    Locating nearby requests...
                </Text>
            </View>
        );
    }

    if (showPermissionDeniedState) {
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
                        Allow location access to center the map on you, or save a location in your profile to use as a fallback.
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
                userLocation={resolvedUserLocation}
                requests={requests}
                onSelectRequest={setSelectedRequest}
                onPressMap={() => setSelectedRequest(null)}
                onRegionChangeComplete={(region, isGesture) => {
                    if (isGesture === false) return;
                    const currentRegion = pendingBounds ?? appliedBounds
                        ? {
                              latitude:
                                  ((pendingBounds ?? appliedBounds)!.minLatitude +
                                      (pendingBounds ?? appliedBounds)!.maxLatitude) / 2,
                              longitude:
                                  ((pendingBounds ?? appliedBounds)!.minLongitude +
                                      (pendingBounds ?? appliedBounds)!.maxLongitude) / 2,
                              latitudeDelta:
                                  (pendingBounds ?? appliedBounds)!.maxLatitude -
                                  (pendingBounds ?? appliedBounds)!.minLatitude,
                              longitudeDelta:
                                  (pendingBounds ?? appliedBounds)!.maxLongitude -
                                  (pendingBounds ?? appliedBounds)!.minLongitude,
                          }
                        : appliedCenter
                        ? {
                              latitude: appliedCenter.latitude,
                              longitude: appliedCenter.longitude,
                              latitudeDelta: 0.08,
                              longitudeDelta: 0.08,
                          }
                        : null;

                    if (!currentRegion || regionChangedEnough(currentRegion, region)) {
                        if (boundsUpdateTimeoutRef.current) {
                            clearTimeout(boundsUpdateTimeoutRef.current);
                        }

                        boundsUpdateTimeoutRef.current = setTimeout(() => {
                            const nextCenter = {
                                latitude: region.latitude,
                                longitude: region.longitude,
                            };
                            setPendingCenter(nextCenter);
                            setPendingBounds(getBoundsFromRegion(region));
                        }, 280);
                    }
                }}
            />

            <MapFloatingActions
                mappedCount={requests.length}
                onPressRecenter={handleRecenter}
            />

            {showSearchThisArea ? (
                <View style={styles.searchAreaButtonWrap}>
                    <AppButton title="Search this area" variant="primary" onPress={handleSearchThisArea} />
                </View>
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
                    onViewDetails={() => onOpenRequest(selectedRequest.id)}
                    onBidRequest={
                        onBidRequest ? () => onBidRequest(selectedRequest) : undefined
                    }
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
    searchAreaButtonWrap: {
        position: "absolute",
        top: theme.spacing.md,
        alignSelf: "center",
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
