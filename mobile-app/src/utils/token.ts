// src/utils/token.ts

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// ======================
// KEYS
// ======================
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// ======================
// IN-MEMORY FALLBACK
// ======================
let inMemoryTokens: {
  accessToken: string | null;
  refreshToken: string | null;
} = {
  accessToken: null,
  refreshToken: null,
};

let secureStoreAvailable: boolean | null = null;

// ======================
// HELPERS
// ======================
const getWebStorage = () => {
  if (Platform.OS !== "web") return null;
  if (typeof window === "undefined") return null;
  // If web becomes a primary target, migrate token handling to secure httpOnly cookies.
  return window.localStorage;
};

const canUseSecureStore = async () => {
  if (secureStoreAvailable !== null) return secureStoreAvailable;

  try {
    secureStoreAvailable = await SecureStore.isAvailableAsync();
  } catch {
    secureStoreAvailable = false;
  }

  return secureStoreAvailable;
};

// ======================
// INTERNAL SAVE
// ======================
const saveToken = async (key: string, value: string) => {
  if (!value) return;

  // memory fallback
  if (key === ACCESS_TOKEN_KEY) inMemoryTokens.accessToken = value;
  if (key === REFRESH_TOKEN_KEY) inMemoryTokens.refreshToken = value;

  // web
  const webStorage = getWebStorage();
  if (webStorage) {
    webStorage.setItem(key, value);
    return;
  }

  // native
  if (!(await canUseSecureStore())) return;

  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // ignore, memory fallback already set
  }
};

// ======================
// INTERNAL GET
// ======================
const getToken = async (key: string): Promise<string | null> => {
  // web
  const webStorage = getWebStorage();
  if (webStorage) {
    return webStorage.getItem(key);
  }

  // native
  if (await canUseSecureStore()) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      // fallback to memory
    }
  }

  // memory fallback
  if (key === ACCESS_TOKEN_KEY) return inMemoryTokens.accessToken;
  if (key === REFRESH_TOKEN_KEY) return inMemoryTokens.refreshToken;

  return null;
};

// ======================
// INTERNAL REMOVE
// ======================
const removeToken = async (key: string) => {
  // memory
  if (key === ACCESS_TOKEN_KEY) inMemoryTokens.accessToken = null;
  if (key === REFRESH_TOKEN_KEY) inMemoryTokens.refreshToken = null;

  // web
  const webStorage = getWebStorage();
  if (webStorage) {
    webStorage.removeItem(key);
    return;
  }

  // native
  if (!(await canUseSecureStore())) return;

  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
};

// ======================
// PUBLIC API
// ======================

// Save both tokens
export const saveTokens = async (access: string, refresh: string) => {
  await Promise.all([
    saveToken(ACCESS_TOKEN_KEY, access),
    saveToken(REFRESH_TOKEN_KEY, refresh),
  ]);
};

// Get tokens
export const getAccessToken = async () => {
  return getToken(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = async () => {
  return getToken(REFRESH_TOKEN_KEY);
};

// Remove tokens (logout)
export const clearTokens = async () => {
  await Promise.all([
    removeToken(ACCESS_TOKEN_KEY),
    removeToken(REFRESH_TOKEN_KEY),
  ]);
};

// Optional: hydrate memory on app start
export const hydrateTokens = async () => {
  const [access, refresh] = await Promise.all([
    getAccessToken(),
    getRefreshToken(),
  ]);

  inMemoryTokens.accessToken = access;
  inMemoryTokens.refreshToken = refresh;
};
