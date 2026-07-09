import { beforeEach, vi } from "vitest";

const platform = { OS: "web" };

const localStorageState = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageState.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageState.set(key, String(value));
  }),
  removeItem: vi.fn((key: string) => {
    localStorageState.delete(key);
  }),
  clear: vi.fn(() => {
    localStorageState.clear();
  }),
};

const secureStoreMock = {
  isAvailableAsync: vi.fn(async () => true),
  setItemAsync: vi.fn(async () => undefined),
  getItemAsync: vi.fn(async () => null),
  deleteItemAsync: vi.fn(async () => undefined),
};

vi.mock("react-native", () => ({
  Platform: platform,
}));

vi.mock("expo-secure-store", () => secureStoreMock);

vi.mock("react-native-country-picker-modal", () => ({
  FlagType: {
    EMOJI: "emoji",
  },
  getAllCountries: vi.fn(async () => [
    { cca2: "US", callingCode: ["1"], name: "United States" },
    { cca2: "NP", callingCode: ["977"], name: { common: "Nepal" } },
    { cca2: "FI", callingCode: ["358"], name: { common: "Finland" } },
    { cca2: "GB", callingCode: ["44"], name: { common: "United Kingdom" } },
  ]),
  getCallingCode: vi.fn(async (countryCode: string) => {
    const codes: Record<string, string> = {
      US: "1",
      NP: "977",
      FI: "358",
      GB: "44",
    };

    if (!codes[countryCode]) {
      throw new Error(`Unknown country code: ${countryCode}`);
    }

    return codes[countryCode];
  }),
}));

Object.defineProperty(globalThis, "window", {
  value: {
    localStorage: localStorageMock,
  },
  writable: true,
  configurable: true,
});

beforeEach(() => {
  platform.OS = "web";
  localStorageState.clear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  secureStoreMock.isAvailableAsync.mockReset();
  secureStoreMock.isAvailableAsync.mockResolvedValue(true);
  secureStoreMock.setItemAsync.mockReset();
  secureStoreMock.setItemAsync.mockResolvedValue(undefined);
  secureStoreMock.getItemAsync.mockReset();
  secureStoreMock.getItemAsync.mockResolvedValue(null);
  secureStoreMock.deleteItemAsync.mockReset();
  secureStoreMock.deleteItemAsync.mockResolvedValue(undefined);
});
