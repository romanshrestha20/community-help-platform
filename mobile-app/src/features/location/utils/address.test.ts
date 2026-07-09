import { describe, expect, it } from "vitest";

import { formatCompactAddress, shortenPlainAddress } from "./address";

describe("address helpers", () => {
  it("formats compact addresses using street, postal code, and city when available", () => {
    expect(
      formatCompactAddress({
        addressLine1: "2 Jalsitie",
        addressLine2: "Apt 4",
        postalCode: "00100",
        city: "Helsinki",
      })
    ).toBe("Jalsitie 2 Apt 4, 00100, Helsinki");
  });

  it("falls back through region parts, formatted address, and default fallback", () => {
    expect(formatCompactAddress({ state: "Uusimaa", country: "Finland" })).toBe("Uusimaa, Finland");
    expect(
      formatCompactAddress({ formattedAddress: "Main Street 1, Helsinki, Finland" })
    ).toBe("Main Street 1");
    expect(formatCompactAddress(undefined, "Unknown")).toBe("Unknown");
  });

  it("shortens plain addresses to at most two segments", () => {
    expect(shortenPlainAddress("Main Street 1, Helsinki, Finland")).toBe("Main Street 1, Helsinki");
    expect(shortenPlainAddress("Helsinki")).toBe("Helsinki");
    expect(shortenPlainAddress(undefined, "Unknown")).toBe("Unknown");
  });
});
