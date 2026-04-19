import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import AppError from "../utils/appError.js";

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

type NearbyHelpRequestQuery = {
  userId: string;
  latitude?: string | number;
  longitude?: string | number;
  radiusKm?: string | number;
  category?: string;
  categoryId?: string;
  search?: string;
  page?: string | number;
  limit?: string | number;
};

type NearbyHelpRequestRow = {
  id: string;
  requesterId: string;
  title: string;
  description: string;
  budget: number | null;
  status: string;
  isPaid: boolean;
  serviceRadiusMeters: number | null;
  createdAt: Date;
  updatedAt: Date;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  categoryIcon: string | null;
  locationId: string;
  latitude: number;
  longitude: number;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  formattedAddress: string | null;
  requesterName: string | null;
  requesterAvatarUrl: string | null;
  requesterGender: string | null;
  requesterLocation: string | null;
  bidCount: bigint | number;
  isFavorited: boolean;
  distanceMeters: number;
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

export const getNearbyHelpRequests = async (query: NearbyHelpRequestQuery) => {
  const userId = String(query.userId || "").trim();

  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const page = Math.max(Number.parseInt(String(query.page ?? 1), 10) || 1, 1);
  const limit = Math.min(Number.parseInt(String(query.limit ?? 20), 10) || 20, 50);
  const offset = (page - 1) * limit;

  const currentUser = await prisma.userModel.findUnique({
    where: { id: userId },
    select: {
      id: true,
      profile: {
        select: {
          searchRadiusMeters: true,
          address: {
            select: {
              latitude: true,
              longitude: true,
            },
          },
        },
      },
    },
  });

  if (!currentUser) {
    throw new AppError("User not found.", 404);
  }

  const fallbackLatitude = currentUser.profile?.address?.latitude ?? null;
  const fallbackLongitude = currentUser.profile?.address?.longitude ?? null;
  const fallbackRadiusKm =
    currentUser.profile?.searchRadiusMeters != null
      ? currentUser.profile.searchRadiusMeters / 1000
      : 0.8;

  const latitude = parseFiniteNumber(query.latitude) ?? fallbackLatitude;
  const longitude = parseFiniteNumber(query.longitude) ?? fallbackLongitude;
  const radiusKm = parseFiniteNumber(query.radiusKm) ?? fallbackRadiusKm;

  if (latitude == null || longitude == null) {
    throw new AppError("User location is required to search nearby requests.", 400);
  }

  const categoryId =
    typeof query.categoryId === "string" && query.categoryId.trim()
      ? query.categoryId.trim()
      : null;
  const categorySlug =
    typeof query.category === "string" && query.category.trim()
      ? query.category.trim().toLowerCase()
      : null;
  const normalizedSearch =
    typeof query.search === "string" && query.search.trim()
      ? query.search.trim()
      : null;
  const radiusMeters = Math.max(radiusKm, 0) * 1000;

  const categoryIdSql = categoryId
    ? Prisma.sql`AND hr."categoryId" = ${categoryId}`
    : Prisma.empty;
  const categorySlugSql = !categoryId && categorySlug
    ? Prisma.sql`AND c.slug = ${categorySlug}`
    : Prisma.empty;
  const searchSql = normalizedSearch
    ? Prisma.sql`
        AND (
          hr.title ILIKE ${`%${normalizedSearch}%`}
          OR hr.description ILIKE ${`%${normalizedSearch}%`}
          OR c.name ILIKE ${`%${normalizedSearch}%`}
          OR c.slug ILIKE ${`%${normalizedSearch}%`}
          OR COALESCE(l.city, '') ILIKE ${`%${normalizedSearch}%`}
          OR COALESCE(l.country, '') ILIKE ${`%${normalizedSearch}%`}
          OR COALESCE(l."formattedAddress", '') ILIKE ${`%${normalizedSearch}%`}
          OR COALESCE(l."addressLine1", '') ILIKE ${`%${normalizedSearch}%`}
        )
      `
    : Prisma.empty;

  const rows = await prisma.$queryRaw<NearbyHelpRequestRow[]>(Prisma.sql`
    SELECT
      hr.id,
      hr."requesterId" AS "requesterId",
      hr.title,
      hr.description,
      hr.budget,
      hr.status::text AS status,
      hr."isPaid" AS "isPaid",
      hr."serviceRadiusMeters" AS "serviceRadiusMeters",
      hr."createdAt" AS "createdAt",
      hr."updatedAt" AS "updatedAt",
      c.id AS "categoryId",
      c.name AS "categoryName",
      c.slug AS "categorySlug",
      c.icon AS "categoryIcon",
      l.id AS "locationId",
      l.latitude,
      l.longitude,
      l."addressLine1",
      l."addressLine2",
      l.city,
      l.state,
      l."postalCode",
      l.country,
      l."formattedAddress",
      p."fullName" AS "requesterName",
      p."avatarUrl" AS "requesterAvatarUrl",
      p.gender::text AS "requesterGender",
      COALESCE(
        rp_addr."formattedAddress",
        NULLIF(CONCAT_WS(', ', rp_addr.city, rp_addr.country), '')
      ) AS "requesterLocation",
      COUNT(DISTINCT b.id)::bigint AS "bidCount",
      EXISTS (
        SELECT 1
        FROM favorites f
        WHERE f."userId" = ${userId}
          AND f."requestId" = hr.id
      ) AS "isFavorited",
      earth_distance(
        ll_to_earth(${latitude}, ${longitude}),
        ll_to_earth(l.latitude, l.longitude)
      ) AS "distanceMeters"
    FROM "help_requests" hr
    INNER JOIN "locations" l
      ON l.id = hr."locationId"
    INNER JOIN "categories" c
      ON c.id = hr."categoryId"
    INNER JOIN "users" u
      ON u.id = hr."requesterId"
    LEFT JOIN "profiles" p
      ON p."userId" = u.id
    LEFT JOIN "locations" rp_addr
      ON rp_addr.id = p."addressId"
    LEFT JOIN "bids" b
      ON b."requestId" = hr.id
    WHERE hr.status = 'OPEN'::"RequestStatus"
      AND hr."locationId" IS NOT NULL
      AND hr."requesterId" <> ${userId}
      AND earth_distance(
        ll_to_earth(${latitude}, ${longitude}),
        ll_to_earth(l.latitude, l.longitude)
      ) <= ${radiusMeters}
      ${categoryIdSql}
      ${categorySlugSql}
      ${searchSql}
    GROUP BY
      hr.id,
      c.id,
      l.id,
      p.id,
      rp_addr.id
    ORDER BY "distanceMeters" ASC, hr."createdAt" DESC
    LIMIT ${limit}
    OFFSET ${offset};
  `);

  const totalResult = await prisma.$queryRaw<Array<{ count: bigint | number }>>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM "help_requests" hr
    INNER JOIN "locations" l
      ON l.id = hr."locationId"
    INNER JOIN "categories" c
      ON c.id = hr."categoryId"
    WHERE hr.status = 'OPEN'::"RequestStatus"
      AND hr."locationId" IS NOT NULL
      AND hr."requesterId" <> ${userId}
      AND earth_distance(
        ll_to_earth(${latitude}, ${longitude}),
        ll_to_earth(l.latitude, l.longitude)
      ) <= ${radiusMeters}
      ${categoryIdSql}
      ${categorySlugSql}
      ${searchSql};
  `);

  return {
    requests: rows.map((row) => ({
      id: row.id,
      requesterId: row.requesterId,
      title: row.title,
      description: row.description,
      categoryId: row.categoryId,
      category: {
        id: row.categoryId,
        name: row.categoryName,
        slug: row.categorySlug,
        icon: row.categoryIcon,
      },
      budget: row.budget,
      status: row.status,
      isPaid: row.isPaid,
      serviceRadiusMeters: row.serviceRadiusMeters ?? null,
      location: {
        id: row.locationId,
        latitude: row.latitude,
        longitude: row.longitude,
        addressLine1: row.addressLine1,
        addressLine2: row.addressLine2,
        city: row.city,
        state: row.state,
        postalCode: row.postalCode,
        country: row.country,
        formattedAddress: row.formattedAddress,
      },
      city: row.city,
      state: row.state,
      country: row.country,
      requesterName: row.requesterName ?? null,
      requesterAvatarUrl: row.requesterAvatarUrl ?? null,
      requesterGender: row.requesterGender ?? null,
      requesterLocation: row.requesterLocation ?? null,
      images: [],
      bidCount: Number(row.bidCount ?? 0),
      isFavorited: row.isFavorited,
      distanceKm: Number((Number(row.distanceMeters) / 1000).toFixed(1)),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })),
    meta: {
      total: Number(totalResult[0]?.count ?? 0),
      page,
      totalPages: Math.ceil(Number(totalResult[0]?.count ?? 0) / limit),
    },
    searchMeta: {
      latitude,
      longitude,
      radiusKm,
      categoryId,
      category: categorySlug,
      search: normalizedSearch,
    },
  };
};
