import { describe, expect, it } from "vitest";

import {
  firstValidationError,
  isBlank,
  requireValue,
  validateDateOfBirth,
  validateEmail,
  validatePassword,
  validatePhoneNumber,
} from "./validators";

const toDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

describe("validators", () => {
  it("detects blank values and required fields", () => {
    expect(isBlank("")).toBe(true);
    expect(isBlank("   ")).toBe(true);
    expect(isBlank("value")).toBe(false);
    expect(requireValue(" ", "Required")).toBe("Required");
    expect(requireValue("ok", "Required")).toBeNull();
  });

  it("validates email addresses", () => {
    expect(validateEmail("person@example.com")).toBeNull();
    expect(validateEmail("")).toBe("Email is required.");
    expect(validateEmail("not-an-email")).toBe("Please enter a valid email address.");
  });

  it("validates passwords with default and custom length requirements", () => {
    expect(validatePassword("")).toBe("Password is required.");
    expect(validatePassword("short")).toBe("Password must be at least 8 characters.");
    expect(validatePassword("long-enough", { minLength: 12 })).toBe("Password must be at least 12 characters.");
    expect(validatePassword("long-enough-password")).toBeNull();
  });

  it("validates phone numbers after normalization", () => {
    expect(validatePhoneNumber(" +358 40 123 4567 ")).toBeNull();
    expect(validatePhoneNumber("")).toBe("Phone number is required.");
    expect(validatePhoneNumber("123")).toBe("Please enter a valid phone number.");
  });

  it("validates date of birth format, age, and calendar correctness", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const underage = new Date();
    underage.setFullYear(underage.getFullYear() - 10);

    const adult = new Date();
    adult.setFullYear(adult.getFullYear() - 20);

    expect(validateDateOfBirth("")).toBe("Date of birth is required.");
    expect(validateDateOfBirth("01-01-2010")).toBe("Date of birth must be in YYYY-MM-DD format.");
    expect(validateDateOfBirth("2025-02-29")).toBe("Please enter a valid date of birth.");
    expect(validateDateOfBirth(toDateString(tomorrow))).toBe("Date of birth must be in the past.");
    expect(validateDateOfBirth(toDateString(underage))).toBe("You must be at least 13 years old to register.");
    expect(validateDateOfBirth(toDateString(adult))).toBeNull();
  });

  it("returns the first non-empty validation error", () => {
    expect(firstValidationError(undefined, null, "", "First", "Second")).toBe("First");
    expect(firstValidationError(undefined, null, "")).toBeNull();
  });
});
