import { beforeEach, describe, expect, it, vi } from "vitest";

const resetPhoneModule = async () => {
  vi.resetModules();
  return import("../phone.js");
};

describe("phone utils", () => {
  const originalDefaultPhoneCountry = process.env.DEFAULT_PHONE_COUNTRY;

  beforeEach(() => {
    vi.resetModules();

    if (originalDefaultPhoneCountry === undefined) {
      delete process.env.DEFAULT_PHONE_COUNTRY;
    } else {
      process.env.DEFAULT_PHONE_COUNTRY = originalDefaultPhoneCountry;
    }
  });

  it("uses NP as the fallback default phone country", async () => {
    delete process.env.DEFAULT_PHONE_COUNTRY;

    const phone = await resetPhoneModule();

    expect(phone.DEFAULT_PHONE_COUNTRY).toBe("NP");
    expect(phone.normalizePhoneNumber("9800000000")).toBe("+9779800000000");
  });

  it("uses DEFAULT_PHONE_COUNTRY from the environment when valid", async () => {
    process.env.DEFAULT_PHONE_COUNTRY = "FI";

    const phone = await resetPhoneModule();

    expect(phone.DEFAULT_PHONE_COUNTRY).toBe("FI");
    expect(phone.normalizePhoneNumber("040 123 4567")).toBe("+358401234567");
  });

  it("falls back when DEFAULT_PHONE_COUNTRY is unsupported", async () => {
    process.env.DEFAULT_PHONE_COUNTRY = "XX";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const phone = await resetPhoneModule();

    expect(phone.DEFAULT_PHONE_COUNTRY).toBe("NP");
    expect(warnSpy).toHaveBeenCalledWith(
      '[phone] Unsupported DEFAULT_PHONE_COUNTRY="XX". Falling back to NP.'
    );

    warnSpy.mockRestore();
  });
});
