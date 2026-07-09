import { describe, expect, it, vi } from "vitest";

import {
  formatUrgentDurationLabel,
  getUrgentTimeRemainingLabel,
  isUrgentRequestActive,
} from "./urgent";

describe("urgent helpers", () => {
  it("checks whether urgent requests are active", () => {
    vi.setSystemTime(new Date("2026-06-29T12:00:00.000Z"));

    expect(isUrgentRequestActive(null)).toBe(false);
    expect(isUrgentRequestActive({ isUrgent: false, urgentExpiresAt: null })).toBe(false);
    expect(isUrgentRequestActive({ isUrgent: true, urgentExpiresAt: null })).toBe(true);
    expect(isUrgentRequestActive({ isUrgent: true, urgentExpiresAt: "2026-06-29T13:00:00.000Z" })).toBe(true);
    expect(isUrgentRequestActive({ isUrgent: true, urgentExpiresAt: "2026-06-29T11:00:00.000Z" })).toBe(false);

    vi.useRealTimers();
  });

  it("formats remaining time and duration labels", () => {
    vi.setSystemTime(new Date("2026-06-29T12:00:00.000Z"));

    expect(getUrgentTimeRemainingLabel()).toBe("No expiry");
    expect(getUrgentTimeRemainingLabel("2026-06-29T11:00:00.000Z")).toBe("Expired");
    expect(getUrgentTimeRemainingLabel("2026-06-29T12:45:00.000Z")).toBe("45m left");
    expect(getUrgentTimeRemainingLabel("2026-06-29T14:30:00.000Z")).toBe("2h 30m left");
    expect(formatUrgentDurationLabel(45)).toBe("45m");
    expect(formatUrgentDurationLabel(120)).toBe("2h");
    expect(formatUrgentDurationLabel(90)).toBe("1.5h");

    vi.useRealTimers();
  });
});
