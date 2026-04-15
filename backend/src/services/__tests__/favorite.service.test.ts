import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    helpRequest: {
      findUnique: vi.fn(),
    },
    favorite: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

import { Prisma, RequestStatus } from "../../../generated/prisma/client.js";
import * as favoriteService from "../favorite.service.js";

const requestRecord = {
  id: "req-1",
  title: "Need groceries",
  description: "Help with groceries",
  category: "FOOD",
  budget: 25,
  status: RequestStatus.OPEN,
  isPaid: false,
  createdAt: new Date("2026-04-01T00:00:00.000Z"),
  updatedAt: new Date("2026-04-01T00:00:00.000Z"),
  location: {
    city: "Helsinki",
    state: "Uusimaa",
    country: "Finland",
  },
  images: [
    {
      id: "img-1",
      url: "https://example.com/1.jpg",
      type: "REQUEST",
      requestId: "req-1",
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    },
  ],
  requester: {
    id: "user-owner",
    profile: {
      fullName: "Roman Shrestha",
    },
  },
  _count: {
    bids: 2,
  },
};

describe("favorite.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ensureRequestFavoritable: rejects when request does not exist", async () => {
    prismaMock.helpRequest.findUnique.mockResolvedValue(null);

    await expect(favoriteService.ensureRequestFavoritable("missing-request")).rejects.toMatchObject({
      message: "Help request not found",
      statusCode: 404,
    });
  });

  it("ensureRequestFavoritable: rejects closed requests by default", async () => {
    prismaMock.helpRequest.findUnique.mockResolvedValue({
      id: "req-1",
      status: RequestStatus.COMPLETED,
    });

    await expect(favoriteService.ensureRequestFavoritable("req-1")).rejects.toMatchObject({
      message: "This request cannot be favorited",
      statusCode: 400,
    });
  });

  it("addFavoriteHelpRequest: creates a favorite for an open request", async () => {
    prismaMock.helpRequest.findUnique.mockResolvedValue({
      id: "req-1",
      status: RequestStatus.OPEN,
    });
    prismaMock.favorite.create.mockResolvedValue({
      id: "fav-1",
      userId: "user-1",
      requestId: "req-1",
      createdAt: new Date("2026-04-02T00:00:00.000Z"),
      request: requestRecord,
    });

    const result = await favoriteService.addFavoriteHelpRequest({
      userId: "user-1",
      requestId: "req-1",
    });

    expect(prismaMock.favorite.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          user: { connect: { id: "user-1" } },
          request: { connect: { id: "req-1" } },
        },
      })
    );
    expect(result).toEqual(
      expect.objectContaining({
        created: true,
        favorite: expect.objectContaining({
          id: "req-1",
          requesterName: "Roman Shrestha",
          favoritedAt: new Date("2026-04-02T00:00:00.000Z"),
        }),
      })
    );
  });

  it("addFavoriteHelpRequest: returns the existing favorite when duplicate insert races", async () => {
    prismaMock.helpRequest.findUnique.mockResolvedValue({
      id: "req-1",
      status: RequestStatus.OPEN,
    });
    prismaMock.favorite.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicate", {
        code: "P2002",
        clientVersion: "test",
      })
    );
    prismaMock.favorite.findFirst.mockResolvedValue({
      id: "fav-1",
      userId: "user-1",
      requestId: "req-1",
      createdAt: new Date("2026-04-03T00:00:00.000Z"),
      request: requestRecord,
    });

    const result = await favoriteService.addFavoriteHelpRequest({
      userId: "user-1",
      requestId: "req-1",
    });

    expect(prismaMock.favorite.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user-1",
          requestId: "req-1",
        },
      })
    );
    expect(result.created).toBe(false);
  });

  it("getFavoriteHelpRequests: returns the user's favorites with pagination metadata", async () => {
    prismaMock.favorite.count.mockResolvedValue(1);
    prismaMock.favorite.findMany.mockResolvedValue([
      {
        id: "fav-1",
        userId: "user-1",
        requestId: "req-1",
        createdAt: new Date("2026-04-04T00:00:00.000Z"),
        request: requestRecord,
      },
    ]);

    const result = await favoriteService.getFavoriteHelpRequests("user-1", {
      page: "1",
      limit: "10",
      category: "FOOD",
      sortBy: "favoritedAt",
      order: "asc",
    });

    expect(prismaMock.favorite.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          request: expect.objectContaining({
            category: expect.objectContaining({
              slug: "food",
            }),
          }),
        }),
      })
    );
    expect(result).toEqual(
      expect.objectContaining({
        requests: [
          expect.objectContaining({
            id: "req-1",
            favoritedAt: new Date("2026-04-04T00:00:00.000Z"),
          }),
        ],
        meta: {
          total: 1,
          page: 1,
          totalPages: 1,
        },
      })
    );
  });

  it("getMyFavoriteRequestIds: returns request ids for the user's saved requests", async () => {
    prismaMock.favorite.findMany.mockResolvedValue([
      { requestId: "req-1" },
      { requestId: "req-2" },
    ]);

    const result = await favoriteService.getMyFavoriteRequestIds("user-1");

    expect(prismaMock.favorite.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: {
        requestId: true,
      },
    });
    expect(result).toEqual(["req-1", "req-2"]);
  });

  it("removeFavoriteHelpRequest: validates request exists and removes idempotently", async () => {
    prismaMock.helpRequest.findUnique.mockResolvedValue({
      id: "req-1",
      status: RequestStatus.OPEN,
    });
    prismaMock.favorite.deleteMany.mockResolvedValue({ count: 0 });

    const result = await favoriteService.removeFavoriteHelpRequest({
      userId: "user-1",
      requestId: "req-1",
    });

    expect(prismaMock.favorite.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        requestId: "req-1",
      },
    });
    expect(result).toEqual({ removed: false });
  });
});
