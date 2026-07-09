import { describe, expect, it } from "vitest";

import {
  canDeleteRequest,
  canTransitionRequestStatus,
  isRequestOpenForBidding,
  parseBudgetInput,
} from "./requestValidation";

describe("requestValidation", () => {
  it("allows only supported request status transitions", () => {
    expect(canTransitionRequestStatus("OPEN", "ASSIGNED")).toBe(true);
    expect(canTransitionRequestStatus("OPEN", "CANCELLED")).toBe(true);
    expect(canTransitionRequestStatus("ASSIGNED", "COMPLETED")).toBe(true);
    expect(canTransitionRequestStatus("ASSIGNED", "OPEN")).toBe(false);
    expect(canTransitionRequestStatus("COMPLETED", "CANCELLED")).toBe(false);
    expect(canTransitionRequestStatus("OPEN", "OPEN")).toBe(false);
  });

  it("allows deletion only for open or cancelled requests", () => {
    expect(canDeleteRequest("OPEN")).toBe(true);
    expect(canDeleteRequest("CANCELLED")).toBe(true);
    expect(canDeleteRequest("ASSIGNED")).toBe(false);
    expect(canDeleteRequest("COMPLETED")).toBe(false);
  });

  it("marks only open requests as available for bidding", () => {
    expect(isRequestOpenForBidding("OPEN")).toBe(true);
    expect(isRequestOpenForBidding("ASSIGNED")).toBe(false);
  });

  it("re-exports request budget parsing", () => {
    expect(parseBudgetInput("22")).toEqual({ amount: 22 });
  });
});
