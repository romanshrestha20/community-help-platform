import { getUserFriendlyError } from "@/utils/getUserFriendlyError";

export const mapProfileErrorMessage = (error: unknown, fallback = "Could not update profile.") => {
  return getUserFriendlyError(error, fallback);
};
