import { getCountries, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

const FALLBACK_PHONE_COUNTRY: CountryCode = "NP";
const supportedCountries = new Set<CountryCode>(getCountries());

const parseDefaultPhoneCountry = (): CountryCode => {
  const rawCountry = process.env.DEFAULT_PHONE_COUNTRY?.trim().toUpperCase();

  if (!rawCountry) {
    return FALLBACK_PHONE_COUNTRY;
  }

  if (supportedCountries.has(rawCountry as CountryCode)) {
    return rawCountry as CountryCode;
  }

  console.warn(
    `[phone] Unsupported DEFAULT_PHONE_COUNTRY="${rawCountry}". Falling back to ${FALLBACK_PHONE_COUNTRY}.`
  );
  return FALLBACK_PHONE_COUNTRY;
};

export const DEFAULT_PHONE_COUNTRY = parseDefaultPhoneCountry();

export const normalizePhoneNumber = (
  rawPhone: string,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY
) => {
  const trimmed = rawPhone.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);

  if (!parsed || !parsed.isValid()) {
    return null;
  }

  return parsed.number;
};

export const isValidPhoneNumberInput = (
  rawPhone: string,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY
) => {
  return normalizePhoneNumber(rawPhone, defaultCountry) !== null;
};
