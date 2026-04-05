import { useState } from "react";

import {
  changePassword,
  login as loginApi,
  register as registerApi,
} from "../api/auth.api";

import { LoginDto, RegisterDto } from "../types/auth.types";
import { useAuthStore } from "../store/auth.store";

import { saveTokens, clearTokens } from "@/utils/token";

export const useAuth = () => {
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [loadingChangePassword, setLoadingChangePassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ======================
  // LOGIN (EMAIL/PASSWORD)
  // ======================
  const handleLogin = async (credentials: LoginDto) => {
    setLoadingLogin(true);
    setError(null);

    try {
      const result = await loginApi(credentials);

      if (!result.success || !result.accessToken || !result.data) {
        setError(result.message || "Login failed");
        return result;
      }

      await saveTokens(result.accessToken, result.refreshToken);

      login({
        user: result.data,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      return result;
    } catch (err) {
      setError("Login failed");
      throw err;
    } finally {
      setLoadingLogin(false);
    }
  };

  // ======================
  // REGISTER
  // ======================
  const handleRegister = async (credentials: RegisterDto) => {
    setLoadingRegister(true);
    setError(null);

    try {
      const result = await registerApi(credentials);

      if (!result.success || !result.accessToken || !result.data) {
        setError(result.message || "Registration failed");
        return result;
      }

      await saveTokens(result.accessToken, result.refreshToken);

      login({
        user: result.data,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      return result;
    } catch (err) {
      setError("Registration failed");
      throw err;
    } finally {
      setLoadingRegister(false);
    }
  };

  // ======================
  // LOGOUT
  // ======================
  const handleLogout = async () => {
    setLoadingLogout(true);

    try {
      await clearTokens();
      logout();
    } finally {
      setLoadingLogout(false);
    }
  };

  // ======================
  // CHANGE PASSWORD
  // ======================
  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    setLoadingChangePassword(true);
    setError(null);

    try {
      const result = await changePassword(currentPassword, newPassword);

      if (!result.success) {
        setError(result.message || "Password change failed");
      }

      return result;
    } finally {
      setLoadingChangePassword(false);
    }
  };

  return {
    // loading states
    loadingLogin,
    loadingLogout,
    loadingRegister,
    loadingChangePassword,

    // error
    error,

    // actions
    handleLogin,
    handleLogout,
    handleRegister,
    handleChangePassword,
  };
};