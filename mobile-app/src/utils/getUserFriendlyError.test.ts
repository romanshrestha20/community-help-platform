import { describe, expect, it } from "vitest";

import { getUserFriendlyError } from "./getUserFriendlyError";

describe("getUserFriendlyError", () => {
  it("maps common HTTP statuses to user-facing messages", () => {
    expect(getUserFriendlyError({ response: { status: 401 } })).toBe("Your session expired. Please sign in again.");
    expect(getUserFriendlyError({ response: { status: 403 } })).toBe("You do not have permission to do this.");
    expect(getUserFriendlyError({ response: { status: 404 } })).toBe("This item no longer exists.");
    expect(getUserFriendlyError({ response: { status: 422 } })).toBe("Please check the highlighted fields.");
  });

  it("maps network and internal server messages, otherwise returning the raw or fallback message", () => {
    expect(getUserFriendlyError({ message: "Network request failed" })).toBe(
      "You seem to be offline. Check your connection and try again."
    );
    expect(getUserFriendlyError({ message: "Internal Server Error" })).toBe(
      "Service is temporarily unavailable. Please try again."
    );
    expect(getUserFriendlyError({ message: "Specific failure" })).toBe("Specific failure");
    expect(getUserFriendlyError({}, "Fallback")).toBe("Fallback");
  });
});
