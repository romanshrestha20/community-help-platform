import {
  getAllHelpRequests,
  getNearbyHelpRequests,
} from "@/features/helpRequest/services/helpRequest.service";
import { HelpRequest } from "@/features/helpRequest/types/helpRequest.types";
import {
  MapRequestFilters,
  MapRequestItem,
} from "@/features/map/types/map.types";
import { calculateDistance } from "@/utils/distance";

const hasCoordinates = (request: HelpRequest) => {
  const lat = request.location?.latitude;
  const lng = request.location?.longitude;

  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

const matchesQuery = (request: HelpRequest, query?: string) => {
  const normalizedQuery = query?.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    request.title,
    request.description,
    request.category?.name ?? "",
    request.category?.slug ?? "",
    request.city ?? "",
    request.country ?? "",
    request.location?.formattedAddress ?? "",
    request.location?.addressLine1 ?? "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
};

const isWithinBounds = (
  request: HelpRequest,
  bounds: NonNullable<MapRequestFilters["bounds"]>
) => {
  const lat = request.location?.latitude;
  const lng = request.location?.longitude;

  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return false;
  }

  return (
    lat >= bounds.minLatitude &&
    lat <= bounds.maxLatitude &&
    lng >= bounds.minLongitude &&
    lng <= bounds.maxLongitude
  );
};

export const getNearbyRequests = async (
  filters: MapRequestFilters
): Promise<MapRequestItem[]> => {
  const params: Record<string, string | number> = {};

  if (filters.latitude != null) params.latitude = filters.latitude;
  if (filters.longitude != null) params.longitude = filters.longitude;
  if (filters.radiusKm != null) params.radiusKm = filters.radiusKm;

  if (filters.bounds) {
    params.minLatitude = filters.bounds.minLatitude;
    params.maxLatitude = filters.bounds.maxLatitude;
    params.minLongitude = filters.bounds.minLongitude;
    params.maxLongitude = filters.bounds.maxLongitude;
  }

  if (filters.categoryId) {
    params.categoryId = filters.categoryId;
  }

  // Public discovery map should only include open requests.
  params.status = "OPEN";

  if (filters.search?.trim()) {
    params.search = filters.search.trim();
  }

  const requests =
    !filters.bounds &&
    filters.latitude != null &&
    filters.longitude != null &&
    filters.radiusKm != null
      ? await getNearbyHelpRequests(params)
      : await getAllHelpRequests(params);
  const publicFeedRequests = requests.filter((request) => request.status === "OPEN");
  const withCoordinates = publicFeedRequests.filter(hasCoordinates);

  const filteredByBounds = filters.bounds
    ? withCoordinates.filter((request) => isWithinBounds(request, filters.bounds!))
    : withCoordinates;

  const withDistance: MapRequestItem[] = filteredByBounds.map((request) => {
    const existingDistance =
      typeof (request as MapRequestItem).distanceKm === "number"
        ? (request as MapRequestItem).distanceKm
        : null;

    const fallbackDistance =
      existingDistance == null &&
      filters.latitude != null &&
      filters.longitude != null &&
      request.location?.latitude != null &&
      request.location?.longitude != null
        ? calculateDistance(
            filters.latitude,
            filters.longitude,
            request.location.latitude,
            request.location.longitude
          )
        : null;

    return {
      ...request,
      distanceKm: existingDistance ?? fallbackDistance,
    };
  });

  return withDistance
    .filter((request) => {
      if (!matchesQuery(request, filters.search)) {
        return false;
      }

      if (
        filters.radiusKm != null &&
        request.distanceKm != null &&
        request.distanceKm > filters.radiusKm
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
};
