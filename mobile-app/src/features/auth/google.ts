import Constants from "expo-constants";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

type ExpoConfigWithScheme = {
  expoConfig?: {
    scheme?: string | string[];
  };
};

type GoogleSignInResult =
  | {
      success: true;
      idToken: string;
    }
  | {
      success: false;
      message: string;
      cancelled?: boolean;
    };

const constants = Constants as unknown as ExpoConfigWithScheme;
const configuredScheme = constants.expoConfig?.scheme;
const appScheme = Array.isArray(configuredScheme)
  ? configuredScheme[0]
  : configuredScheme || "mobileapp";

const normalizeRedirectUri = (value: string) => value.replace(/\/+$/, "");

const getReverseClientIdScheme = (clientId?: string) => {
  if (!clientId) {
    return null;
  }

  const normalizedClientId = clientId
    .trim()
    .replace(/\.apps\.googleusercontent\.com$/, "");

  if (!normalizedClientId) {
    return null;
  }

  return `com.googleusercontent.apps.${normalizedClientId.replace(/\./g, "-")}`;
};

const resolveGoogleRedirectUri = () => {
  if (Platform.OS === "web") {
    if (process.env.EXPO_PUBLIC_GOOGLE_WEB_REDIRECT_URI) {
      return normalizeRedirectUri(process.env.EXPO_PUBLIC_GOOGLE_WEB_REDIRECT_URI);
    }

    if (typeof window !== "undefined") {
      return `${window.location.origin}/oauthredirect`;
    }
  }

  if (Platform.OS === "ios") {
    const iosScheme = getReverseClientIdScheme(
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS
    );

    if (iosScheme) {
      return AuthSession.makeRedirectUri({
        native: `${iosScheme}:/oauthredirect`,
      });
    }
  }

  if (Platform.OS === "android") {
    const androidScheme = getReverseClientIdScheme(
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID
    );

    if (androidScheme) {
      return AuthSession.makeRedirectUri({
        native: `${androidScheme}:/oauthredirect`,
      });
    }
  }

  return AuthSession.makeRedirectUri({
    scheme: appScheme,
    path: "oauthredirect",
  });
};

export function useGoogleAuth() {
  const redirectUri = resolveGoogleRedirectUri();
  const platformClientId =
    Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS
      : Platform.OS === "android"
        ? process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID
        : process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const isGoogleConfigured = Boolean(
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID && platformClientId
  );

  const [request, , promptAsync] = Google.useIdTokenAuthRequest(
    {
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      redirectUri,
      scopes: ["openid", "profile", "email"],
      selectAccount: true,
    },
    {
      scheme: appScheme,
    }
  );

  const signIn = async (): Promise<GoogleSignInResult> => {
    if (!isGoogleConfigured) {
      return {
        success: false,
        message: "Google Sign-In is not configured for this app build.",
      };
    }

    if (!request) {
      return {
        success: false,
        message: "Google Sign-In is still loading. Try again.",
      };
    }

    const result = await promptAsync({
      showInRecents: true,
    });

    if (result.type === "dismiss" || result.type === "cancel") {
      return {
        success: false,
        cancelled: true,
        message: "Google sign-in was cancelled.",
      };
    }

    if (result.type !== "success") {
      return {
        success: false,
        message: "Google sign-in could not be completed.",
      };
    }

    let idToken =
      result.params?.id_token ||
      result.authentication?.idToken ||
      null;

    if (!idToken && result.params?.code && request?.codeVerifier) {
      try {
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: platformClientId!,
            code: result.params.code,
            redirectUri,
            extraParams: {
              code_verifier: request.codeVerifier,
            },
          },
          Google.discovery
        );

        idToken = tokenResponse.idToken ?? null;
      } catch (error) {
        console.warn("Google code exchange failed:", error);
      }
    }

    if (!idToken) {
      return {
        success: false,
        message: "Google sign-in succeeded, but no ID token was returned.",
      };
    }

    return {
      success: true,
      idToken,
    };
  };

  return {
    isGoogleConfigured,
    isGoogleReady: Boolean(request) && isGoogleConfigured,
    redirectUri,
    signIn,
  };
}
