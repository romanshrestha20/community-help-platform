import React, { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import {
  AuthActions,
  AuthBanner,
  AuthCard,
  AuthDivider,
  AuthFooterLink,
  AuthHero,
  AuthScreen,
} from "@/features/auth/components";
import { useGoogleAuth } from "@/features/auth/google";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { APP_ROUTES } from "@/config/routes";
import { validatePasswordConfirmation } from "@/features/auth/utils/authValidation";
import { useFormValidation } from "@/utils/validation/useFormValidation";

export default function RegisterScreen() {
  const router = useRouter();
  const { handleRegister, handleGoogleLogin, loadingRegister, loadingGoogleLogin, error } = useAuth();
  const { isGoogleConfigured, signIn } = useGoogleAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const {
    validationError,
    setValidationError,
    fieldErrors,
    setFieldErrors,
    clearFieldError,
    clearValidationError,
  } = useFormValidation<"email" | "password" | "confirmPassword">();

  const isBusy = loadingRegister || loadingGoogleLogin;
  const displayError = validationError || error;

  const handleEmailRegister = async () => {
    if (!email.trim()) {
      setFieldErrors({ email: "Email is required." });
      setValidationError("Email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldErrors({ email: "Please enter a valid email address." });
      setValidationError("Please enter a valid email address.");
      return;
    }

    if (password.trim().length < 8) {
      setFieldErrors({ password: "Password must be at least 8 characters." });
      setValidationError("Password must be at least 8 characters.");
      return;
    }

    const passwordRequiredError = validatePasswordConfirmation(confirmPassword);
    if (passwordRequiredError) {
      setFieldErrors({ confirmPassword: passwordRequiredError });
      setValidationError(passwordRequiredError);
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      setValidationError("Passwords do not match.");
      return;
    }

    clearValidationError();

    const result = await handleRegister({ email, password });
    if (!result?.success) {
      return;
    }

    router.replace(APP_ROUTES.AUTH_COMPLETE_PROFILE);
  };

  const handleGooglePress = async () => {
    clearValidationError();

    if (!isGoogleConfigured) {
      setValidationError("Google Sign-In is not configured for this app build.");
      return;
    }

    const result = await signIn();
    if (!result.success) {
      if (!result.cancelled) {
        setValidationError(result.message);
      }
      return;
    }

    const authResult = await handleGoogleLogin(result.idToken);
    if (!authResult?.success) {
      return;
    }

    router.replace(APP_ROUTES.AUTH_COMPLETE_PROFILE);
  };

  return (
    <AuthScreen>
      <AuthHero
        icon="person-add-outline"
        eyebrow="Create account"
        title="Sign up"
        subtitle="Create your account first. You will complete your profile in the next 3 steps."
      />

      <AuthCard>
        {displayError ? <AuthBanner tone="error">{displayError}</AuthBanner> : null}

        <AppInput
          label="Email"
          placeholder="name@example.com"
          value={email}
          error={fieldErrors.email ?? null}
          onChangeText={(value) => {
            clearFieldError("email");
            setEmail(value);
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />

        <AppInput
          label="Password"
          placeholder="Create a password"
          value={password}
          error={fieldErrors.password ?? null}
          onChangeText={(value) => {
            clearFieldError("password");
            setPassword(value);
          }}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />

        <AppInput
          label="Confirm password"
          placeholder="Re-enter password"
          value={confirmPassword}
          error={fieldErrors.confirmPassword ?? null}
          onChangeText={(value) => {
            clearFieldError("confirmPassword");
            setConfirmPassword(value);
          }}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />

        <AuthActions>
          <AppButton
            title={loadingRegister ? "Creating account..." : "Create account"}
            onPress={handleEmailRegister}
            loading={loadingRegister}
            disabled={isBusy}
          />

          <AuthDivider label="or continue with" />

          <AppButton
            title={loadingGoogleLogin ? "Connecting to Google..." : "Continue with Google"}
            onPress={handleGooglePress}
            loading={loadingGoogleLogin}
            disabled={isBusy}
            variant="secondary"
            icon={<Ionicons name="logo-google" size={16} />}
          />
        </AuthActions>

        <AuthFooterLink
          prefix="Already have an account?"
          actionLabel="Sign in"
          onPress={() => router.push(APP_ROUTES.AUTH_LOGIN)}
        />
      </AuthCard>
    </AuthScreen>
  );
}
