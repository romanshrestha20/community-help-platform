import { describe, expect, it, vi } from "vitest";

import { getRelativePostedTime } from "./requestTime";

describe("getRelativePostedTime", () => {
  it("formats very recent, minute, hour, day, and older timestamps", () => {
    vi.setSystemTime(new Date("2026-06-29T12:00:00.000Z"));

    expect(getRelativePostedTime("2026-06-29T11:59:45.000Z")).toBe("Posted just now");
    expect(getRelativePostedTime("2026-06-29T11:30:00.000Z")).toBe("Posted 30m ago");
    expect(getRelativePostedTime("2026-06-29T09:00:00.000Z")).toBe("Posted 3h ago");
    expect(getRelativePostedTime("2026-06-27T12:00:00.000Z")).toBe("Posted 2d ago");

    const older = "2026-06-01T12:00:00.000Z";
    expect(getRelativePostedTime(older)).toBe(
      `Posted on ${new Date(older).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`
    );

    vi.useRealTimers();
  });
});
