import axios, { AxiosRequestConfig } from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
} from "../utils/token";
import { showToast } from "../utils/toast";
import { useAuthStore } from "@/features/auth/store/auth.store";

type RetryRequest = AxiosRequestConfig & { _retry?: boolean };

const resolveApiBaseUrl = () => {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envBaseUrl) return envBaseUrl;

  if (Platform.OS === "web") {
    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    return `http://${host}:5001/api`;
  }

  const constants = Constants as unknown as {
    expoConfig?: { hostUri?: string };
    expoGoConfig?: { debuggerHost?: string };
    manifest?: { debuggerHost?: string };
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
  };

  const hostFromExpo = [
    constants.expoConfig?.hostUri,
    constants.expoGoConfig?.debuggerHost,
    constants.manifest?.debuggerHost,
    constants.manifest2?.extra?.expoClient?.hostUri,
  ]
    .find((value) => typeof value === "string" && value.length > 0)
    ?.split(":")[0];

  if (hostFromExpo) {
    return `http://${hostFromExpo}:5001/api`;
  }

  if (Platform.OS === "ios") return "http://localhost:5001/api";
  if (Platform.OS === "android") return "http://10.0.2.2:5001/api";

  return "http://localhost:5001/api";
};

const API_BASE_URL = resolveApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

console.log("[API] Base URL:", API_BASE_URL);

// ======================
// REQUEST INTERCEPTOR
// ======================
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAccessToken();

      config.headers = config.headers || {};

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const isFormData =
        typeof FormData !== "undefined" && config.data instanceof FormData;

      if (!isFormData && !config.headers["Content-Type"]) {
        config.headers["Content-Type"] = "application/json";
      }

      if (isFormData) {
        delete config.headers["Content-Type"];
      }
    } catch (error) {
      console.warn("Token read failed:", error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ======================
// REFRESH STATE
// ======================
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (err: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token as string);
  });
  failedQueue = [];
};

// ======================
// RESPONSE INTERCEPTOR
// ======================
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryRequest;

    if (originalRequest.url?.includes("/auth/refresh")) {
      await clearTokens();
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        console.log(
          "[API] Got 401, checking refresh token...",
          refreshToken ? "Found" : "NOT FOUND"
        );

        if (!refreshToken) {
          console.error("[API] Cannot refresh: no refresh token stored.");
          await clearTokens();
          useAuthStore.getState().logout();
          showToast("error", "Session expired", "Please log in again");
          return Promise.reject(new Error("No refresh token"));
        }

        console.log(
          "[API] Calling refresh endpoint with token:",
          refreshToken.slice(0, 20)
        );

        const res = await apiClient.post("/auth/refresh", {
          refreshToken,
        });

        const newAccessToken = res.data.accessToken || res.data.token;
        const newRefreshToken = res.data.refreshToken || refreshToken;

        if (!newAccessToken) {
          throw new Error("Refresh endpoint did not return an access token");
        }

        await saveTokens(newAccessToken, newRefreshToken);

        processQueue(null, newAccessToken);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);

        await clearTokens();
        useAuthStore.getState().logout();

        showToast("error", "Session expired", "Please login again");

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response) {
      const data = error.response.data;

      const message =
        data?.message ||
        data?.error?.message ||
        error.message ||
        "Something went wrong";

      showToast("error", "Error", message);
      console.error("API Error:", message);
    } else if (error.request) {
      showToast("error", "Network Error");
      console.error("Network error");
    } else {
      console.error("Request error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;