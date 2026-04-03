import { useState } from "react";
import {
  changePassword,
  loginUser,
  logoutUser,
  registerUser,
} from "../service/auth.service";
import {
  googleLoginUser,
  googleLoginWithIdToken,
} from "../service/google-auth.service";
import { LoginDto, RegisterDto } from "../types/auth.types";

export const useAuth = () => {
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingGoogleLogin, setLoadingGoogleLogin] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [loadingChangePassword, setLoadingChangePassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (credentials: LoginDto) => {
    setLoadingLogin(true);
    setError(null);

    try {
      const result = await loginUser(credentials);

      if (!result.success) {
        setError(result.message || "Login failed");
      }

      return result;
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingGoogleLogin(true);
    setError(null);

    try {
      const result = await googleLoginUser();

      if (!result.success) {
        setError(result.message || "Google sign-in failed");
      }

      return result;
    } finally {
      setLoadingGoogleLogin(false);
    }
  };

  const handleGoogleWebLogin = async (idToken: string) => {
    setLoadingGoogleLogin(true);
    setError(null);

    try {
      const result = await googleLoginWithIdToken(idToken);

      if (!result.success) {
        setError(result.message || "Google sign-in failed");
      }

      return result;
    } finally {
      setLoadingGoogleLogin(false);
    }
  };

  const handleRegister = async (credentials: RegisterDto) => {
    setLoadingRegister(true);
    setError(null);

    try {
      const result = await registerUser(credentials);

      if (!result.success) {
        setError(result.message || "Registration failed");
      }

      return result;
    } finally {
      setLoadingRegister(false);
    }
  };

  const handleLogout = async () => {
    setLoadingLogout(true);

    try {
      return await logoutUser();
    } finally {
      setLoadingLogout(false);
    }
  };

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
    loadingLogin,
    loadingGoogleLogin,
    loadingLogout,
    loadingRegister,
    loadingChangePassword,
    error,
    handleLogin,
    handleGoogleLogin,
    handleGoogleWebLogin,
    handleLogout,
    handleRegister,
    handleChangePassword,
  };
};