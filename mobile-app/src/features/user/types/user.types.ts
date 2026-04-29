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

export enum ExperienceLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  EXPERT = "EXPERT",
}

export enum CertificationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export type VerificationBadgeLevel = "basic" | "trust" | "qualification";

export type VerificationBadgeKey =
  | "PHONE_VERIFIED"
  | "EMAIL_VERIFIED"
  | "TRUSTED_HELPER"
  | "CERTIFIED_HELPER";

export interface VerificationBadge {
  key: VerificationBadgeKey;
  label: string;
  level: VerificationBadgeLevel;
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
  countryCode?: string | null;
  formattedAddress?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  phone: string;
  hasPassword?: boolean;
  isVerified: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;

  fullName: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: Gender;
  userType: UserType;

  rating: number;
  helpCount: number;
  avatarUrl?: string | null;
  searchRadiusMeters?: number | null;
  address?: Address | null;
  skills: UserSkill[];
  certifications: UserCertification[];
  verificationBadges: VerificationBadge[];
}

export interface UserResponse {
  success: boolean;
  data: User | null;
  message?: string;
}

export interface UpdateUserProfilePayload {
  fullName?: string;
  phone?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: Gender;
  userType?: UserType;
  searchRadiusMeters?: number;
  address?: Address | null;
  skills?: UpdateUserSkillInput[];
}

export interface Skill {
  id: string;
  name: string;
  slug: string;
  categoryId?: string | null;
  isActive: boolean;
}

export interface UserSkill {
  id: string;
  skillId: string;
  experienceLevel: ExperienceLevel;
  yearsExperience?: number | null;
  isPrimary: boolean;
  createdAt?: string;
  updatedAt?: string;
  skill: Skill | null;
}

export interface UpdateUserSkillInput {
  skillId: string;
  experienceLevel: ExperienceLevel;
  yearsExperience?: number | null;
  isPrimary: boolean;
}

export interface UserCertification {
  id: string;
  userId?: string;
  profileId?: string;
  name: string;
  issuer: string;
  credentialId?: string | null;
  proofUrl?: string;
  status: CertificationStatus;
  issuedAt?: string | null;
  expiresAt?: string | null;
  reviewNote?: string | null;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  createdAt: string;
  updatedAt: string;
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
  searchRadiusMeters?: number | null;
  address?: Address | null;
  skills: UserSkill[];
  certifications: UserCertification[];
  createdAt: string;
  updatedAt: string;
}

export interface GetUserProfileApiResponse {
  userId: string;
  email: string;
  phone: string | null;
  hasPassword?: boolean;
  isVerified?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  verificationBadges?: VerificationBadge[];
  profile: UserProfile | null;
}

export interface UpdateUserProfileApiResponse {
  status: "success";
  message: string;
  phone?: string | null;
  isVerified?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  verificationBadges?: VerificationBadge[];
  profile: UserProfile;
}

export interface UploadAvatarApiResponse {
  status: "success";
  message: string;
  phone?: string | null;
  isVerified?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  verificationBadges?: VerificationBadge[];
  profile: UserProfile;
}

export interface DeleteAvatarApiResponse {
  status: "success";
  message: string;
  phone?: string | null;
  isVerified?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  verificationBadges?: VerificationBadge[];
  profile: UserProfile;
}

export interface AvatarUploadInput {
  uri: string;
  name?: string;
  type?: string;
  webFile?: File | Blob;
}

export interface CertificationUploadInput extends AvatarUploadInput {
  certificationName: string;
  issuer: string;
  credentialId?: string;
  issuedAt?: string;
  expiresAt?: string;
}
