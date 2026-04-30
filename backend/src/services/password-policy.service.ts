import AppError from "../utils/appError.js";
import crypto from "node:crypto";

const MIN_PASSWORD_LENGTH = Number(process.env.PASSWORD_MIN_LENGTH || 12);
const BREACH_CHECK_ENABLED = (process.env.PASSWORD_BREACH_CHECK_ENABLED || "true") === "true";
const BREACH_CHECK_ENFORCE_ON_ERROR =
  (process.env.PASSWORD_BREACH_CHECK_ENFORCE_ON_ERROR || "true") === "true";

const hasRequiredComplexity = (password: string) => {
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUppercase && hasLowercase && hasDigit && hasSpecial;
};

const sha1Hex = (value: string) =>
  crypto.createHash("sha1").update(value).digest("hex").toUpperCase();

const checkPasswordBreach = async (password: string) => {
  const hash = sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: {
      "Add-Padding": "true",
    },
  });

  if (!response.ok) {
    throw new Error(`HIBP request failed with status ${response.status}`);
  }

  const body = await response.text();
  const found = body
    .split("\n")
    .map((line) => line.trim().split(":")[0])
    .some((value) => value === suffix);

  return found;
};

export const assertStrongPassword = async (password: string) => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
      400
    );
  }

  if (!hasRequiredComplexity(password)) {
    throw new AppError(
      "Password must include uppercase, lowercase, number, and special character.",
      400
    );
  }

  if (!BREACH_CHECK_ENABLED) {
    return;
  }

  try {
    const isBreached = await checkPasswordBreach(password);
    if (isBreached) {
      throw new AppError("This password has appeared in known breaches. Choose a different password.", 400);
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (BREACH_CHECK_ENFORCE_ON_ERROR) {
      throw new AppError("Password breach check is temporarily unavailable. Please try again.", 503);
    }
  }
};
