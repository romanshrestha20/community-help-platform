import { afterEach, describe, expect, it } from "vitest";

import {
  combinePhoneNumber,
  formatPhoneNumberForDisplay,
  getCallingCodeForCountry,
  getCountryCodeFromLocationCountry,
  getDefaultPhoneCountryCode,
  getPhonePlaceholder,
  getPhoneRegionHint,
  normalizePhoneInput,
  resolvePhoneCountryCode,
  splitPhoneNumber,
} from "./phone";

describe("phone utilities", () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_DEFAULT_PHONE_COUNTRY;
  });

  it("uses the configured default country code or falls back to Nepal", () => {
    expect(getDefaultPhoneCountryCode()).toBe("NP");

    process.env.EXPO_PUBLIC_DEFAULT_PHONE_COUNTRY = " fi ";
    expect(getDefaultPhoneCountryCode()).toBe("FI");
  });

  it("returns placeholders and region hints from the selected country", () => {
    process.env.EXPO_PUBLIC_DEFAULT_PHONE_COUNTRY = "US";

    expect(getPhonePlaceholder("FI")).toBe("401234567");
    expect(getPhonePlaceholder()).toBe("2025550123");
    expect(getPhoneRegionHint("FI", "358")).toBe(
      "Numbers are stored with FI (+358) as the selected country code."
    );
    expect(getPhoneRegionHint("FI", null)).toBe(
      "Numbers are stored with FI as the selected country code."
    );
  });

  it("normalizes, formats, and combines phone number values", () => {
    expect(normalizePhoneInput(" +358 40 123 4567 ")).toBe("+358401234567");
    expect(normalizePhoneInput("(040) 123-4567")).toBe("0401234567");
    expect(formatPhoneNumberForDisplay(null)).toBe("Not set");
    expect(formatPhoneNumberForDisplay(" +358 40 123 4567 ")).toBe("+358401234567");
    expect(combinePhoneNumber("+358", "040 123 4567")).toBe("+3580401234567");
    expect(combinePhoneNumber("", "0401234567")).toBe("");
  });

  it("resolves country calling codes and country names through the picker data", async () => {
    await expect(getCallingCodeForCountry("FI")).resolves.toBe("358");
    await expect(getCallingCodeForCountry("ZZ")).resolves.toBeNull();
    await expect(getCountryCodeFromLocationCountry("Finland")).resolves.toBe("FI");
    await expect(getCountryCodeFromLocationCountry("Unknownland")).resolves.toBeNull();
  });

  it("prefers explicit country codes and otherwise derives them from location names", async () => {
    await expect(resolvePhoneCountryCode("fi", "Nepal")).resolves.toBe("FI");
    await expect(resolvePhoneCountryCode(undefined, "Nepal")).resolves.toBe("NP");
  });

  it("splits international numbers using the longest matching calling code and falls back when needed", async () => {
    process.env.EXPO_PUBLIC_DEFAULT_PHONE_COUNTRY = "FI";

    await expect(splitPhoneNumber("+9779800000000")).resolves.toEqual({
      countryCode: "NP",
      callingCode: "977",
      nationalNumber: "9800000000",
    });

    await expect(splitPhoneNumber("0401234567")).resolves.toEqual({
      countryCode: "FI",
      callingCode: "358",
      nationalNumber: "0401234567",
    });
  });
});
