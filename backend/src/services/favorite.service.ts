import { Prisma, RequestStatus } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import AppError from "../utils/appError.js";
import { buildFilters } from "./helpRequest.service.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const DEFAULT_SORT_BY = "createdAt";
const DEFAULT_SORT_ORDER: Prisma.SortOrder = "desc";
const DEFAULT_FAVORITABLE_STATUSES = [RequestStatus.OPEN];

type FavoriteVisibilityOptions = {
  enforceFavoritableStatus?: boolean;
  allowedStatuses?: RequestStatus[];
};

type MutateFavoriteInput = {
  userId: string;
  requestId: string;
} & FavoriteVisibilityOptions;

type FavoriteListQuery = {
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  order?: string;
  [key: string]: unknown;
};

const REQUEST_INCLUDE = {
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
  requester: { select: { id: true, profile: { select: { fullName: true } } } },
  _count: { select: { bids: true } },
} satisfies Prisma.HelpRequestInclude;

const sanitizePagination = (page?: string | number, limit?: string | number) => {
  const parsedPage =
    typeof page === "number" ? page : Number.parseInt(String(page ?? DEFAULT_PAGE), 10);
  const parsedLimit =
    typeof limit === "number" ? limit : Number.parseInt(String(limit ?? DEFAULT_LIMIT), 10);

  const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : DEFAULT_PAGE;
  const safeLimit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, MAX_LIMIT)
      : DEFAULT_LIMIT;

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
};

const formatHelpRequest = (
  request: Prisma.HelpRequestGetPayload<{ include: typeof REQUEST_INCLUDE }>,
  favoritedAt?: Date
) => ({
  id: request.id,
  requesterId: request.requester.id,
  title: request.title,
  description: request.description,
  category: request.category
    ? {
        id: request.category.id,
        name: request.category.name,
        slug: request.category.slug,
        icon: request.category.icon,
      }
    : null,
  budget: request.budget,
  status: request.status,
  isPaid: request.isPaid,
  city: request.location?.city,
  state: request.location?.state,
  country: request.location?.country,
  requesterName: request.requester.profile?.fullName,
  images: Array.isArray(request.images)
    ? request.images.map((image) => ({
        id: image.id,
        url: image.url,
        type: image.type,
        requestId: image.requestId,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt,
      }))
    : [],
  bidCount: request._count.bids,
  createdAt: request.createdAt,
  favoritedAt: favoritedAt ?? null,
});

const buildFavoriteOrderBy = (
  sortBy?: string,
  order?: string
): Prisma.FavoriteOrderByWithRelationInput => {
  const direction: Prisma.SortOrder = order === "asc" ? "asc" : "desc";

  switch (sortBy) {
    case "favoritedAt":
      return { createdAt: direction };
    case "title":
    case "budget":
    case "status":
    case "category":
    case "createdAt":
    case "updatedAt":
      return { request: { [sortBy]: direction } };
    default:
      return { request: { createdAt: DEFAULT_SORT_ORDER } };
  }
};

const ensureRequestExists = async (requestId: string) => {
  const request = await prisma.helpRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!request) {
    throw new AppError("Help request not found", 404);
  }

  return request;
};

export const ensureRequestFavoritable = async (
  requestId: string,
  options: FavoriteVisibilityOptions = {}
) => {
  const { enforceFavoritableStatus = true, allowedStatuses = DEFAULT_FAVORITABLE_STATUSES } =
    options;

  const request = await ensureRequestExists(requestId);

  if (enforceFavoritableStatus && !allowedStatuses.includes(request.status)) {
    throw new AppError("This request cannot be favorited", 400);
  }

  return request;
};

export const addFavoriteHelpRequest = async ({
  userId,
  requestId,
  enforceFavoritableStatus = true,
  allowedStatuses = DEFAULT_FAVORITABLE_STATUSES,
}: MutateFavoriteInput) => {
  await ensureRequestFavoritable(requestId, {
    enforceFavoritableStatus,
    allowedStatuses,
  });

  try {
    const favorite = await prisma.favorite.create({
      data: {
        user: { connect: { id: userId } },
        request: { connect: { id: requestId } },
      },
      include: {
        request: {
          include: REQUEST_INCLUDE,
        },
      },
    });

    return {
      created: true,
      favorite: formatHelpRequest(favorite.request, favorite.createdAt),
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existingFavorite = await prisma.favorite.findFirst({
        where: {
          userId,
          requestId,
        },
        include: {
          request: {
            include: REQUEST_INCLUDE,
          },
        },
      });

      if (existingFavorite) {
        return {
          created: false,
          favorite: formatHelpRequest(existingFavorite.request, existingFavorite.createdAt),
        };
      }
    }

    throw error;
  }
};

export const getFavoriteHelpRequests = async (userId: string, query: FavoriteListQuery = {}) => {
  const { page, limit, skip } = sanitizePagination(query.page, query.limit);
  const {
    sortBy = DEFAULT_SORT_BY,
    order = DEFAULT_SORT_ORDER,
    ...filterQuery
  } = query;

  const requestFilters = buildFilters(filterQuery);
  const where: Prisma.FavoriteWhereInput = {
    userId,
    request: requestFilters,
  };

  const [total, favorites] = await Promise.all([
    prisma.favorite.count({ where }),
    prisma.favorite.findMany({
      where,
      skip,
      take: limit,
      orderBy: buildFavoriteOrderBy(sortBy, String(order)),
      include: {
        request: {
          include: REQUEST_INCLUDE,
        },
      },
    }),
  ]);

  return {
    requests: favorites.map((favorite) => formatHelpRequest(favorite.request, favorite.createdAt)),
    meta: {
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const removeFavoriteHelpRequest = async ({
  userId,
  requestId,
}: MutateFavoriteInput) => {
  await ensureRequestExists(requestId);

  const result = await prisma.favorite.deleteMany({
    where: {
      userId,
      requestId,
    },
  });

  return {
    removed: result.count > 0,
  };
};

export const getMyFavoriteRequestIds = async (userId: string) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: {
      requestId: true,
    },
  });

  return favorites.map((item) => item.requestId);
};

export const isRequestFavorited = async (userId: string, requestId: string) => {
  const favorite = await prisma.favorite.findFirst({
    where: {
      userId,
      requestId,
    },
    select: {
      id: true,
    },
  });

  return Boolean(favorite);
};
