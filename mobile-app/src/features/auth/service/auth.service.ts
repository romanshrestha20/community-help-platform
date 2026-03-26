// src/features/auth/auth.service.ts
import { AuthResponse, LoginDto, RegisterDto } from "../types/auth.types";
import * as authApi from "../api/auth.api";
import { saveTokens, clearTokens } from "../../../utils/token";
import { useAuthStore } from "../store/auth.store";

export const loginUser = async (credentials: LoginDto) => {
  try {
    const response: AuthResponse = await authApi.login(credentials);
    const { success, token: accessToken, data: user, message, refreshToken } = response;

    console.log("[Auth] Login response:", { success, hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken, accessToken: accessToken?.slice(0, 20) });

    if (!success || !accessToken || !user) {
      return { success: false, message: message || "Login failed" };
    }

    console.log("[Auth] Saving tokens with refresh:", !!refreshToken);
    await saveTokens(accessToken, refreshToken || "");
    useAuthStore.getState().setAuth({ user, token: accessToken });

    return { success: true, token: accessToken, user };
  } catch (error: any) {
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "An error occurred during login";

    console.error("Login error:", error);
    return { success: false, message: backendMessage };
  }

}

export const registerUser = async (credentials: RegisterDto) => {
  try {
    const response = await authApi.register(credentials) as AuthResponse;
    const { success, token: accessToken, data: user, message } = response;

    if (!success || !accessToken || !user) {
      return { success: false, message: message || "Registration failed" };
    }

    console.log("[Auth] Register success, saving tokens. Refresh token present:", !!response.refreshToken);
    await saveTokens(accessToken, response.refreshToken || "");
    useAuthStore.getState().setAuth({ user, token: accessToken });

    return { success: true, token: accessToken, user };

  } catch (error: any) {
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "An error occurred during registration";

    console.error("Registration error:", error);
    return { success: false, message: backendMessage };
  }
}
export const logoutUser = async () => {
  try {
    await clearTokens();
    useAuthStore.getState().logout();
    return { success: true };
  } catch (error: any) {
    console.error("Logout error:", error);
    return { success: false, message: "An error occurred during logout" };
  }
}

export const changePassword = async (currentPassword: string, newPassword: string) => {
  try {
    const response: AuthResponse = await authApi.changePassword(currentPassword, newPassword) as AuthResponse;

    if (response.success) {
      await clearTokens();
      useAuthStore.getState().logout();
    }
    return response;

  } catch (error: any) {
    console.error("Change password error:", error);
    return { success: false, message: "An error occurred while changing password" };

  }
}
