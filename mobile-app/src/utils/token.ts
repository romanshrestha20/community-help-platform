// src/utils/token.ts
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
let inMemoryToken: string | null = null;
let secureStoreAvailable: boolean | null = null;

const getWebStorage = () => {
  if (Platform.OS !== "web") return null;
  if (typeof window === "undefined") return null;
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

export const saveToken = async (token: string) => {
  inMemoryToken = token;

  const webStorage = getWebStorage();
  if (webStorage) {
    webStorage.setItem(TOKEN_KEY, token);
    return;
  }

  if (!(await canUseSecureStore())) return;
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    // Ignore storage runtime errors and keep in-memory fallback.
  }
};

export const getToken = async () => {
  const webStorage = getWebStorage();
  if (webStorage) {
    return webStorage.getItem(TOKEN_KEY);
  }

  if (!(await canUseSecureStore())) return inMemoryToken;
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return inMemoryToken;
  }
};

export const removeToken = async () => {
  inMemoryToken = null;

  const webStorage = getWebStorage();
  if (webStorage) {
    webStorage.removeItem(TOKEN_KEY);
    return;
  }

  if (!(await canUseSecureStore())) return;
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Ignore storage runtime errors.
  }
};