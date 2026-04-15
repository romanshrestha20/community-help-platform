import crypto from "node:crypto";

export const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString("hex");
};

export const generateNumericOtp = (length = 6) => {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;

  return crypto.randomInt(min, max + 1).toString();
};

export const hashToken = (value: string) => {
  return crypto.createHash("sha256").update(value).digest("hex");
};

export const expiresFromNow = ({
  minutes,
  hours,
}: {
  minutes?: number;
  hours?: number;
}) => {
  const expiresAt = new Date();

  if (typeof minutes === "number") {
    expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
  }

  if (typeof hours === "number") {
    expiresAt.setHours(expiresAt.getHours() + hours);
  }

  return expiresAt;
};
