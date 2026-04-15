// auth.types.ts
// src/features/auth/auth.types.ts
import { AppLocation } from "@/features/location/types/location.types";

export interface LoginDto {
  email: string;
  password: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface VerifyEmailDto {
  token: string;
}

export interface VerifyPhoneCodeDto {
  code: string;
}

export interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  gender: string;
  location: AppLocation;
  dateOfBirth: string;

}
export interface AuthResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  data: User | null;
  message: string;
}

export interface AuthMessageResponse {
  success: boolean;
  message: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  bio?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  userType: string;
  rating: number;
  helpCount: number;
  avatarUrl?: string | null;
  searchRadiusMeters?: number | null;
  addressId?: string | null;
  address: AppLocation | null;

  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  fullName?: string;
  email: string;
  phone?: string;
  isVerified: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  profile?: UserProfile | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;

}
