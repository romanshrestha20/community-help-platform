import { describe, expect, it } from "vitest";

import { mapBidErrorMessage } from "./bidErrorMessage";

describe("mapBidErrorMessage", () => {
  it("maps bid-specific backend messages", () => {
    expect(mapBidErrorMessage({ message: "You cannot bid on your own request" })).toBe(
      "You cannot bid on your own request."
    );
    expect(mapBidErrorMessage({ message: "This request is no longer open for bids" })).toBe(
      "This request is no longer open."
    );
    expect(mapBidErrorMessage({ message: "duplicate bid already submitted" })).toBe(
      "You already submitted an offer for this request."
    );
  });

  it("falls back to general error mapping when no bid-specific rule matches", () => {
    expect(mapBidErrorMessage({ message: "Network request failed" })).toBe(
      "You seem to be offline. Check your connection and try again."
    );
  });
});
