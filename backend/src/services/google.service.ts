import { OAuth2Client } from "google-auth-library";

const trimEnv = (value?: string) => value?.trim() || "";

export const getGoogleAllowedClientIds = () => {
  const values = [
    trimEnv(process.env.GOOGLE_WEB_CLIENT_ID),
    trimEnv(process.env.GOOGLE_CLIENT_ID_WEB),
    trimEnv(process.env.GOOGLE_CLIENT_ID_IOS),
    trimEnv(process.env.GOOGLE_CLIENT_ID_ANDROID),
  ].filter(Boolean);

  return [...new Set(values)];
};

export const isGoogleSignInConfigured = () => {
  return getGoogleAllowedClientIds().length > 0;
};

export const verifyGoogleIdToken = async (idToken: string) => {
  const allowedClientIds = getGoogleAllowedClientIds();

  if (allowedClientIds.length === 0) {
    throw new Error(
      "Google Sign-In is not configured. Set GOOGLE_WEB_CLIENT_ID or GOOGLE_CLIENT_ID_WEB, GOOGLE_CLIENT_ID_IOS, or GOOGLE_CLIENT_ID_ANDROID."
    );
  }

  const googleClient = new OAuth2Client();

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: allowedClientIds,
  });

  return ticket.getPayload();
};
