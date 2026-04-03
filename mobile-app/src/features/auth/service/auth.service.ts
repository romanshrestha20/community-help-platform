import { AuthResponse, LoginDto, RegisterDto } from "../types/auth.types";
import * as authApi from "../api/auth.api";
import { saveTokens, clearTokens } from "../../../utils/token";
import { useAuthStore } from "../store/auth.store";
import { signOutGoogleNative } from "../providers/google-native.provider";

export const loginUser = async (credentials: LoginDto) => {
  try {
    const response: AuthResponse = await authApi.login(credentials);
    const {
      success,
      token: accessToken,
      data: user,
      message,
      refreshToken,
    } = response;

    if (!success || !accessToken || !user) {
      return { success: false, message: message || "Login failed" };
    }

    await saveTokens(accessToken, refreshToken || "");
    useAuthStore.getState().setAuth({
      user,
      token: accessToken,
    });

    return {
      success: true,
      token: accessToken,
      user,
    };
  } catch (error: any) {
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "An error occurred during login";

    console.error("Login error:", error);

    return {
      success: false,
      message: backendMessage,
    };
  }
};

export const registerUser = async (credentials: RegisterDto) => {
  try {
    const response = (await authApi.register(credentials)) as AuthResponse;
    const {
      success,
      token: accessToken,
      data: user,
      message,
      refreshToken,
    } = response;

    if (!success || !accessToken || !user) {
      return { success: false, message: message || "Registration failed" };
    }

    await saveTokens(accessToken, refreshToken || "");
    useAuthStore.getState().setAuth({
      user,
      token: accessToken,
    });

    return {
      success: true,
      token: accessToken,
      user,
    };
  } catch (error: any) {
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "An error occurred during registration";

    console.error("Registration error:", error);

    return {
      success: false,
      message: backendMessage,
    };
  }
};

export const logoutUser = async () => {
  try {
    await signOutGoogleNative().catch(() => null);
    await clearTokens();
    useAuthStore.getState().logout();

    return { success: true };
  } catch (error: any) {
    console.error("Logout error:", error);

    return {
      success: false,
      message: "An error occurred during logout",
    };
  }
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
) => {
  try {
    const response = (await authApi.changePassword(
      currentPassword,
      newPassword
    )) as AuthResponse;

    if (response.success) {
      await clearTokens();
      useAuthStore.getState().logout();
    }

    return response;
  } catch (error: any) {
    console.error("Change password error:", error);

    return {
      success: false,
      message: "An error occurred while changing password",
    };
  }
};