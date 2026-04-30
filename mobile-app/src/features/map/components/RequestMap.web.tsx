import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import type {
  Coordinates,
  MapBounds,
  MapRequestItem,
} from "@/features/map/types/map.types";
import { getRegionForCoordinates } from "@/features/map/utils/getRegionForCoordinates";
import {
  formatRequestBudget,
  getRequestCategoryLabel,
} from "@/features/helpRequest/utils/requestDisplay";
import { isUrgentRequestActive } from "@/features/helpRequest/utils/urgent";

type Props = {
  userLocation: Coordinates | null;
  requests: MapRequestItem[];
  selectedRequestId?: string | null;
  onSelectRequest: (request: MapRequestItem) => void;
  onPressMap?: () => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  centerSignal?: number;
};

type LeafletWindow = Window & {
  L?: any;
  __communitySupportLeafletPromise?: Promise<void>;
};

type ScriptState = {
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
};

type WebMapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const LEAFLET_SCRIPT_ID = "community-support-leaflet-script";
const LEAFLET_STYLE_ID = "community-support-leaflet-style";

const hasValidCoordinate = (
  latitude?: number | null,
  longitude?: number | null
) =>
  typeof latitude === "number" &&
  typeof longitude === "number" &&
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;

const regionToZoom = (region: WebMapRegion) => {
  const longitudeDelta = Math.max(region.longitudeDelta, 0.0005);
  const zoom = Math.round(Math.log2(360 / longitudeDelta));
  return Math.min(18, Math.max(3, zoom));
};

const boundsFromLeaflet = (bounds: any): MapBounds => ({
  minLatitude: bounds.getSouth(),
  maxLatitude: bounds.getNorth(),
  minLongitude: bounds.getWest(),
  maxLongitude: bounds.getEast(),
});

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

export const RequestMap = ({
  userLocation,
  requests,
  selectedRequestId,
  onSelectRequest,
  onPressMap,
  onBoundsChange,
  centerSignal = 0,
}: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [scriptState, setScriptState] = useState<ScriptState>({
    status: "idle",
    error: null,
  });

  const validRequests = useMemo(
    () =>
      requests.filter((request) =>
        hasValidCoordinate(
          request.location?.latitude,
          request.location?.longitude
        )
      ),
    [requests]
  );

  const initialRegion = useMemo(
    () => getRegionForCoordinates(userLocation, validRequests),
    [userLocation, validRequests]
  );

  useEffect(() => {
    let isMounted = true;

    const setupMap = async () => {
      if (!containerRef.current || mapRef.current) return;

      try {
        setScriptState({ status: "loading", error: null });
        await ensureLeafletAssets();

        if (!isMounted || !containerRef.current) return;

        const leaflet = (window as LeafletWindow).L;
        if (!leaflet) {
          throw new Error("Leaflet did not initialize correctly.");
        }

        const map = leaflet.map(containerRef.current, {
          zoomControl: false,
          attributionControl: true,
        });

        map.setView(
          [initialRegion.latitude, initialRegion.longitude],
          regionToZoom(initialRegion)
        );

        leaflet
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors",
          })
          .addTo(map);

        markerLayerRef.current = leaflet.layerGroup().addTo(map);

        map.on("click", () => {
          onPressMap?.();
        });

        map.on("moveend", () => {
          const bounds = map.getBounds?.();
          if (!bounds) return;
          onBoundsChange?.(boundsFromLeaflet(bounds));
        });

        mapRef.current = map;
        setScriptState({ status: "ready", error: null });
      } catch (error) {
        if (!isMounted) return;

        setScriptState({
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "Failed to initialize the web map.",
        });
      }
    };

    void setupMap();

    return () => {
      isMounted = false;
    };
  }, [initialRegion.latitude, initialRegion.longitude, onBoundsChange, onPressMap]);

  useEffect(() => {
    const leaflet = (window as LeafletWindow).L;
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;

    if (!leaflet || !map || !markerLayer) {
      return;
    }

    markerLayer.clearLayers();

    validRequests.forEach((request) => {
      const isSelected = request.id === selectedRequestId;
      const isUrgentActive = isUrgentRequestActive(request);
      const markerFill = isUrgentActive ? "#DC2626" : isSelected ? "#F4A261" : "#2E9D74";
      const markerStroke = isUrgentActive ? "#991B1B" : isSelected ? "#C46A2D" : "#1F7A58";
      const marker = leaflet.marker(
        [request.location!.latitude!, request.location!.longitude!],
        {
          icon: leaflet.divIcon({
            className: "community-request-marker",
            html: `
              <div style="
                width:${isSelected ? 24 : 20}px;
                height:${isSelected ? 24 : 20}px;
                border-radius:999px;
                background:${markerFill};
                border:3px solid ${markerStroke};
                box-shadow:0 6px 18px rgba(18,32,19,0.22);
              "></div>
            `,
            iconSize: [isSelected ? 24 : 20, isSelected ? 24 : 20],
            iconAnchor: [isSelected ? 12 : 10, isSelected ? 12 : 10],
          }),
          title: request.title,
        }
      );

      marker.bindTooltip(request.title, {
        direction: "top",
        offset: [0, -12],
        opacity: 0.96,
      });

      marker.bindPopup(
        `
          <div style="min-width:180px;padding:2px 2px 0;">
            <div style="font-size:14px;font-weight:700;color:#1E2A1E;margin-bottom:4px;">
              ${request.title}
            </div>
            <div style="font-size:12px;color:#5C6A58;margin-bottom:6px;">
              ${getRequestCategoryLabel(request)}
            </div>
            <div style="font-size:13px;font-weight:600;color:#1F7A58;">
              ${formatRequestBudget(request)}
            </div>
          </div>
        `,
        {
          closeButton: false,
          offset: [0, -14],
        }
      );

      marker.on("click", () => {
        onSelectRequest(request);
        marker.openPopup();
      });

      marker.addTo(markerLayer);
    });
  }, [onSelectRequest, selectedRequestId, validRequests]);

  useEffect(() => {
    const leaflet = (window as LeafletWindow).L;
    const map = mapRef.current;

    if (!leaflet || !map) {
      return;
    }

    userMarkerRef.current?.remove?.();
    userMarkerRef.current = null;

    if (!userLocation) {
      return;
    }

    const marker = leaflet.marker([userLocation.latitude, userLocation.longitude], {
      icon: leaflet.divIcon({
        className: "community-user-marker",
        html: `
          <div style="
            width:18px;
            height:18px;
            border-radius:999px;
            background:#2563EB;
            border:4px solid rgba(255,255,255,0.96);
            box-shadow:0 0 0 8px rgba(37,99,235,0.18);
          "></div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
      title: "Your location",
    });

    marker.bindTooltip("Your location", {
      direction: "top",
      offset: [0, -10],
      opacity: 0.96,
    });
    marker.addTo(map);
    userMarkerRef.current = marker;
  }, [userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.setView(
      [initialRegion.latitude, initialRegion.longitude],
      regionToZoom(initialRegion),
      { animate: true }
    );
  }, [centerSignal]);

  useEffect(() => {
    return () => {
      markerLayerRef.current?.clearLayers?.();
      userMarkerRef.current?.remove?.();
      mapRef.current?.remove?.();
      mapRef.current = null;
      markerLayerRef.current = null;
      userMarkerRef.current = null;
    };
  }, []);

  if (scriptState.status === "error") {
    return (
      <View style={styles.stateCard}>
        <Text style={styles.stateTitle}>Map unavailable on web</Text>
        <Text style={styles.stateBody}>
          {scriptState.error || "The web map library could not be loaded."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <div ref={containerRef} style={mapCanvasStyle} />

      {scriptState.status !== "ready" ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading map…</Text>
        </View>
      ) : null}
    </View>
  );
};

const mapCanvasStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#EAF1E4",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#40503D",
  },
  stateCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#F6F8F4",
    paddingHorizontal: 24,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E2A1E",
    marginBottom: 8,
  },
  stateBody: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    color: "#5C6A58",
  },
});
