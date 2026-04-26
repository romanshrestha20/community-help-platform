import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, MapPressEvent } from "react-native-maps";

import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card, ScreenView, theme } from "@/design-system";
import { APP_ROUTES } from "@/config/routes";
import { goBackOrFallback } from "@/utils/navigation";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useCurrentLocation } from "@/features/map/hooks/useCurrentLocation";
import { getRegionForCoordinates } from "@/features/map/utils/getRegionForCoordinates";
import { reverseGeocodeToLocation } from "@/features/location/services/location.service";
import { useLocationPickerScreenStore } from "@/features/location/store/locationPickerScreen.store";
import { AppLocation } from "@/features/location/types/location.types";

const formatLocationLabel = (location: AppLocation | null) => {
  if (!location) {
    return "Tap the map or drag the pin to choose the request location.";
  }

  return (
    location.formattedAddress ||
    [
      location.addressLine1,
      [location.postalCode, location.city].filter(Boolean).join(" "),
      location.country,
    ]
      .filter(Boolean)
      .join(", ") ||
    "Selected location"
  );
};

export default function LocationPickerScreen() {
  const { palette } = useThemeContext();
  const mapRef = useRef<MapView | null>(null);
  const draftLocation = useLocationPickerScreenStore((state) => state.draftLocation);
  const confirmLocation = useLocationPickerScreenStore((state) => state.confirmLocation);
  const draftReturnRoute = useLocationPickerScreenStore((state) => state.draftReturnRoute);
  const { location: currentLocation, loading: currentLocationLoading } = useCurrentLocation();
  const [selectedLocation, setSelectedLocation] = useState<AppLocation | null>(
    draftLocation
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedLocation && currentLocation) {
      setSelectedLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        postalCode: null,
        country: null,
        formattedAddress: null,
      });
    }
  }, [currentLocation, selectedLocation]);

  const region = useMemo(
    () =>
      getRegionForCoordinates(
        selectedLocation
          ? {
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
            }
          : currentLocation,
        []
      ),
    [currentLocation, selectedLocation]
  );

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.animateToRegion(region, 350);
  }, [region]);

  const updateLocation = async (latitude: number, longitude: number) => {
    try {
      setSaving(true);
      setError(null);
      const nextLocation = await reverseGeocodeToLocation(latitude, longitude);
      setSelectedLocation(nextLocation);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update the selected location."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleMapPress = async (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    await updateLocation(latitude, longitude);
  };

  const handleConfirm = () => {
    if (!selectedLocation) return;
    confirmLocation(selectedLocation);
    goBackOrFallback({
      fallback: (draftReturnRoute as any) ?? APP_ROUTES.HOME_REQUESTS,
      replace: true,
    });
  };

  return (
    <ScreenView style={styles.screen}>
      <AppHeader
        title="Choose on map"
        subtitle="Pick the exact spot where help is needed."
        showBackButton
        backButtonProps={{
          fallback: (draftReturnRoute as any) ?? APP_ROUTES.HOME_REQUESTS,
          variant: "secondary",
        }}
      />

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton
          onPress={handleMapPress}
        >
          {selectedLocation ? (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              draggable
              onDragEnd={(event) => {
                const { latitude, longitude } = event.nativeEvent.coordinate;
                void updateLocation(latitude, longitude);
              }}
            />
          ) : null}
        </MapView>

        <View style={styles.footer}>
          <Card
            style={[
              styles.selectionCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={[styles.selectionLabel, { color: palette.textSecondary }]}>
              Selected location
            </Text>
            <Text style={[styles.selectionValue, { color: palette.textPrimary }]}>
              {currentLocationLoading && !selectedLocation
                ? "Finding your current position..."
                : formatLocationLabel(selectedLocation)}
            </Text>

            {error ? (
              <Text style={[styles.errorText, { color: palette.danger }]}>
                {error}
              </Text>
            ) : null}

            <View style={styles.actions}>
              <View style={styles.actionButton}>
                <AppButton
                  title="Use current location"
                  variant="secondary"
                  onPress={() => {
                    if (!currentLocation) return;
                    void updateLocation(
                      currentLocation.latitude,
                      currentLocation.longitude
                    );
                  }}
                  disabled={!currentLocation || saving}
                  fullWidth
                />
              </View>
              <View style={styles.actionButton}>
                <AppButton
                  title={saving ? "Updating..." : "Confirm location"}
                  onPress={handleConfirm}
                  disabled={!selectedLocation || saving}
                  loading={saving}
                  fullWidth
                />
              </View>
            </View>
          </Card>
        </View>
      </View>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  mapWrap: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 24,
    marginTop: theme.spacing.sm,
  },
  footer: {
    position: "absolute",
    left: theme.spacing.md,
    right: theme.spacing.md,
    bottom: theme.spacing.md,
  },
  selectionCard: {
    padding: theme.spacing.md,
    shadowColor: "#122013",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  selectionLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  selectionValue: {
    marginTop: 6,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 22,
    fontWeight: theme.typography.fontWeight.medium,
  },
  actions: {
    flexDirection: "row",
    columnGap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  errorText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
