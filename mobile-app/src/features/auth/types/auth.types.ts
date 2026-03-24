// auth.types.ts
// src/features/auth/auth.types.ts

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
  latitude: number;
  longitude: number;
  address: string;
  dateOfBirth: string;

}
export interface AuthResponse {
  success: boolean;
  token: string;
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
  addressId?: string | null;
  address?: Address | null;
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

export interface Address {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  createdAt: string;
  updatedAt: string;
}