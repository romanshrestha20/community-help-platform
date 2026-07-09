import { describe, expect, it } from "vitest";

import type { AppLocation } from "@/features/location/types/location.types";

import {
  parseBidAmountInput,
  parseBudgetInput,
  validateBidDraftFields,
  validateLoginFormFields,
  validateProfileUpdateFormFields,
  validateRegisterFormFields,
  validateRequestDraftFields,
  validateResetPasswordFormFields,
} from "./forms";

const validLocation: AppLocation = {
  latitude: 60.1699,
  longitude: 24.9384,
  city: "Helsinki",
  country: "Finland",
  countryCode: "FI",
  formattedAddress: "Helsinki, Finland",
};

const validPassword = "StrongPassword123!";

const makeAdultDate = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 20);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

describe("forms", () => {
  it("returns field-level login validation errors", () => {
    const result = validateLoginFormFields({
      email: "",
      password: "short",
    });

    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.email).toBe("Email is required.");
    expect(result.fieldErrors.password).toBe("Password must be at least 12 characters.");
    expect(result.formError).toBe("Email is required.");
  });

  it("validates a complete register form payload", () => {
    const result = validateRegisterFormFields({
      fullName: "Roman Shrestha",
      email: "roman@example.com",
      phone: "+358401234567",
      password: validPassword,
      dateOfBirth: makeAdultDate(),
      location: validLocation,
    });

    expect(result.isValid).toBe(true);
    expect(result.fieldErrors).toEqual({});
    expect(result.formError).toBeNull();
  });

  it("reports register form errors for missing location and weak password", () => {
    const result = validateRegisterFormFields({
      fullName: "Roman",
      email: "roman@example.com",
      phone: "+358401234567",
      password: "weak",
      dateOfBirth: makeAdultDate(),
      location: null,
    });

    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.password).toBe("Password must be at least 12 characters.");
    expect(result.fieldErrors.location).toBe("Please select your location.");
  });

  it("validates reset-password confirmation", () => {
    const result = validateResetPasswordFormFields({
      newPassword: validPassword,
      confirmPassword: "DifferentPassword123!",
    });

    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.confirmPassword).toBe("Passwords do not match.");
  });

  it("parses request budget input", () => {
    expect(parseBudgetInput("")).toEqual({ amount: undefined });
    expect(parseBudgetInput("-5")).toEqual({
      error: "Budget must be a valid number greater than 0.",
    });
    expect(parseBudgetInput("45.5")).toEqual({ amount: 45.5 });
  });

  it("validates request drafts including budget and location", () => {
    const invalidResult = validateRequestDraftFields({
      title: "Help",
      description: "Too short",
      budgetInput: "-2",
      location: null,
    });

    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.fieldErrors.title).toBe("Title must be at least 5 characters.");
    expect(invalidResult.fieldErrors.description).toBe("Description must be at least 20 characters.");
    expect(invalidResult.fieldErrors.location).toBe("Please choose a location.");
    expect(invalidResult.fieldErrors.budget).toBe("Budget must be a valid number greater than 0.");

    const validResult = validateRequestDraftFields({
      title: "Need grocery pickup",
      description: "Need help picking up groceries from the market this evening.",
      budgetInput: "30",
      location: validLocation,
    });

    expect(validResult.isValid).toBe(true);
    expect(validResult.fieldErrors).toEqual({});
  });

  it("parses and validates bid drafts for create and closed-request cases", () => {
    expect(parseBidAmountInput("")).toEqual({
      error: "Bid amount is required.",
    });
    expect(parseBidAmountInput("25")).toEqual({ amount: 25 });

    const missingRequestId = validateBidDraftFields({
      amountInput: "25",
      message: "I can help with this request today.",
      mode: "create",
    });

    expect(missingRequestId.isValid).toBe(false);
    expect(missingRequestId.fieldErrors.helpRequestId).toBe("Unable to submit bid without a request id.");

    const closedRequest = validateBidDraftFields({
      helpRequestId: "req-1",
      amountInput: "25",
      message: "I can help with this request today.",
      requestStatus: "ASSIGNED",
      mode: "create",
    });

    expect(closedRequest.isValid).toBe(false);
    expect(closedRequest.formError).toBe("Bidding is only available while a request is open.");
  });

  it("validates profile updates including optional phone, birth date, and bio limits", () => {
    const invalidResult = validateProfileUpdateFormFields({
      fullName: "A",
      phone: "123",
      dateOfBirth: "2025-02-29",
      bio: "x".repeat(281),
    });

    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.fieldErrors.fullName).toBe("Full name must be at least 2 characters.");
    expect(invalidResult.fieldErrors.phone).toBe("Please enter a valid phone number.");
    expect(invalidResult.fieldErrors.dateOfBirth).toBe("Please enter a valid date of birth.");
    expect(invalidResult.fieldErrors.bio).toBe("Bio must be 280 characters or fewer.");
  });
});
