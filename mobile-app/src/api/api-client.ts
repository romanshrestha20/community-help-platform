import axios, { AxiosRequestConfig } from "axios";
import { Platform } from "react-native";
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

  return "http://192.168.1.131:5001/api";
};

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ======================
// REQUEST INTERCEPTOR
// ======================
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAccessToken();

      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
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

    // prevent infinite loop on refresh endpoint
    if (originalRequest.url?.includes("/auth/refresh")) {
      await clearTokens();
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    // Skip retry logic for auth endpoints (login/register should not trigger refresh)
    const isAuthEndpoint = originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register");

    // ======================
    // HANDLE 401
    // ======================
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
        console.log("[API] Got 401, checking refresh token...", refreshToken ? "Found" : "NOT FOUND");

        if (!refreshToken) {
          console.error("[API] Cannot refresh: no refresh token stored.");
          await clearTokens();
          useAuthStore.getState().logout();
          showToast("Session expired. Please log in again.");
          return Promise.reject(new Error("No refresh token"));
        }

        console.log("[API] Calling refresh endpoint with token:", refreshToken.slice(0, 20));
        // use same base URL client
        const res = await apiClient.post("/auth/refresh", {
          refreshToken,
        });

        const newAccessToken = res.data.token;
        const newRefreshToken = res.data.refreshToken || refreshToken;

        await saveTokens(newAccessToken, newRefreshToken);

        processQueue(null, newAccessToken);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);

        await clearTokens();
        useAuthStore.getState().logout();

        showToast("Session expired. Please login again.");

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // ======================
    // OTHER ERRORS
    // ======================
    if (error.response) {
      const data = error.response.data;

      const message =
        data?.message ||
        data?.error?.message ||
        error.message ||
        "Something went wrong";

      showToast(message);
      console.error("API Error:", message);
    } else if (error.request) {
      showToast("Network error");
      console.error("Network error");
    } else {
      console.error("Request error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;