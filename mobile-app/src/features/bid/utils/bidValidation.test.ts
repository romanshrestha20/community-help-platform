import { describe, expect, it } from "vitest";

import { canMutateBid, parseBidAmountInput } from "./bidValidation";

describe("bidValidation", () => {
  it("allows bid mutation only while pending", () => {
    expect(canMutateBid("PENDING")).toBe(true);
    expect(canMutateBid("ACCEPTED")).toBe(false);
    expect(canMutateBid("REJECTED")).toBe(false);
  });

  it("re-exports bid amount parsing", () => {
    expect(parseBidAmountInput("18.5")).toEqual({ amount: 18.5 });
    expect(parseBidAmountInput("0")).toEqual({
      error: "Bid amount must be greater than 0.",
    });
  });
});
