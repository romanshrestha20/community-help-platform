import { describe, expect, it } from "vitest";

import { mapRequestErrorMessage } from "./requestErrorMessage";

describe("mapRequestErrorMessage", () => {
  it("normalizes common request-specific error cases", () => {
    expect(mapRequestErrorMessage("location is required")).toBe("Location is required.");
    expect(mapRequestErrorMessage("budget must be greater than 0")).toBe("Budget must be a valid amount greater than 0.");
    expect(mapRequestErrorMessage("request already completed")).toBe("You cannot edit a completed request.");
    expect(mapRequestErrorMessage("request not found")).toBe("This request no longer exists.");
    expect(mapRequestErrorMessage("Network request failed")).toBe("You seem to be offline. Check your connection and try again.");
    expect(mapRequestErrorMessage("Internal Server Error")).toBe("Request service is temporarily unavailable. Please try again.");
  });

  it("falls back when there is no specialized mapping", () => {
    expect(mapRequestErrorMessage("Custom backend message")).toBe("Custom backend message");
    expect(mapRequestErrorMessage()).toBe("Could not save request. Please try again.");
  });
});
