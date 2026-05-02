import type { User } from "../types/auth.types";

export const hasRole = (user: User | null | undefined, role: string) => {
  if (!user?.role) return false;
  return user.role.toUpperCase() === role.trim().toUpperCase();
};

export const isAdminUser = (user: User | null | undefined) => {
  return hasRole(user, "ADMIN");
};

export const canAccessAdminScreen = (user: User | null | undefined) => {
  return isAdminUser(user);
};
