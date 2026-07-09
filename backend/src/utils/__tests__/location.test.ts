import { describe, expect, it } from "vitest";

import {
  isValidLocationInput,
  normalizeIncomingLocation,
  toLocationCreateInput,
  toLocationUpdateInput,
} from "../location.js";

describe("location utils", () => {
  it("validates location inputs with finite latitude and longitude", () => {
    expect(isValidLocationInput({ latitude: 60.17, longitude: 24.93 })).toBe(true);
    expect(isValidLocationInput({ latitude: "60.17", longitude: 24.93 })).toBe(true);
    expect(isValidLocationInput({ latitude: null, longitude: 24.93 })).toBe(false);
  });

  it("normalizes object and JSON-string location payloads", () => {
    expect(
      normalizeIncomingLocation({
        location: {
          latitude: "60.17",
          longitude: "24.93",
          street: "Main Street 1",
          city: "Helsinki",
          country: "Finland",
        },
      })
    ).toEqual({
      latitude: 60.17,
      longitude: 24.93,
      addressLine1: "Main Street 1",
      addressLine2: null,
      city: "Helsinki",
      state: null,
      postalCode: null,
      country: "Finland",
      formattedAddress: null,
    });

    expect(
      normalizeIncomingLocation({
        location: JSON.stringify({
          latitude: 60.18,
          longitude: 24.94,
          address: "Second Street 2",
          postalCode: "00100",
        }),
      })
    ).toEqual({
      latitude: 60.18,
      longitude: 24.94,
      addressLine1: "Second Street 2",
      addressLine2: null,
      city: null,
      state: null,
      postalCode: "00100",
      country: null,
      formattedAddress: null,
    });
  });

  it("returns null for malformed or incomplete location payloads", () => {
    expect(normalizeIncomingLocation({ location: "{not-json" })).toBeNull();
    expect(normalizeIncomingLocation({ location: { latitude: 60.17 } })).toBeNull();
    expect(normalizeIncomingLocation({})).toBeNull();
  });

  it("maps normalized locations to Prisma create/update shapes", () => {
    const location = {
      latitude: 60.17,
      longitude: 24.93,
      addressLine1: "Main Street 1",
      addressLine2: null,
      city: "Helsinki",
      state: null,
      postalCode: "00100",
      country: "Finland",
      formattedAddress: null,
    };

    expect(toLocationCreateInput(location)).toEqual(location);
    expect(toLocationUpdateInput(location)).toEqual(location);
  });
});
