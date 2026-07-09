import { describe, expect, it } from "vitest";

import type { HelpRequest } from "../types/helpRequest.types";

import {
  formatRequestBudget,
  formatRequestCreatedAt,
  formatRequestLocation,
  getRequestCategoryLabel,
} from "./requestDisplay";

const buildRequest = (overrides: Partial<HelpRequest>): HelpRequest => ({
  id: "req-1",
  title: "Need help",
  description: "Need help with groceries this evening.",
  categoryId: null,
  category: null,
  isPaid: true,
  budget: 20,
  status: "OPEN",
  requesterName: "Roman",
  createdAt: "2026-06-20T10:00:00.000Z",
  bidCount: 0,
  ...overrides,
});

describe("requestDisplay", () => {
  it("prefers category name, then known slug label, then fallback text", () => {
    expect(
      getRequestCategoryLabel(
        buildRequest({
          category: { id: "1", name: "Custom Category", slug: "errands" },
        })
      )
    ).toBe("Custom Category");

    expect(
      getRequestCategoryLabel(
        buildRequest({
          category: { id: "1", name: "", slug: "home-help" },
        })
      )
    ).toBe("Home Help");

    expect(getRequestCategoryLabel(buildRequest({}))).toBe("Uncategorized");
  });

  it("formats paid and unpaid budgets", () => {
    expect(formatRequestBudget(buildRequest({ isPaid: false }))).toBe("Unpaid");
    expect(formatRequestBudget(buildRequest({ isPaid: true, budget: undefined }))).toBe("Budget not set");
    expect(formatRequestBudget(buildRequest({ isPaid: true, budget: 19.5 }))).toBe("€19.50");
  });

  it("formats request location from location object, city-country fallback, or missing state", () => {
    expect(
      formatRequestLocation(
        buildRequest({
          location: {
            latitude: 60.17,
            longitude: 24.93,
            addressLine1: "Main Street 1",
            postalCode: "00100",
            city: "Helsinki",
          },
        })
      )
    ).toBe("Main Street 1, 00100 Helsinki");

    expect(
      formatRequestLocation(
        buildRequest({
          location: null,
          city: "Espoo",
          country: "Finland",
        })
      )
    ).toBe("Espoo, Finland");

    expect(formatRequestLocation(buildRequest({ location: null, city: null, country: null }))).toBe("Location not set");
  });

  it("formats created date using the same locale options as production code", () => {
    const value = "2026-06-20T10:00:00.000Z";

    expect(formatRequestCreatedAt(value)).toBe(
      new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    );
  });
});
