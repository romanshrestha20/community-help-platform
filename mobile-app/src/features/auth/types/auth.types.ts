// auth.types.ts
// src/features/auth/auth.types.ts
import { AppLocation } from "@/features/location/types/location.types";

export interface LoginDto {
  email: string;
  password: string;
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
  profile?: UserProfile | null;
}