import { describe, expect, it } from "vitest";

import { haversineDistanceKm, getReadableLocationLabel } from "./distance";

describe("location distance helpers", () => {
  it("calculates haversine distance in kilometers", () => {
    const distance = haversineDistanceKm(
      { latitude: 60.1699, longitude: 24.9384 },
      { latitude: 60.2055, longitude: 24.6559 }
    );

    expect(distance).toBeGreaterThan(15);
    expect(distance).toBeLessThan(17);
  });

  it("builds readable labels from the richest available location fields", () => {
    expect(
      getReadableLocationLabel({
        latitude: 60.17,
        longitude: 24.93,
        formattedAddress: "Main Street 1, Helsinki, Finland",
      })
    ).toBe("Main Street 1, Helsinki, Finland");

    expect(
      getReadableLocationLabel({
        latitude: 60.17,
        longitude: 24.93,
        addressLine1: "Main Street 1",
        postalCode: "00100",
        city: "Helsinki",
      })
    ).toBe("Main Street 1, 00100 Helsinki");

    expect(
      getReadableLocationLabel({
        latitude: 60.17,
        longitude: 24.93,
        state: "Uusimaa",
        country: "Finland",
      })
    ).toBe("Uusimaa, Finland");

    expect(getReadableLocationLabel(null)).toBeNull();
  });
});
