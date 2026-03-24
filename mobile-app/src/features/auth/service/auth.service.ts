// src/features/auth/auth.service.ts
import { AuthResponse, LoginDto, RegisterDto } from "../types/auth.types";
import * as authApi from "../api/auth.api";
import { saveToken, removeToken } from "../../../utils/token";
import { useAuthStore } from "../store/auth.store";


export const loginUser = async (credentials: LoginDto) => {
  try {
    const response: AuthResponse = await authApi.login(credentials);
    const { success, token, data: user, message } = response;

    if (!success || !token || !user) {
      return { success: false, message: message || "Login failed" };
    }

    await saveToken(token);
    useAuthStore.getState().setAuth({ user, token });

    return { success: true, token, user };
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
    const { success, token, data: user, message } = response;

    if (!success || !token || !user) {
      return { success: false, message: message || "Registration failed" };
    }

    await saveToken(token);
    useAuthStore.getState().setAuth({ user, token });

    return { success: true, token, user };

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
    await removeToken();
    useAuthStore.getState().logout();
    return { success: true };
  } catch (error: any) {
    console.error("Logout error:", error);
    return { success: false, message: "An error occurred during logout" };
  }

};
