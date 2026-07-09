import { describe, expect, it } from "vitest";

import { prisma } from "../lib/prisma.js";
import {
  createEmailVerificationToken,
  createPasswordResetToken,
  createPhoneVerificationCode,
  findActiveEmailVerificationTokenByRawToken,
  findActivePasswordResetTokenByRawToken,
  findLatestActivePhoneVerificationCode,
} from "../services/auth-token.service.js";
import { createUser } from "./test-helpers.js";

describe("auth-token integration", () => {
  it("creates and resolves active password reset tokens in the real database", async () => {
    const user = await createUser();

    const first = await createPasswordResetToken(user.id);
    const second = await createPasswordResetToken(user.id);

    expect(first.rawToken).not.toBe(second.rawToken);

    const tokens = await prisma.passwordResetToken.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.tokenHash).toBe(second.tokenHash);

    const active = await findActivePasswordResetTokenByRawToken(second.rawToken);
    expect(active?.userId).toBe(user.id);
  });

  it("creates and resolves active email verification tokens", async () => {
    const user = await createUser();

    const token = await createEmailVerificationToken(user.id);
    const active = await findActiveEmailVerificationTokenByRawToken(token.rawToken);

    expect(active?.userId).toBe(user.id);
    expect(active?.tokenHash).toBe(token.tokenHash);
  });

  it("rotates phone verification codes for the same phone and returns the latest active code", async () => {
    const user = await createUser({ phone: "+15551234567" });

    const first = await createPhoneVerificationCode({
      userId: user.id,
      phone: "+15551234567",
    });
    const second = await createPhoneVerificationCode({
      userId: user.id,
      phone: "+15551234567",
    });

    expect(first.rawCode).not.toBe(second.rawCode);

    const codes = await prisma.phoneVerificationCode.findMany({
      where: { userId: user.id, phone: "+15551234567" },
    });

    expect(codes).toHaveLength(1);

    const latest = await findLatestActivePhoneVerificationCode({
      userId: user.id,
      phone: "+15551234567",
    });

    expect(latest?.codeHash).toBe(second.codeHash);
  });
});
