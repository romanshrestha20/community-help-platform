import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card, ScreenView, theme } from "@/design-system";
import { APP_ROUTES } from "@/config/routes";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useCurrentLocation } from "@/features/map/hooks/useCurrentLocation";
import { getRegionForCoordinates } from "@/features/map/utils/getRegionForCoordinates";
import { reverseGeocodeToLocation } from "@/features/location/services/location.service";
import { useLocationPickerScreenStore } from "@/features/location/store/locationPickerScreen.store";
import { AppLocation } from "@/features/location/types/location.types";

type LeafletWindow = Window & {
  L?: any;
  __communitySupportLeafletPromise?: Promise<void>;
};

const LEAFLET_SCRIPT_ID = "community-support-leaflet-script";
const LEAFLET_STYLE_ID = "community-support-leaflet-style";

const formatLocationLabel = (location: AppLocation | null) => {
  if (!location) {
    return "Click the map or drag the pin to choose the request location.";
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

const ensureLeafletAssets = async (): Promise<void> => {
  const browserWindow = window as LeafletWindow;
  if (browserWindow.L) {
    return;
  }

  if (!document.getElementById(LEAFLET_STYLE_ID)) {
    const link = document.createElement("link");
    link.id = LEAFLET_STYLE_ID;
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }

  if (!browserWindow.__communitySupportLeafletPromise) {
    browserWindow.__communitySupportLeafletPromise = new Promise<void>(
      (resolve, reject) => {
        const existingScript = document.getElementById(LEAFLET_SCRIPT_ID);
        if (existingScript) {
          existingScript.addEventListener("load", () => resolve(), { once: true });
          existingScript.addEventListener(
            "error",
            () => reject(new Error("Failed to load Leaflet.")),
            { once: true }
          );
          return;
        }

        const script = document.createElement("script");
        script.id = LEAFLET_SCRIPT_ID;
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Leaflet."));
        document.head.appendChild(script);
      }
    );
  }

  await browserWindow.__communitySupportLeafletPromise;
};

const getInitialZoom = (longitudeDelta: number) => {
  const safeDelta = Math.max(longitudeDelta, 0.0005);
  const zoom = Math.round(Math.log2(360 / safeDelta));
  return Math.min(18, Math.max(3, zoom));
};

export default function LocationPickerScreen() {
  const router = useRouter();
  const { palette } = useThemeContext();
  const draftLocation = useLocationPickerScreenStore((state) => state.draftLocation);
  const confirmLocation = useLocationPickerScreenStore((state) => state.confirmLocation);
  const draftReturnRoute = useLocationPickerScreenStore((state) => state.draftReturnRoute);
  const { location: currentLocation, loading: currentLocationLoading } = useCurrentLocation();

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainerRef = useRef<any>(null);

  const [selectedLocation, setSelectedLocation] = useState<AppLocation | null>(
    draftLocation
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

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
    let isMounted = true;

    const setupMap = async () => {
      if (!mapContainerRef.current || mapRef.current) {
        return;
      }

      try {
        await ensureLeafletAssets();
        if (!isMounted || !mapContainerRef.current) {
          return;
        }

        const leaflet = (window as LeafletWindow).L;
        if (!leaflet) {
          throw new Error("Leaflet did not initialize correctly.");
        }

        const map = leaflet.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: true,
        });

        leaflet
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors",
          })
          .addTo(map);

        map.setView(
          [region.latitude, region.longitude],
          getInitialZoom(region.longitudeDelta)
        );

        map.on("click", (event: any) => {
          const { lat, lng } = event.latlng;
          void updateLocation(lat, lng);
        });

        mapRef.current = map;
        setMapReady(true);
      } catch (caughtError) {
        if (!isMounted) return;
        setMapError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not initialize the map."
        );
      }
    };

    void setupMap();

    return () => {
      isMounted = false;
      markerRef.current?.remove?.();
      mapRef.current?.remove?.();
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [region.latitude, region.longitude, region.longitudeDelta]);

  useEffect(() => {
    const map = mapRef.current;
    const leaflet = (window as LeafletWindow).L;

    if (!map || !leaflet || !selectedLocation) {
      return;
    }

    map.setView(
      [selectedLocation.latitude, selectedLocation.longitude],
      getInitialZoom(region.longitudeDelta),
      { animate: true }
    );

    markerRef.current?.remove?.();

    const marker = leaflet.marker(
      [selectedLocation.latitude, selectedLocation.longitude],
      {
        draggable: true,
      }
    );

    marker.on("dragend", (event: any) => {
      const nextLatLng = event.target.getLatLng();
      void updateLocation(nextLatLng.lat, nextLatLng.lng);
    });

    marker.addTo(map);
    markerRef.current = marker;
  }, [region.longitudeDelta, selectedLocation]);

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

  const handleConfirm = () => {
    if (!selectedLocation) return;
    confirmLocation(selectedLocation);
    if (draftReturnRoute) {
      router.replace(draftReturnRoute as any);
      return;
    }

    router.replace(APP_ROUTES.HOME_REQUESTS);
  };

  return (
    <ScreenView style={styles.screen}>
      <AppHeader
        title="Choose on map"
        subtitle="Pick the exact spot where help is needed."
        showBackButton
        backButtonProps={{
          fallback: APP_ROUTES.HOME_REQUESTS,
          variant: "secondary",
        }}
      />

      <View style={styles.mapWrap}>
        <View ref={mapContainerRef} style={styles.mapCanvas} />

        {!mapReady && !mapError ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={palette.primary} />
            <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
              Loading map…
            </Text>
          </View>
        ) : null}

        {mapError ? (
          <Card
            style={[
              styles.errorCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={[styles.errorTitle, { color: palette.textPrimary }]}>
              Map unavailable
            </Text>
            <Text style={[styles.errorBody, { color: palette.textSecondary }]}>
              {mapError}
            </Text>
          </Card>
        ) : null}

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

// Moved mapCanvasStyle to CSS below

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  mapWrap: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 24,
    marginTop: theme.spacing.sm,
    backgroundColor: "#EAF1E4",
  },
  mapCanvas: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  loadingText: {
    fontSize: theme.typography.fontSize.sm,
  },
  errorCard: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
    left: theme.spacing.md,
    padding: theme.spacing.md,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: 6,
  },
  errorBody: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    left: theme.spacing.md,
    right: theme.spacing.md,
    bottom: theme.spacing.md,
  },
  selectionCard: {
    padding: theme.spacing.md,
  },
  selectionLabel: {
    fontSize: theme.typography.fontSize.sm,
    marginBottom: 6,
  },
  selectionValue: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: 22,
    fontWeight: theme.typography.fontWeight.medium,
  },
  errorText: {
    marginTop: 8,
    fontSize: theme.typography.fontSize.sm,
  },
  actions: {
    flexDirection: "row",
    columnGap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
