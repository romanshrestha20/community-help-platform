import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    helpRequest: {
      findMany: vi.fn(),
    },
    userModel: {
      findUnique: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

import {
  buildFilters,
  getHelpRequests,
  getNearbyHelpRequests,
} from "../helpRequest.service.js";

describe("helpRequest.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("buildFilters: requires a location relation when map coordinates are provided", () => {
    const filters = buildFilters({
      latitude: "60.1699",
      longitude: "24.9384",
      status: "OPEN",
    });

    expect(filters).toEqual(
      expect.objectContaining({
        status: "OPEN",
        location: expect.objectContaining({
          isNot: null,
        }),
      })
    );
  });

  it("getHelpRequests: returns full location data and distanceKm filtered by radius", async () => {
    prismaMock.helpRequest.findMany.mockResolvedValue([
      {
        id: "req-near",
        requesterId: "user-a",
        title: "Nearby request",
        description: "Close enough",
        categoryId: "cat-1",
        category: { id: "cat-1", name: "Medical", slug: "medical", icon: "medkit-outline" },
        budget: 20,
        isPaid: true,
        status: "OPEN",
        serviceRadiusMeters: 800,
        location: {
          id: "loc-near",
          latitude: 60.17,
          longitude: 24.94,
          addressLine1: "Near street 1",
          addressLine2: null,
          city: "Helsinki",
          state: "Uusimaa",
          postalCode: "00100",
          country: "Finland",
          formattedAddress: "Near street 1, 00100 Helsinki, Finland",
        },
        images: [],
        requester: {
          id: "user-a",
          profile: {
            fullName: "Near User",
            avatarUrl: null,
            gender: null,
            address: null,
          },
        },
        _count: { bids: 1 },
        createdAt: new Date("2026-04-18T10:00:00.000Z"),
        updatedAt: new Date("2026-04-18T10:00:00.000Z"),
      },
      {
        id: "req-far",
        requesterId: "user-b",
        title: "Far request",
        description: "Too far",
        categoryId: "cat-2",
        category: { id: "cat-2", name: "Errands", slug: "errands", icon: "basket-outline" },
        budget: null,
        isPaid: false,
        status: "OPEN",
        serviceRadiusMeters: 800,
        location: {
          id: "loc-far",
          latitude: 61.0,
          longitude: 25.5,
          addressLine1: "Far street 9",
          addressLine2: null,
          city: "Lahti",
          state: "Paijat-Hame",
          postalCode: "15100",
          country: "Finland",
          formattedAddress: "Far street 9, 15100 Lahti, Finland",
        },
        images: [],
        requester: {
          id: "user-b",
          profile: {
            fullName: "Far User",
            avatarUrl: null,
            gender: null,
            address: null,
          },
        },
        _count: { bids: 0 },
        createdAt: new Date("2026-04-18T09:00:00.000Z"),
        updatedAt: new Date("2026-04-18T09:00:00.000Z"),
      },
    ]);

    const result = await getHelpRequests({
      latitude: 60.1699,
      longitude: 24.9384,
      radiusKm: 10,
      page: 1,
      limit: 10,
      status: "OPEN",
    });

    expect(prismaMock.helpRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "OPEN",
          location: expect.objectContaining({ isNot: null }),
        }),
      })
    );

    expect(result.meta).toEqual({
      total: 1,
      page: 1,
      totalPages: 1,
    });
    expect(result.requests).toHaveLength(1);
    expect(result.requests[0]).toEqual(
      expect.objectContaining({
        id: "req-near",
        categoryId: "cat-1",
        location: expect.objectContaining({
          id: "loc-near",
          latitude: 60.17,
          longitude: 24.94,
          addressLine1: "Near street 1",
        }),
        distanceKm: expect.any(Number),
      })
    );
    expect((result.requests[0].distanceKm as number)).toBeLessThanOrEqual(10);
  });

  it("getNearbyHelpRequests: uses user profile fallback location and radius", async () => {
    prismaMock.userModel.findUnique.mockResolvedValue({
      id: "user-1",
      profile: {
        searchRadiusMeters: 5000,
        address: {
          latitude: 60.1699,
          longitude: 24.9384,
        },
      },
    });

    prismaMock.helpRequest.findMany.mockResolvedValue([
      {
        id: "req-1",
        requesterId: "user-2",
        title: "Need groceries picked up",
        description: "Nearby request",
        categoryId: "cat-1",
        category: { id: "cat-1", name: "Errands", slug: "errands", icon: "basket-outline" },
        budget: 25,
        isPaid: true,
        status: "OPEN",
        serviceRadiusMeters: 1200,
        isUrgent: false,
        urgentExpiresAt: null,
        location: {
          id: "loc-1",
          latitude: 60.17,
          longitude: 24.94,
          addressLine1: "Forum",
          addressLine2: null,
          city: "Helsinki",
          state: "Uusimaa",
          postalCode: "00100",
          country: "Finland",
          formattedAddress: "Forum, Helsinki",
        },
        images: [],
        requester: {
          id: "user-2",
          profile: {
            fullName: "Maria",
            avatarUrl: null,
            gender: null,
            address: {
              city: "Helsinki",
              state: "Uusimaa",
              country: "Finland",
              formattedAddress: "Helsinki, Finland",
            },
          },
        },
        _count: { bids: 2 },
        createdAt: new Date("2026-04-19T08:00:00.000Z"),
        updatedAt: new Date("2026-04-19T08:00:00.000Z"),
      },
    ]);

    const result = await getNearbyHelpRequests({
      userId: "user-1",
      page: 1,
      limit: 20,
    });

    expect(prismaMock.userModel.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
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
    expect(prismaMock.helpRequest.findMany).toHaveBeenCalledTimes(1);
    expect(result.meta).toEqual({
      total: 1,
      page: 1,
      totalPages: 1,
    });
    expect(result.searchMeta).toEqual({
      latitude: 60.1699,
      longitude: 24.9384,
      radiusKm: 5,
      categoryId: null,
      category: null,
      search: null,
    });
    expect(result.requests[0]).toEqual(
      expect.objectContaining({
        id: "req-1",
        requesterId: "user-2",
        categoryId: "cat-1",
        bidCount: 2,
        distanceKm: expect.any(Number),
      })
    );
  });
});
