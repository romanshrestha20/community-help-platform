import type { AuthResponse, LoginDto, RegisterDto } from "../types/auth.types";
import * as authApi from "../api/auth.api";
import { saveTokens, clearTokens } from "../../../utils/token";
import { useAuthStore } from "../store/auth.store";

type AuthSuccessResult = {
  success: true;
  accessToken?: string;
  user?: NonNullable<AuthResponse["data"]>;
  message?: string;
};

type AuthFailureResult = {
  success: false;
  message: string;
};

type AuthActionResult = AuthSuccessResult | AuthFailureResult | AuthResponse;

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message ||
  error?.response?.data?.error?.message ||
  error?.message ||
  fallback;

const persistAuthSession = async (
  accessToken: string,
  refreshToken: string,
  user: NonNullable<AuthResponse["data"]>
): Promise<AuthSuccessResult> => {
  await saveTokens(accessToken, refreshToken);

  useAuthStore.getState().login({
    user,
    accessToken,
    refreshToken,
  });

  return {
    success: true,
    accessToken,
    user,
  };
};

export const loginUser = async (
  credentials: LoginDto
): Promise<AuthActionResult> => {
  try {
    const response: AuthResponse = await authApi.login(credentials);

    const { success, accessToken, data: user, message, refreshToken } = response;

    if (!success || !accessToken || !refreshToken || !user) {
      return {
        success: false,
        message: message || "Login failed",
      };
    }

    return await persistAuthSession(accessToken, refreshToken, user);
  } catch (error: any) {
    console.error("Login error:", error);

    return {
      success: false,
      message: getErrorMessage(error, "An error occurred during login"),
    };
  }
};

export const registerUser = async (
  credentials: RegisterDto
): Promise<AuthActionResult> => {
  try {
    const response: AuthResponse = await authApi.register(credentials);

    const { success, accessToken, data: user, message, refreshToken } = response;

    if (!success || !accessToken || !refreshToken || !user) {
      return {
        success: false,
        message: message || "Registration failed",
      };
    }

    return await persistAuthSession(accessToken, refreshToken, user);
  } catch (error: any) {
    console.error("Registration error:", error);

    return {
      success: false,
      message: getErrorMessage(error, "An error occurred during registration"),
    };
  }
};

export const logoutUser = async (): Promise<AuthActionResult> => {
  try {
    await clearTokens();
    useAuthStore.getState().logout();

    return {
      success: true,
      message: "Logged out successfully",
    };
  } catch (error: any) {
    console.error("Logout error:", error);

    return {
      success: false,
      message: getErrorMessage(error, "An error occurred during logout"),
    };
  }
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<AuthActionResult> => {
  try {
    const response: AuthResponse = await authApi.changePassword(
      currentPassword,
      newPassword
    );

    if (response.success) {
      await clearTokens();
      useAuthStore.getState().logout();
    }

    return response;
  } catch (error: any) {
    console.error("Change password error:", error);

    return {
      success: false,
      message: getErrorMessage(
        error,
        "An error occurred while changing password"
      ),
    };
  }
};