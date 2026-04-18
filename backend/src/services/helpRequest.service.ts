import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

const validStatuses = ["OPEN", "ASSIGNED", "COMPLETED", "CANCELLED"] as const;
const allowedSortFields = ["createdAt", "updatedAt", "budget", "title", "status"] as const;

type HelpRequestQuery = {
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  order?: string;
  category?: string;
  categoryId?: string;
  status?: string;
  search?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: string | number;
  longitude?: string | number;
  radiusKm?: string | number;
  minLatitude?: string | number;
  maxLatitude?: string | number;
  minLongitude?: string | number;
  maxLongitude?: string | number;
};

const parseFiniteNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRad(lat2 - lat1);
  const deltaLon = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const buildFilters = (query: HelpRequestQuery): Prisma.HelpRequestWhereInput => {
  const {
    category,
    categoryId,
    status,
    search,
    city,
    state,
    country,
    latitude,
    longitude,
    minLatitude,
    maxLatitude,
    minLongitude,
    maxLongitude,
  } = query;

  const filters: Prisma.HelpRequestWhereInput = {};
  const locationFilters: Prisma.LocationWhereInput = {};

  const parsedLatitude = parseFiniteNumber(latitude);
  const parsedLongitude = parseFiniteNumber(longitude);

  const parsedMinLatitude = parseFiniteNumber(minLatitude);
  const parsedMaxLatitude = parseFiniteNumber(maxLatitude);
  const parsedMinLongitude = parseFiniteNumber(minLongitude);
  const parsedMaxLongitude = parseFiniteNumber(maxLongitude);

  const hasMapCoordinates =
    parsedLatitude !== null && parsedLongitude !== null;

  const hasBounds =
    parsedMinLatitude !== null &&
    parsedMaxLatitude !== null &&
    parsedMinLongitude !== null &&
    parsedMaxLongitude !== null;

  if (categoryId) {
    filters.categoryId = String(categoryId);
  } else if (category) {
    filters.category = {
      slug: String(category).trim().toLowerCase(),
    };
  }

  if (status && validStatuses.includes(status as (typeof validStatuses)[number])) {
    filters.status = status as Prisma.EnumRequestStatusFilter<"HelpRequest"> | any;
  }

  if (search) {
    filters.OR = [
      { title: { contains: String(search), mode: "insensitive" } },
      { description: { contains: String(search), mode: "insensitive" } },
    ];
  }

  if (city) {
    locationFilters.city = { contains: String(city), mode: "insensitive" };
  }

  if (state) {
    locationFilters.state = { contains: String(state), mode: "insensitive" };
  }

  if (country) {
    locationFilters.country = { contains: String(country), mode: "insensitive" };
  }

  if (hasBounds) {
    locationFilters.latitude = {
      gte: parsedMinLatitude,
      lte: parsedMaxLatitude,
    };

    locationFilters.longitude = {
      gte: parsedMinLongitude,
      lte: parsedMaxLongitude,
    };
  }

  if (Object.keys(locationFilters).length > 0) {
    filters.location = {
      is: locationFilters,
    };
  }

  if (hasMapCoordinates && !hasBounds) {
    filters.location =
      Object.keys(locationFilters).length > 0
        ? {
            is: locationFilters,
            isNot: null,
          }
        : {
            isNot: null,
          };
  }

  return filters;
};
export const getHelpRequests = async (query: HelpRequestQuery) => {
  const page = Math.max(Number.parseInt(String(query.page ?? 1), 10) || 1, 1);
  const limit = Math.min(Number.parseInt(String(query.limit ?? 10), 10) || 10, 50);
  const skip = (page - 1) * limit;

  const sortBy = typeof query.sortBy === "string" ? query.sortBy : "createdAt";
  const order: Prisma.SortOrder = query.order === "asc" ? "asc" : "desc";

  const safeSortBy = (allowedSortFields as readonly string[]).includes(sortBy)
    ? sortBy
    : "createdAt";

  const filters = buildFilters(query);

  const latitude = parseFiniteNumber(query.latitude);
  const longitude = parseFiniteNumber(query.longitude);
  const radiusKm = parseFiniteNumber(query.radiusKm);

  const minLatitude = parseFiniteNumber(query.minLatitude);
  const maxLatitude = parseFiniteNumber(query.maxLatitude);
  const minLongitude = parseFiniteNumber(query.minLongitude);
  const maxLongitude = parseFiniteNumber(query.maxLongitude);

  const hasBounds =
    minLatitude !== null &&
    maxLatitude !== null &&
    minLongitude !== null &&
    maxLongitude !== null;

  const shouldCalculateDistance = latitude !== null && longitude !== null;

  const requests = await prisma.helpRequest.findMany({
    where: filters,
    orderBy: { [safeSortBy]: order },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
        },
      },
      location: true,
      images: true,
      requester: {
        select: {
          id: true,
          profile: {
            select: {
              fullName: true,
              avatarUrl: true,
              gender: true,
              address: {
                select: {
                  city: true,
                  state: true,
                  country: true,
                  formattedAddress: true,
                },
              },
            },
          },
        },
      },
      _count: { select: { bids: true } },
    },
  });

  const withDistance = requests
    .map((r) => {
      const distanceKm =
        shouldCalculateDistance &&
        r.location?.latitude != null &&
        r.location?.longitude != null
          ? calculateDistanceKm(
              latitude,
              longitude,
              r.location.latitude,
              r.location.longitude
            )
          : null;

      return {
        id: r.id,
        requesterId: r.requester.id,
        title: r.title,
        description: r.description,
        categoryId: r.categoryId,
        category: r.category
          ? {
              id: r.category.id,
              name: r.category.name,
              slug: r.category.slug,
              icon: r.category.icon,
            }
          : null,
        budget: r.budget,
        status: r.status,
        isPaid: r.isPaid,
        serviceRadiusMeters: r.serviceRadiusMeters ?? null,
        location: r.location
          ? {
              id: r.location.id,
              latitude: r.location.latitude,
              longitude: r.location.longitude,
              addressLine1: r.location.addressLine1,
              addressLine2: r.location.addressLine2,
              city: r.location.city,
              state: r.location.state,
              postalCode: r.location.postalCode,
              country: r.location.country,
              formattedAddress: r.location.formattedAddress,
            }
          : null,
        city: r.location?.city ?? null,
        state: r.location?.state ?? null,
        country: r.location?.country ?? null,
        requesterName: r.requester.profile?.fullName ?? null,
        requesterAvatarUrl: r.requester.profile?.avatarUrl ?? null,
        requesterGender: r.requester.profile?.gender ?? null,
        requesterLocation:
          r.requester.profile?.address?.formattedAddress ||
          [r.requester.profile?.address?.city, r.requester.profile?.address?.country]
            .filter(Boolean)
            .join(", ") ||
          null,
        images: Array.isArray(r.images)
          ? r.images.map((image) => ({
              id: image.id,
              url: image.url,
              type: image.type,
              requestId: image.requestId,
              createdAt: image.createdAt,
              updatedAt: image.updatedAt,
            }))
          : [],
        bidCount: r._count.bids,
        distanceKm,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    })
    .filter((request) => {
      if (
        hasBounds &&
        request.location?.latitude != null &&
        request.location?.longitude != null
      ) {
        const insideBounds =
          request.location.latitude >= minLatitude! &&
          request.location.latitude <= maxLatitude! &&
          request.location.longitude >= minLongitude! &&
          request.location.longitude <= maxLongitude!;

        if (!insideBounds) {
          return false;
        }
      }

      if (!hasBounds && radiusKm !== null && request.distanceKm !== null) {
        return request.distanceKm <= radiusKm;
      }

      return true;
    });

  const sorted =
    shouldCalculateDistance && !hasBounds
      ? [...withDistance].sort((left, right) => {
          if (left.distanceKm === null && right.distanceKm === null) return 0;
          if (left.distanceKm === null) return 1;
          if (right.distanceKm === null) return -1;
          return left.distanceKm - right.distanceKm;
        })
      : withDistance;

  const total = sorted.length;
  const formatted = sorted.slice(skip, skip + limit);

  return {
    requests: formatted,
    meta: {
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  };
};