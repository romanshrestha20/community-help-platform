import { describe, expect, it } from "vitest";

import type { User } from "../types/auth.types";

import { canAccessAdminScreen, hasRole, isAdminUser } from "./authz";

const user: User = {
  id: "user-1",
  email: "roman@example.com",
  isVerified: true,
  createdAt: "2026-06-20T10:00:00.000Z",
  updatedAt: "2026-06-20T10:00:00.000Z",
  role: "ADMIN",
};

describe("authz", () => {
  it("checks roles case-insensitively", () => {
    expect(hasRole(user, "admin")).toBe(true);
    expect(hasRole({ ...user, role: "user" }, "ADMIN")).toBe(false);
    expect(hasRole(null, "ADMIN")).toBe(false);
  });

  it("derives admin access from role", () => {
    expect(isAdminUser(user)).toBe(true);
    expect(canAccessAdminScreen(user)).toBe(true);
    expect(canAccessAdminScreen({ ...user, role: "USER" })).toBe(false);
  });
});
