export const isBlank = (value: string | null | undefined) => !value || value.trim().length === 0;

export const requireValue = (value: string | null | undefined, message: string) => {
  if (isBlank(value)) {
    return message;
  }

  return null;
};

export const validateEmail = (email: string, message = "Please enter a valid email address.") => {
  const normalized = email.trim().toLowerCase();

  if (!normalized) {
    return "Email is required.";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(normalized) ? null : message;
};

export const validatePassword = (
  password: string,
  options?: {
    minLength?: number;
    requiredMessage?: string;
    minLengthMessage?: string;
  }
) => {
  const minLength = options?.minLength ?? 8;

  if (isBlank(password)) {
    return options?.requiredMessage ?? "Password is required.";
  }

  if (password.trim().length < minLength) {
    return options?.minLengthMessage ?? `Password must be at least ${minLength} characters.`;
  }

  return null;
};

export const validatePhoneNumber = (phone: string) => {
  const normalized = phone.replace(/[^\d+]/g, "");

  if (!normalized) {
    return "Phone number is required.";
  }

  const digitCount = normalized.replace(/\D/g, "").length;
  if (digitCount < 7) {
    return "Please enter a valid phone number.";
  }

  return null;
};

export const validateDateOfBirth = (dateOfBirth: string) => {
  const trimmed = dateOfBirth.trim();

  if (!trimmed) {
    return "Date of birth is required.";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return "Date of birth must be in YYYY-MM-DD format.";
  }

  const parsed = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return "Please enter a valid date of birth.";
  }

  const [year, month, day] = trimmed.split("-").map(Number);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    return "Please enter a valid date of birth.";
  }

  if (parsed >= new Date()) {
    return "Date of birth must be in the past.";
  }

  return null;
};

export const firstValidationError = (...errors: (string | null | undefined)[]) => {
  return errors.find((error) => typeof error === "string" && error.trim().length > 0) ?? null;
};
