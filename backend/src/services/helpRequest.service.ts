import { prisma } from "../lib/prisma.js";

const validCategories = ["FOOD", "MEDICAL", "EDUCATION", "OTHER"];
const validStatuses = ["OPEN", "ASSIGNED", "COMPLETED", "CANCELLED"];

// Build the filter object
export const buildFilters = (query: any) => {
  const { category, status, search, city, state, country } = query;
  const filters: any = {};

  if (category) filters.category = category;
  if (status) filters.status = status;

  if (search) {
    filters.OR = [
      { title: { contains: search as string, mode: "insensitive" } },
      { description: { contains: search as string, mode: "insensitive" } },
    ];
  }

  if (city || state || country) {
    filters.location = {};
    if (city) filters.location.city = { contains: city as string, mode: "insensitive" };
    if (state) filters.location.state = { contains: state as string, mode: "insensitive" };
    if (country) filters.location.country = { contains: country as string, mode: "insensitive" };
  }

  return filters;
};

// Get paginated, filtered, sorted requests
export const getHelpRequests = async (query: any) => {
  const page = Math.max(parseInt(query.page as string) || 1, 1);
  const limit = Math.min(parseInt(query.limit as string) || 10, 50);
  const skip = (page - 1) * limit;

  const { sortBy = "createdAt", order = "desc" } = query;

  const filters = buildFilters(query);

  const [total, requests] = await Promise.all([
    prisma.helpRequest.count({ where: filters }),
    prisma.helpRequest.findMany({
      where: filters,
      skip,
      take: limit,
      orderBy: { [sortBy as string]: order === "asc" ? "asc" : "desc" },
      include: {
        location: true,
        requester: { select: { id: true, profile: { select: { fullName: true } } } },
        _count: { select: { bids: true } },
      },
    }),
  ]);

  const formatted = requests.map((r: any) => ({
    id: r.id,
    requesterId: r.requester.id,
    title: r.title,
    description: r.description,
    category: r.category,
    budget: r.budget,
    status: r.status,
    isPaid: r.isPaid,
    city: r.location?.city,
    state: r.location?.state,
    country: r.location?.country,
    requesterName: r.requester.profile?.fullName,
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

// You can add future helpers like:
// - createHelpRequest
// - updateHelpRequest
// - deleteHelpRequest
// - updateHelpRequestStatus
// All business logic goes here