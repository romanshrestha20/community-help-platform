export type LoginMethod = "EMAIL_PASSWORD" | "GOOGLE";

export type SessionDeviceType =
  | "MOBILE"
  | "TABLET"
  | "DESKTOP"
  | "WEB"
  | "UNKNOWN";

export type LoginSession = {
  id: string;
  current: boolean;
  deviceName?: string | null;
  deviceType: SessionDeviceType;
  platform?: string | null;
  browser?: string | null;
  ipAddress?: string | null;
  locationLabel?: string | null;
  loginMethod: LoginMethod;
  createdAt: string;
  lastActiveAt?: string | null;
  expiresAt?: string | null;
  userAgent?: string | null;
  appVersion?: string | null;
};

export type SessionsResponse = {
  success: boolean;
  message?: string;
  data: LoginSession[];
};
