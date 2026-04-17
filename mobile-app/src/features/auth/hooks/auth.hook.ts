import { useState } from "react";

import {
  addPassword,
  changePassword,
  forgotPassword,
  login as loginApi,
  loginWithGoogle as loginWithGoogleApi,
  register as registerApi,
  resendEmailVerification,
  resetPassword,
  sendEmailVerification,
  sendPhoneCode,
  verifyEmail,
  verifyPhoneCode,
} from "../api/auth.api";

import { LoginDto, RegisterDto } from "../types/auth.types";
import { useAuthStore } from "../store/auth.store";

import { saveTokens, clearTokens } from "@/utils/token";

const getErrorMessage = (error: any, fallback: string) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error?.message ||
    error?.message ||
    fallback
  );
};

export const useAuth = () => {
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);

  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [loadingGoogleLogin, setLoadingGoogleLogin] = useState(false);
  const [loadingChangePassword, setLoadingChangePassword] = useState(false);
  const [loadingAddPassword, setLoadingAddPassword] = useState(false);
  const [loadingForgotPassword, setLoadingForgotPassword] = useState(false);
  const [loadingResetPassword, setLoadingResetPassword] = useState(false);
  const [loadingSendEmailVerification, setLoadingSendEmailVerification] = useState(false);
  const [loadingVerifyEmail, setLoadingVerifyEmail] = useState(false);
  const [loadingSendPhoneCode, setLoadingSendPhoneCode] = useState(false);
  const [loadingVerifyPhoneCode, setLoadingVerifyPhoneCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ======================
  // LOGIN (EMAIL/PASSWORD)
  // ======================
  const handleLogin = async (credentials: LoginDto) => {
    setLoadingLogin(true);
    setError(null);

    try {
      const result = await loginApi(credentials);

      if (
        !result.success ||
        !result.accessToken ||
        !result.refreshToken ||
        !result.data
      ) {
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
      const message = getErrorMessage(err, "Login failed");
      setError(message);
    } finally {
      setLoadingLogin(false);
    }
  };

  const completeAuth = async (result: {
    success: boolean;
    accessToken: string;
    refreshToken: string;
    data: any;
    message: string;
  }) => {
    if (
      !result.success ||
      !result.accessToken ||
      !result.refreshToken ||
      !result.data
    ) {
      setError(result.message || "Authentication failed");
      return result;
    }

    await saveTokens(result.accessToken, result.refreshToken);

    login({
      user: result.data,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    return result;
  };

  const handleGoogleLogin = async (idToken: string) => {
    setLoadingGoogleLogin(true);
    setError(null);

    try {
      const result = await loginWithGoogleApi({ idToken });
      return await completeAuth(result);
    } catch (err) {
      const message = getErrorMessage(err, "Google sign-in failed");
      setError(message);
      return {
        success: false,
        accessToken: "",
        refreshToken: "",
        data: null,
        message,
      };
    } finally {
      setLoadingGoogleLogin(false);
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

      return await completeAuth(result);
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
    setError(null);

    try {
      await clearTokens();
    } catch {
      // If token cleanup fails, still end the local session.
    } finally {
      logout();
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
    } catch (err) {
      const message = getErrorMessage(err, "Password change failed");
      setError(message);

      return {
        success: false,
        message,
      };
    } finally {
      setLoadingChangePassword(false);
    }
  };

  const handleAddPassword = async (newPassword: string) => {
    setLoadingAddPassword(true);
    setError(null);

    try {
      const result = await addPassword(newPassword);

      if (!result.success) {
        setError(result.message || "Password setup failed");
      } else {
        useAuthStore.setState((state) => ({
          ...state,
          user: state.user
            ? {
              ...state.user,
              hasPassword: true,
            }
            : state.user,
        }));
      }

      return result;
    } catch (err) {
      const message = getErrorMessage(err, "Password setup failed");
      setError(message);
      return {
        success: false,
        message,
      };
    } finally {
      setLoadingAddPassword(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    setLoadingForgotPassword(true);
    setError(null);

    try {
      const result = await forgotPassword({ email });

      if (!result.success) {
        setError(result.message || "Unable to send reset email");
      }

      return result;
    } catch (err) {
      const message = getErrorMessage(err, "Unable to send reset email");
      setError(message);
      return {
        success: false,
        message,
      };
    } finally {
      setLoadingForgotPassword(false);
    }
  };

  const handleResetPassword = async (token: string, newPassword: string) => {
    setLoadingResetPassword(true);
    setError(null);

    try {
      const result = await resetPassword({ token, newPassword });

      if (!result.success) {
        setError(result.message || "Password reset failed");
      }

      return result;
    } catch (err) {
      const message = getErrorMessage(err, "Password reset failed");
      setError(message);
      return {
        success: false,
        message,
      };
    } finally {
      setLoadingResetPassword(false);
    }
  };

  const handleSendEmailVerification = async (mode: "send" | "resend" = "send") => {
    setLoadingSendEmailVerification(true);
    setError(null);

    try {
      const result =
        mode === "resend"
          ? await resendEmailVerification()
          : await sendEmailVerification();

      if (!result.success) {
        setError(result.message || "Unable to send verification email");
      }

      return result;
    } catch (err) {
      const message = getErrorMessage(err, "Unable to send verification email");
      setError(message);
      return {
        success: false,
        message,
      };
    } finally {
      setLoadingSendEmailVerification(false);
    }
  };

  const handleVerifyEmail = async (token: string) => {
    setLoadingVerifyEmail(true);
    setError(null);

    try {
      const result = await verifyEmail({ token });

      if (!result.success) {
        setError(result.message || "Email verification failed");
        return result;
      }

      if (result.data) {
        setUser(result.data);
      }

      return result;
    } catch (err) {
      const message = getErrorMessage(err, "Email verification failed");
      setError(message);
      return {
        success: false,
        message,
      };
    } finally {
      setLoadingVerifyEmail(false);
    }
  };

  const handleSendPhoneCode = async () => {
    setLoadingSendPhoneCode(true);
    setError(null);

    try {
      const result = await sendPhoneCode();

      if (!result.success) {
        setError(result.message || "Unable to send verification code");
      }

      return result;
    } catch (err) {
      const message = getErrorMessage(err, "Unable to send verification code");
      setError(message);
      return {
        success: false,
        message,
      };
    } finally {
      setLoadingSendPhoneCode(false);
    }
  };

  const handleVerifyPhoneCode = async (code: string) => {
    setLoadingVerifyPhoneCode(true);
    setError(null);

    try {
      const result = await verifyPhoneCode({ code });

      if (!result.success) {
        setError(result.message || "Phone verification failed");
        return result;
      }

      if (result.data) {
        setUser(result.data);
      }

      return result;
    } catch (err) {
      const message = getErrorMessage(err, "Phone verification failed");
      setError(message);
      return {
        success: false,
        message,
      };
    } finally {
      setLoadingVerifyPhoneCode(false);
    }
  };

  return {
    // loading states
    loadingLogin,
    loadingLogout,
    loadingRegister,
    loadingGoogleLogin,
    loadingChangePassword,
    loadingAddPassword,
    loadingForgotPassword,
    loadingResetPassword,
    loadingSendEmailVerification,
    loadingVerifyEmail,
    loadingSendPhoneCode,
    loadingVerifyPhoneCode,

    // error
    error,

    // actions
    handleLogin,
    handleLogout,
    handleRegister,
    handleGoogleLogin,
    handleChangePassword,
    handleAddPassword,
    handleForgotPassword,
    handleResetPassword,
    handleSendEmailVerification,
    handleVerifyEmail,
    handleSendPhoneCode,
    handleVerifyPhoneCode,
  };
};
