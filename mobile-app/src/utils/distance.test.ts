import { describe, expect, it } from "vitest";

import { calculateDistance, formatDistance, getDistanceToRequest } from "./distance";

describe("distance utilities", () => {
  it("calculates and formats distances", () => {
    const distance = calculateDistance(60.1699, 24.9384, 60.2055, 24.6559);

    expect(distance).toBeGreaterThan(15);
    expect(distance).toBeLessThan(17);
    expect(formatDistance(0.34)).toBe("340m");
    expect(formatDistance(1.26)).toBe("1.3km");
  });

  it("formats the distance from a user to a request", () => {
    expect(getDistanceToRequest(60.1699, 24.9384, 60.1709, 24.9394)).toMatch(/m|km/);
  });
});
