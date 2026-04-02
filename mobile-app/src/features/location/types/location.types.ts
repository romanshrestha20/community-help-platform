export type AppLocation = {
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

export type LocationSuggestion = {
  id: string;
  label: string;
  addressLine1: string | null;
  postalCode: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  formattedAddress: string | null;
};