import { describe, expect, it, vi } from "vitest";

import type { HelpRequest } from "../types/helpRequest.types";

import {
  applyRequestFilters,
  applyRequestFiltersAndSort,
  applyRequestSort,
  type GlobalFilters,
} from "./useGlobalFilters";

const baseRequest = (overrides: Partial<HelpRequest>): HelpRequest => ({
  id: "req-1",
  title: "Need grocery pickup",
  description: "Need help collecting groceries and delivering them home.",
  categoryId: "errands-id",
  category: { id: "errands-id", name: "Errands", slug: "errands" },
  isPaid: true,
  budget: 20,
  status: "OPEN",
  requesterName: "Roman",
  createdAt: "2026-06-20T10:00:00.000Z",
  bidCount: 1,
  city: "Helsinki",
  country: "Finland",
  location: { latitude: 60.1699, longitude: 24.9384, city: "Helsinki", country: "Finland" },
  ...overrides,
});

const filters: GlobalFilters = {
  status: "ALL",
  categoryId: "ALL",
  urgentOnly: false,
  sortBy: "NEWEST",
  radiusKm: "ANY",
  page: 1,
};

describe("useGlobalFilters helpers", () => {
  it("sorts urgent requests ahead of non-urgent ones, then by configured ordering", () => {
    vi.setSystemTime(new Date("2026-06-29T12:00:00.000Z"));

    const olderUrgent = baseRequest({
      id: "urgent",
      createdAt: "2026-06-01T10:00:00.000Z",
      isUrgent: true,
      urgentExpiresAt: "2026-06-29T13:00:00.000Z",
    });
    const newestNormal = baseRequest({
      id: "new",
      createdAt: "2026-06-28T10:00:00.000Z",
      bidCount: 4,
    });
    const oldestNormal = baseRequest({
      id: "old",
      createdAt: "2026-06-10T10:00:00.000Z",
      bidCount: 8,
    });

    expect(applyRequestSort([oldestNormal, newestNormal, olderUrgent], "NEWEST").map((request) => request.id)).toEqual([
      "urgent",
      "new",
      "old",
    ]);
    expect(applyRequestSort([oldestNormal, newestNormal, olderUrgent], "OLDEST").map((request) => request.id)).toEqual([
      "urgent",
      "old",
      "new",
    ]);
    expect(applyRequestSort([oldestNormal, newestNormal, olderUrgent], "MOST_BIDS").map((request) => request.id)).toEqual([
      "urgent",
      "old",
      "new",
    ]);

    vi.useRealTimers();
  });

  it("filters by status, category, urgency, search text, and radius", () => {
    vi.setSystemTime(new Date("2026-06-29T12:00:00.000Z"));

    const matching = baseRequest({
      id: "match",
      title: "Dog walking help",
      description: "Need someone to walk my dog in downtown Helsinki.",
      categoryId: "pet-id",
      category: { id: "pet-id", name: "Pet Care", slug: "pet-care" },
      isUrgent: true,
      urgentExpiresAt: "2026-06-29T13:00:00.000Z",
      location: { latitude: 60.1699, longitude: 24.9384, city: "Helsinki", country: "Finland" },
    });

    const farAway = baseRequest({
      id: "far",
      title: "Dog sitting",
      description: "Need pet care tomorrow.",
      categoryId: "pet-id",
      category: { id: "pet-id", name: "Pet Care", slug: "pet-care" },
      isUrgent: true,
      urgentExpiresAt: "2026-06-29T13:00:00.000Z",
      location: { latitude: 61.4978, longitude: 23.761, city: "Tampere", country: "Finland" },
    });

    const wrongStatus = baseRequest({
      id: "closed",
      status: "COMPLETED",
      categoryId: "pet-id",
      category: { id: "pet-id", name: "Pet Care", slug: "pet-care" },
      title: "Dog walking help",
    });

    const result = applyRequestFilters(
      [matching, farAway, wrongStatus],
      {
        ...filters,
        status: "OPEN",
        categoryId: "pet-id",
        urgentOnly: true,
        radiusKm: "25",
      },
      {
        searchQuery: "dog",
        latitude: 60.1699,
        longitude: 24.9384,
      }
    );

    expect(result.map((request) => request.id)).toEqual(["match"]);

    vi.useRealTimers();
  });

  it("combines filtering and sorting in one pass", () => {
    vi.setSystemTime(new Date("2026-06-29T12:00:00.000Z"));

    const first = baseRequest({
      id: "first",
      bidCount: 2,
      categoryId: "same",
      category: { id: "same", name: "Errands", slug: "errands" },
    });
    const second = baseRequest({
      id: "second",
      bidCount: 5,
      categoryId: "same",
      category: { id: "same", name: "Errands", slug: "errands" },
      createdAt: "2026-06-18T10:00:00.000Z",
    });

    const result = applyRequestFiltersAndSort(
      [first, second],
      {
        ...filters,
        categoryId: "same",
        sortBy: "MOST_BIDS",
      }
    );

    expect(result.map((request) => request.id)).toEqual(["second", "first"]);

    vi.useRealTimers();
  });
});
