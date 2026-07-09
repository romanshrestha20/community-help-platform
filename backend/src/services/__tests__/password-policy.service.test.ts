import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loadModule = async () => {
  vi.resetModules();
  return import("../password-policy.service.js");
};

const buildPwnedSuffix = (password: string) => {
  const hash = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
  return hash.slice(5);
};

describe("password-policy.service", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    delete process.env.PASSWORD_BREACH_CHECK_ENABLED;
    delete process.env.PASSWORD_BREACH_CHECK_ENFORCE_ON_ERROR;
    delete process.env.PASSWORD_MIN_LENGTH;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects passwords shorter than the configured minimum", async () => {
    const { assertStrongPassword } = await loadModule();

    await expect(assertStrongPassword("Short1!")).rejects.toMatchObject({
      message: "Password must be at least 12 characters long.",
      statusCode: 400,
    });
  });

  it("rejects passwords that do not meet complexity requirements", async () => {
    const { assertStrongPassword } = await loadModule();

    await expect(assertStrongPassword("alllowercase123!")).rejects.toMatchObject({
      message: "Password must include uppercase, lowercase, number, and special character.",
      statusCode: 400,
    });
  });

  it("skips breach checks when the feature is disabled", async () => {
    process.env.PASSWORD_BREACH_CHECK_ENABLED = "false";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { assertStrongPassword } = await loadModule();

    await expect(assertStrongPassword("StrongPassword123!")).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects passwords found in breach data", async () => {
    const password = "StrongPassword123!";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(`${buildPwnedSuffix(password)}:42\nOTHER:1`),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { assertStrongPassword } = await loadModule();

    await expect(assertStrongPassword(password)).rejects.toMatchObject({
      message: "This password has appeared in known breaches. Choose a different password.",
      statusCode: 400,
    });
  });

  it("fails closed when breach checks error and enforcement is enabled", async () => {
    process.env.PASSWORD_BREACH_CHECK_ENFORCE_ON_ERROR = "true";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const { assertStrongPassword } = await loadModule();

    await expect(assertStrongPassword("StrongPassword123!")).rejects.toMatchObject({
      message: "Password breach check is temporarily unavailable. Please try again.",
      statusCode: 503,
    });
  });

  it("fails open when breach checks error and enforcement is disabled", async () => {
    process.env.PASSWORD_BREACH_CHECK_ENFORCE_ON_ERROR = "false";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const { assertStrongPassword } = await loadModule();

    await expect(assertStrongPassword("StrongPassword123!")).resolves.toBeUndefined();
  });
});
