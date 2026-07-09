import { describe, expect, it } from "vitest";

import type { GlobalFilters } from "./useGlobalFilters";

import { buildRequestSearchParams } from "./useRequestSearch";

const filters: GlobalFilters = {
  status: "ALL",
  categoryId: "ALL",
  urgentOnly: false,
  sortBy: "NEWEST",
  radiusKm: "ANY",
  page: 1,
};

describe("buildRequestSearchParams", () => {
  it("omits default filters and trims search text", () => {
    expect(buildRequestSearchParams(filters, "  grocery  ")).toEqual({
      search: "grocery",
      categoryId: undefined,
      status: undefined,
      radiusKm: undefined,
      latitude: undefined,
      longitude: undefined,
    });
  });

  it("includes category, status, and radius only when coordinates are valid", () => {
    expect(
      buildRequestSearchParams(
        {
          ...filters,
          categoryId: "errands-id",
          status: "OPEN",
          radiusKm: "25",
        },
        "",
        { latitude: 60.17, longitude: 24.93 }
      )
    ).toEqual({
      search: undefined,
      categoryId: "errands-id",
      status: "OPEN",
      radiusKm: 25,
      latitude: 60.17,
      longitude: 24.93,
    });
  });

  it("drops radius when coordinates are invalid", () => {
    expect(
      buildRequestSearchParams(
        {
          ...filters,
          radiusKm: "10",
        },
        "dog",
        { latitude: Number.NaN, longitude: 24.93 }
      )
    ).toEqual({
      search: "dog",
      categoryId: undefined,
      status: undefined,
      radiusKm: undefined,
      latitude: undefined,
      longitude: undefined,
    });
  });
});
