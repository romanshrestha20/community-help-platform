import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface GoogleUserPayload {
  providerId: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  image?: string;
  emailVerified: boolean;
}

export const verifyGoogleToken = async (
  token: string
): Promise<GoogleUserPayload> => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error("Invalid Google token");
  }

  if (!payload.sub) {
    throw new Error("Google token is missing provider ID");
  }

  if (!payload.email) {
    throw new Error("Google account email is missing");
  }

  return {
    providerId: payload.sub,
    email: payload.email,
    fullName:
      payload.name?.trim() ||
      [payload.given_name, payload.family_name].filter(Boolean).join(" ").trim(),
    firstName: payload.given_name || "",
    lastName: payload.family_name || "",
    image: payload.picture || undefined,
    emailVerified: !!payload.email_verified,
  };
};