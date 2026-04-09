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

const MIN_AGE_YEARS = 13;

export const validateDateOfBirth = (dateOfBirth: string) => {
  const trimmed = dateOfBirth.trim();

  if (!trimmed) {
    return "Date of birth is required.";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return "Date of birth must be in YYYY-MM-DD format.";
  }

  // Parse as local date to avoid timezone issues
  const [yearStr, monthStr, dayStr] = trimmed.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // Validate that the date components form a valid calendar date
  if (month < 1 || month > 12) {
    return "Please enter a valid date of birth.";
  }

  const daysInMonth = [
    31, // January
    year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28, // February (leap year aware)
    31, // March
    30, // April
    31, // May
    30, // June
    31, // July
    31, // August
    30, // September
    31, // October
    30, // November
    31, // December
  ];

  if (day < 1 || day > daysInMonth[month - 1]) {
    return "Please enter a valid date of birth.";
  }

  // Use local date parsing to avoid timezone mismatch
  const parsed = new Date(year, month - 1, day);
  const now = new Date();

  if (parsed >= now) {
    return "Date of birth must be in the past.";
  }

  // Calculate age
  let age = now.getFullYear() - year;
  const hasHadBirthdayThisYear =
    now.getMonth() > month - 1 ||
    (now.getMonth() === month - 1 && now.getDate() >= day);

  if (!hasHadBirthdayThisYear) {
    age--;
  }

  if (age < MIN_AGE_YEARS) {
    return `You must be at least ${MIN_AGE_YEARS} years old to register.`;
  }

  return null;
};

export const firstValidationError = (...errors: (string | null | undefined)[]) => {
  return errors.find((error) => typeof error === "string" && error.trim().length > 0) ?? null;
};
