import { HelpRequest, HelpRequestStatus } from "@/features/helpRequest/types/helpRequest.types";
import type { Region } from "react-native-maps";

export type MapRequestItem = HelpRequest & {
    distanceKm?: number | null;
};

export type MapBounds = {
    minLatitude: number;
    maxLatitude: number;
    minLongitude: number;
    maxLongitude: number;
};

export type MapRequestFilters = {
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    categoryId?: string | null;
    status?: HelpRequestStatus | "ALL" | null;
    search?: string;
    region?: Region | null;
    bounds?: MapBounds | null;
};

export type Coordinates = {
    latitude: number;
    longitude: number;
};
