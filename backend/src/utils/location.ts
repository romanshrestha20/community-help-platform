export type LocationInput = {
  latitude: number;
  longitude: number;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  formattedAddress?: string | null;
};

const asNullableString = (value: unknown): string | null => {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
};

const asFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

export const isValidLocationInput = (value: unknown): value is LocationInput => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const latitude = asFiniteNumber(candidate.latitude);
  const longitude = asFiniteNumber(candidate.longitude);

  return latitude !== null && longitude !== null;
};

export const normalizeIncomingLocation = (
  body: Record<string, unknown>
): LocationInput | null => {
  const raw = body.location;

  if (!raw || typeof raw !== "object") {
    return null;
  }

  const candidate = raw as Record<string, unknown>;
  const latitude = asFiniteNumber(candidate.latitude);
  const longitude = asFiniteNumber(candidate.longitude);

  if (latitude === null || longitude === null) {
    return null;
  }

  return {
    latitude,
    longitude,
    addressLine1:
      asNullableString(candidate.addressLine1) ??
      asNullableString(candidate.street) ??
      asNullableString(candidate.address),
    addressLine2: asNullableString(candidate.addressLine2),
    city: asNullableString(candidate.city),
    state: asNullableString(candidate.state),
    postalCode: asNullableString(candidate.postalCode),
    country: asNullableString(candidate.country),
    formattedAddress: asNullableString(candidate.formattedAddress),
  };
};

export const toLocationCreateInput = (location: LocationInput) => ({
  latitude: location.latitude,
  longitude: location.longitude,
  addressLine1: location.addressLine1 ?? null,
  addressLine2: location.addressLine2 ?? null,
  city: location.city ?? null,
  state: location.state ?? null,
  postalCode: location.postalCode ?? null,
  country: location.country ?? null,
  formattedAddress: location.formattedAddress ?? null,
});

export const toLocationUpdateInput = (location: LocationInput) => ({
  latitude: location.latitude,
  longitude: location.longitude,
  addressLine1: location.addressLine1 ?? null,
  addressLine2: location.addressLine2 ?? null,
  city: location.city ?? null,
  state: location.state ?? null,
  postalCode: location.postalCode ?? null,
  country: location.country ?? null,
  formattedAddress: location.formattedAddress ?? null,
});