import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

const validStatuses = ["OPEN", "ASSIGNED", "COMPLETED", "CANCELLED"] as const;
const allowedSortFields = ["createdAt", "updatedAt", "budget", "title", "status"] as const;

type HelpRequestQuery = {
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  order?: string;
  category?: string; // slug
  categoryId?: string;
  status?: string;
  search?: string;
  city?: string;
  state?: string;
  country?: string;
};

export const buildFilters = (query: HelpRequestQuery): Prisma.HelpRequestWhereInput => {
  const { category, categoryId, status, search, city, state, country } = query;
  const filters: Prisma.HelpRequestWhereInput = {};

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

  if (city || state || country) {
    filters.location = {
      ...(city ? { city: { contains: String(city), mode: "insensitive" } } : {}),
      ...(state ? { state: { contains: String(state), mode: "insensitive" } } : {}),
      ...(country ? { country: { contains: String(country), mode: "insensitive" } } : {}),
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

  const [total, requests] = await Promise.all([
    prisma.helpRequest.count({ where: filters }),
    prisma.helpRequest.findMany({
      where: filters,
      skip,
      take: limit,
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
              },
            },
          },
        },
        _count: { select: { bids: true } },
      },
    }),
  ]);

  const formatted = requests.map((r) => ({
    id: r.id,
    requesterId: r.requester.id,
    title: r.title,
    description: r.description,
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
    city: r.location?.city ?? null,
    state: r.location?.state ?? null,
    country: r.location?.country ?? null,
    requesterName: r.requester.profile?.fullName ?? null,
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
    createdAt: r.createdAt,
  }));

  return {
    requests: formatted,
    meta: {
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  };
};