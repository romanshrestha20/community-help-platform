export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export enum UserType {
  GENERAL = "GENERAL",
  ELDERLY = "ELDERLY",
  DISABLED = "DISABLED",
}

export interface Address {
  id?: string;
  latitude: number;
  longitude: number;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  formattedAddress?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  phone: string;
  isVerified: boolean;

  fullName: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: Gender;
  userType: UserType;

  rating: number;
  helpCount: number;
  avatarUrl?: string | null;
  address?: Address | null;
}

export interface UserResponse {
  success: boolean;
  data: User | null;
  message?: string;
}

export interface UpdateUserProfilePayload {
  fullName?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: Gender;
  userType?: UserType;
  address?: Address | null;
}

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
  avatarUrl?: string | null;
  address?: Address | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetUserProfileApiResponse {
  userId: string;
  email: string;
  phone: string | null;
  profile: UserProfile | null;
}

export interface UpdateUserProfileApiResponse {
  status: "success";
  message: string;
  profile: UserProfile;
}

export interface UploadAvatarApiResponse {
  status: "success";
  message: string;
  profile: UserProfile;
}

export interface DeleteAvatarApiResponse {
  status: "success";
  message: string;
  profile: UserProfile;
}

export interface AvatarUploadInput {
  uri: string;
  name?: string;
  type?: string;
}