import apiClient from "../../../api/api-client";
import {
  ForgotPasswordDto,
  LoginDto,
  AuthMessageResponse,
  AuthResponse,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
  VerifyPhoneCodeDto,
} from "../types/auth.types";

const normalizeAuthResponse = (payload: any): AuthResponse => {
  const profileUser =
    payload?.userId && payload?.email
      ? {
          id: payload.userId,
          email: payload.email,
          phone: payload.phone,
          isVerified: Boolean(payload?.isVerified ?? true),
          isEmailVerified: Boolean(payload?.isEmailVerified ?? payload?.isVerified ?? true),
          isPhoneVerified: Boolean(payload?.isPhoneVerified ?? false),
          profile: payload.profile ?? null,
        }
      : null;

  const rawUser = payload?.data ?? profileUser;

  const user = rawUser
    ? {
      ...rawUser,
      fullName: rawUser.fullName || rawUser?.profile?.fullName,
      avatarUrl: rawUser.avatarUrl ?? rawUser?.profile?.avatarUrl ?? null,
    }
    : null;

  return {
    success:
      typeof payload?.success === "boolean"
        ? payload.success
        : Boolean(rawUser || payload?.status === "success"),
    accessToken: payload?.accessToken || payload?.token || "",
    refreshToken: payload?.refreshToken || "",
    data: user,
    message: payload?.message || "",
  };
};

export const login = async (credentials: LoginDto): Promise<AuthResponse> => {
  const response = await apiClient.post("/auth/login", credentials);
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
): Promise<AuthResponse> => {
  const response = await apiClient.post("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return normalizeAuthResponse(response.data);
};

export const getMe = async (): Promise<AuthResponse> => {
  const response = await apiClient.get("/auth/profile");
  return normalizeAuthResponse(response.data);
};
