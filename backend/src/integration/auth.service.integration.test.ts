import { describe, expect, it } from "vitest";

import { prisma } from "../lib/prisma.js";
import {
  findOrCreateOAuthUser,
  linkOAuthProviderToUser,
  removeOAuthProviderFromUser,
} from "../services/auth.service.js";
import { createUser } from "./test-helpers.js";

describe("auth.service integration", () => {
  it("creates a new user, profile, and oauth account for a new Google identity", async () => {
    const user = await findOrCreateOAuthUser({
      provider: "GOOGLE",
      providerId: "google-user-1",
      email: "new-google-user@example.com",
      firstName: "New",
      lastName: "User",
      avatarUrl: "https://example.com/avatar.png",
    });

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });
    const oauth = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider: "GOOGLE",
          providerId: "google-user-1",
        },
      },
    });

    expect(user.email).toBe("new-google-user@example.com");
    expect(profile?.fullName).toBe("New User");
    expect(oauth?.userId).toBe(user.id);
  });

  it("reuses an existing linked oauth account on repeated sign-in", async () => {
    const first = await findOrCreateOAuthUser({
      provider: "GOOGLE",
      providerId: "google-linked-1",
      email: "linked-google-user@example.com",
    });

    const second = await findOrCreateOAuthUser({
      provider: "GOOGLE",
      providerId: "google-linked-1",
      email: "linked-google-user@example.com",
    });

    expect(second.id).toBe(first.id);

    const oauthCount = await prisma.oAuthAccount.count();
    expect(oauthCount).toBe(1);
  });

  it("links and removes an oauth provider for an existing user", async () => {
    const user = await createUser();

    const linked = await linkOAuthProviderToUser(user.id, {
      provider: "GOOGLE",
      providerId: "google-link-target",
      email: user.email,
    });

    expect(linked.userId).toBe(user.id);

    await removeOAuthProviderFromUser(user.id, "GOOGLE");

    const oauth = await prisma.oAuthAccount.findFirst({
      where: { userId: user.id, provider: "GOOGLE" },
    });

    expect(oauth).toBeNull();
  });
});
