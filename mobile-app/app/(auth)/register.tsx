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
  const { isGoogleConfigured, isSigningIn, signIn } = useGoogleAuth();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const {
    validationError,
    setValidationError,
    fieldErrors,
    setFieldErrors,
    clearFieldError,
    clearValidationError,
  } = useFormValidation<"fullName" | "email" | "password" | "confirmPassword">();

  const isBusy = loadingRegister || loadingGoogleLogin || isSigningIn;
  const displayError = validationError || error;

  const handleEmailRegister = async () => {
    if (!fullName.trim()) {
      setFieldErrors({ fullName: "Name is required." });
      setValidationError("Name is required.");
      return;
    }

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

    if (password.trim().length < 12) {
      setFieldErrors({ password: "Password must be at least 12 characters." });
      setValidationError("Password must be at least 12 characters.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setFieldErrors({ password: "Password must include at least one uppercase letter." });
      setValidationError("Password must include at least one uppercase letter.");
      return;
    }

    if (!/[a-z]/.test(password)) {
      setFieldErrors({ password: "Password must include at least one lowercase letter." });
      setValidationError("Password must include at least one lowercase letter.");
      return;
    }

    if (!/\d/.test(password)) {
      setFieldErrors({ password: "Password must include at least one number." });
      setValidationError("Password must include at least one number.");
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setFieldErrors({ password: "Password must include at least one special character." });
      setValidationError("Password must include at least one special character.");
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

    const result = await handleRegister({ fullName: fullName.trim(), email, password });
    if (!result?.success) {
      return;
    }

    router.replace(`${APP_ROUTES.AUTH_VERIFY_EMAIL}?source=register`);
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
          label="Full name"
          placeholder="Alex Taylor"
          value={fullName}
          error={fieldErrors.fullName ?? null}
          onChangeText={(value) => {
            clearFieldError("fullName");
            setFullName(value);
          }}
          autoCapitalize="words"
          textContentType="name"
        />

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
            title={loadingGoogleLogin || isSigningIn ? "Connecting to Google..." : "Continue with Google"}
            onPress={handleGooglePress}
            loading={loadingGoogleLogin || isSigningIn}
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
