export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER"
}

export enum UserType {
  GENERAL = "GENERAL",
  ELDERLY = "ELDERLY",
  DISABLED = "DISABLED"
}

export interface User {
  id: string;
  email: string;
  phone: string;
  isVerified: boolean;

  // Flattened profile fields
  fullName: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: Gender;
  userType: UserType;
  rating: number;
  helpCount: number;
  address?: any;
}

export interface UserResponse {
  success: boolean;
  data: User | null;
  message?: string;
}

// Payload to update user profile
export interface UpdateUserProfilePayload {
  fullName?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: Gender;
  userType?: UserType;
  rating?: number;
  helpCount?: number;
  address?: any;
}

// API nested profile shape (optional, if needed)
export interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  bio?: string | null;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  userType: UserType;
  rating: number;
  helpCount: number;
  address?: any | null;
  createdAt: string;
  updatedAt: string;
}