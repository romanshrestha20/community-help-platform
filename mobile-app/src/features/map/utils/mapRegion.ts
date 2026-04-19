import type { Region } from "react-native-maps";

import type { MapBounds } from "../types/map.types";

export const getBoundsFromRegion = (region: Region): MapBounds => {
    const minLatitude = region.latitude - region.latitudeDelta / 2;
    const maxLatitude = region.latitude + region.latitudeDelta / 2;
    const minLongitude = region.longitude - region.longitudeDelta / 2;
    const maxLongitude = region.longitude + region.longitudeDelta / 2;

    return {
        minLatitude,
        maxLatitude,
        minLongitude,
        maxLongitude,
    };
};
