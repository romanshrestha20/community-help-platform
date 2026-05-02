import apiClient from "../../../api/api-client";
import {
  ForgotPasswordDto,
  GoogleLoginDto,
  LoginDto,
  AuthMessageResponse,
  AuthResponse,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
  VerifyPhoneCodeDto,
} from "../types/auth.types";

const normalizeAuthResponse = (payload: any): AuthResponse => {
  const nested = payload?.data;

  const userRaw =
    nested?.user || // NEW STRUCTURE
    nested ||       // fallback
    (payload?.userId && payload?.email
      ? {
        id: payload.userId,
        email: payload.email,
        phone: payload.phone,
        isVerified: Boolean(payload?.isVerified ?? true),
        isEmailVerified: Boolean(payload?.isEmailVerified ?? payload?.isVerified ?? true),
        isPhoneVerified: Boolean(payload?.isPhoneVerified ?? false),
        profile: payload.profile ?? null,
      }
      : null);

  const user = userRaw
    ? {
      ...userRaw,
      role: typeof userRaw.role === "string" ? userRaw.role : undefined,
      hasPassword: userRaw.hasPassword === true,
      isVerified: Boolean(userRaw.isVerified ?? false),
      isEmailVerified: Boolean(userRaw.isEmailVerified ?? userRaw.isVerified ?? false),
      isPhoneVerified: Boolean(userRaw.isPhoneVerified ?? false),
      fullName: userRaw.fullName || userRaw?.profile?.fullName,
      avatarUrl: userRaw.avatarUrl ?? userRaw?.profile?.avatarUrl ?? null,
    }
    : null;

  return {
    success:
      typeof payload?.success === "boolean"
        ? payload.success
        : Boolean(user),

    // ✅ FIX: support nested tokens
    accessToken:
      nested?.accessToken ||
      payload?.accessToken ||
      payload?.token ||
      "",

    refreshToken:
      nested?.refreshToken ||
      payload?.refreshToken ||
      "",

    data: user,
    message: payload?.message || "",
  };
};

export const login = async (credentials: LoginDto): Promise<AuthResponse> => {
  const response = await apiClient.post("/auth/login", credentials);
  return normalizeAuthResponse(response.data);
};

export const loginWithGoogle = async (
  payload: GoogleLoginDto
): Promise<AuthResponse> => {
  const response = await apiClient.post("/auth/google", payload);
  return normalizeAuthResponse(response.data);
};

export const register = async (
  credentials: RegisterDto
): Promise<AuthResponse> => {
  const response = await apiClient.post("/auth/register", credentials);
  return normalizeAuthResponse(response.data);
};

export const forgotPassword = async (
  payload: ForgotPasswordDto
): Promise<AuthMessageResponse> => {
  const response = await apiClient.post("/auth/forgot-password", payload);
  return {
    success: Boolean(response.data?.success),
    message: response.data?.message || "",
  };
};

export const resetPassword = async (
  payload: ResetPasswordDto
): Promise<AuthMessageResponse> => {
  const response = await apiClient.post("/auth/reset-password", payload);
  return {
    success: Boolean(response.data?.success),
    message: response.data?.message || "",
  };
};

export const sendEmailVerification = async (): Promise<AuthMessageResponse> => {
  const response = await apiClient.post("/auth/send-email-verification");
  return {
    success: Boolean(response.data?.success),
    message: response.data?.message || "",
  };
};

export const resendEmailVerification = async (): Promise<AuthMessageResponse> => {
  const response = await apiClient.post("/auth/resend-email-verification");
  return {
    success: Boolean(response.data?.success),
    message: response.data?.message || "",
  };
};

export const verifyEmail = async (
  payload: VerifyEmailDto
): Promise<AuthResponse> => {
  const response = await apiClient.post("/auth/verify-email", payload);
  return normalizeAuthResponse(response.data);
};

export const sendPhoneCode = async (): Promise<AuthMessageResponse> => {
  const response = await apiClient.post("/auth/send-phone-code");
  return {
    success: Boolean(response.data?.success),
    message: response.data?.message || "",
  };
};

export const verifyPhoneCode = async (
  payload: VerifyPhoneCodeDto
): Promise<AuthResponse> => {
  const response = await apiClient.post("/auth/verify-phone-code", payload);
  return normalizeAuthResponse(response.data);
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<AuthMessageResponse> => {
  const response = await apiClient.post("/auth/change-password", {
    currentPassword,
    newPassword,
  });

  return {
    success: Boolean(response.data?.success),
    message: response.data?.message || "",
  };
};

export const logout = async (refreshToken: string): Promise<AuthMessageResponse> => {
  const response = await apiClient.post("/auth/logout", { refreshToken });
  return {
    success: Boolean(response.data?.success),
    message: response.data?.message || "",
  };
};

export const logoutAll = async (): Promise<AuthMessageResponse> => {
  const response = await apiClient.post("/auth/logout-all");
  return {
    success: Boolean(response.data?.success),
    message: response.data?.message || "",
  };
};

export const addPassword = async (
  newPassword: string
): Promise<AuthMessageResponse> => {
  const response = await apiClient.post("/auth/add-password", {
    newPassword,
  });
  return {
    success: Boolean(response.data?.success),
    message: response.data?.message || "",
  };
};

export const getMe = async (): Promise<AuthResponse> => {
  const response = await apiClient.get("/auth/profile");
  return normalizeAuthResponse(response.data);
};
