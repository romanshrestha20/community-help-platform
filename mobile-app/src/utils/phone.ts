import {
  FlagType,
  getAllCountries,
  getCallingCode,
  type Country,
  type CountryCode,
} from "react-native-country-picker-modal";
const LEADING_PLUS_PATTERN = /^\+/;
const FALLBACK_PHONE_COUNTRY_CODE = "NP";

const PHONE_PLACEHOLDERS: Record<string, string> = {
  NP: "9800000000",
  FI: "401234567",
  US: "2025550123",
  GB: "7400123456",
  IN: "9876543210",
  AU: "412345678",
  CA: "4165550123",
  DE: "15123456789",
};

let countriesPromise: Promise<Country[]> | null = null;

export const getDefaultPhoneCountryCode = () => {
  const configuredCountry = process.env.EXPO_PUBLIC_DEFAULT_PHONE_COUNTRY?.trim().toUpperCase();
  return configuredCountry || FALLBACK_PHONE_COUNTRY_CODE;
};

export const getPhonePlaceholder = (countryCode?: string) => {
  return PHONE_PLACEHOLDERS[countryCode ?? ""] ?? PHONE_PLACEHOLDERS[getDefaultPhoneCountryCode()] ?? "401234567";
};

export const getPhoneRegionHint = (countryCode?: string, callingCode?: string | null) => {
  const normalizedCountryCode = countryCode ?? getDefaultPhoneCountryCode();
  const normalizedCallingCode = callingCode ? `+${callingCode.replace(/^\+/, "")}` : "";
  return normalizedCallingCode
    ? `Numbers are stored with ${normalizedCountryCode} (${normalizedCallingCode}) as the selected country code.`
    : `Numbers are stored with ${normalizedCountryCode} as the selected country code.`;
};

export const normalizePhoneInput = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const hasLeadingPlus = LEADING_PLUS_PATTERN.test(trimmed);
  const digitsOnly = trimmed.replace(/\D/g, "");

  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
};

export const formatPhoneNumberForDisplay = (value?: string | null) => {
  if (!value) {
    return "Not set";
  }

  return normalizePhoneInput(value) || "Not set";
};

export const combinePhoneNumber = (callingCode: string, nationalNumber: string) => {
  const normalizedNationalNumber = normalizePhoneInput(nationalNumber).replace(/^\+/, "");
  const normalizedCallingCode = callingCode.replace(/[^\d+]/g, "");

  if (!normalizedNationalNumber || !normalizedCallingCode) {
    return "";
  }

  return `${normalizedCallingCode}${normalizedNationalNumber}`;
};

const getCountriesCached = async () => {
  if (!countriesPromise) {
    countriesPromise = getAllCountries(FlagType.EMOJI, "common");
  }

  return countriesPromise;
};

export const getCallingCodeForCountry = async (countryCode?: string | null) => {
  const normalizedCountryCode = (countryCode ?? getDefaultPhoneCountryCode()).toUpperCase() as CountryCode;

  try {
    return await getCallingCode(normalizedCountryCode);
  } catch {
    return null;
  }
};

export const getCountryCodeFromLocationCountry = async (countryName?: string | null) => {
  const normalizedCountryName = countryName?.trim().toLowerCase();

  if (!normalizedCountryName) {
    return null;
  }

  const countries = await getCountriesCached();
  const matchedCountry = countries.find((country) => {
    const countryLabel =
      typeof country.name === "string" ? country.name : country.name.common;

    return countryLabel?.trim().toLowerCase() === normalizedCountryName;
  });

  return matchedCountry?.cca2 ?? null;
};

export const resolvePhoneCountryCode = async (
  countryCode?: string | null,
  countryName?: string | null
) => {
  const normalizedCountryCode = countryCode?.trim().toUpperCase();

  if (normalizedCountryCode && /^[A-Z]{2}$/.test(normalizedCountryCode)) {
    return normalizedCountryCode;
  }

  return getCountryCodeFromLocationCountry(countryName);
};

export const splitPhoneNumber = async (value?: string | null) => {
  const normalized = normalizePhoneInput(value ?? "");
  const countries = await getCountriesCached();
  const sortedCountries = [...countries].sort((left, right) => {
    const leftCallingCode = left.callingCode[0] ?? "";
    const rightCallingCode = right.callingCode[0] ?? "";
    return rightCallingCode.length - leftCallingCode.length;
  });

  const matchedCountry = sortedCountries.find((country) => {
    const callingCode = country.callingCode[0];
    return callingCode ? normalized.startsWith(`+${callingCode}`) : false;
  });

  if (matchedCountry) {
    return {
      countryCode: matchedCountry.cca2,
      callingCode: matchedCountry.callingCode[0] ?? "",
      nationalNumber: normalized.slice((matchedCountry.callingCode[0]?.length ?? 0) + 1),
    };
  }

  return {
    countryCode: getDefaultPhoneCountryCode(),
    callingCode: (await getCallingCodeForCountry(getDefaultPhoneCountryCode())) ?? "",
    nationalNumber: normalized.replace(/^\+/, ""),
  };
};
