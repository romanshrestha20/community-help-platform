import React, { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable } from "react-native";
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
import { validatePasswordConfirmation } from "@/features/auth/validation/auth.validation";
import { useFormValidation } from "@/utils/validation/useFormValidation";
import { formEvents } from "@/utils/formEvents";

export default function RegisterScreen() {
  const router = useRouter();
  const { handleRegister, handleGoogleLogin, loadingRegister, loadingGoogleLogin, error } = useAuth();
  const { isGoogleConfigured, isSigningIn, signIn } = useGoogleAuth();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  React.useEffect(() => {
    formEvents.formStarted("auth_register");
  }, []);

  const handleEmailRegister = async () => {
    if (!fullName.trim()) {
      setFieldErrors({ fullName: "Name is required." });
      setValidationError("Name is required.");
      formEvents.formValidationFailed("auth_register", "fullName");
      return;
    }

    if (!email.trim()) {
      setFieldErrors({ email: "Email is required." });
      setValidationError("Email is required.");
      formEvents.formValidationFailed("auth_register", "email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldErrors({ email: "Please enter a valid email address." });
      setValidationError("Please enter a valid email address.");
      formEvents.formValidationFailed("auth_register", "email");
      return;
    }

    if (password.trim().length < 12) {
      setFieldErrors({ password: "Password must be at least 12 characters." });
      setValidationError("Password must be at least 12 characters.");
      formEvents.formValidationFailed("auth_register", "password");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setFieldErrors({ password: "Password must include at least one uppercase letter." });
      setValidationError("Password must include at least one uppercase letter.");
      formEvents.formValidationFailed("auth_register", "password");
      return;
    }

    if (!/[a-z]/.test(password)) {
      setFieldErrors({ password: "Password must include at least one lowercase letter." });
      setValidationError("Password must include at least one lowercase letter.");
      formEvents.formValidationFailed("auth_register", "password");
      return;
    }

    if (!/\d/.test(password)) {
      setFieldErrors({ password: "Password must include at least one number." });
      setValidationError("Password must include at least one number.");
      formEvents.formValidationFailed("auth_register", "password");
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setFieldErrors({ password: "Password must include at least one special character." });
      setValidationError("Password must include at least one special character.");
      formEvents.formValidationFailed("auth_register", "password");
      return;
    }

    const passwordRequiredError = validatePasswordConfirmation(confirmPassword);
    if (passwordRequiredError) {
      setFieldErrors({ confirmPassword: passwordRequiredError });
      setValidationError(passwordRequiredError);
      formEvents.formValidationFailed("auth_register", "confirmPassword");
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      setValidationError("Passwords do not match.");
      formEvents.formValidationFailed("auth_register", "confirmPassword");
      return;
    }

    clearValidationError();
    formEvents.formSubmitStarted("auth_register");

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
          required
          helperText="Enter your first and last name."
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
          required
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
          required
          helperText="Minimum 12 characters with upper/lower/number/symbol."
          placeholder="Create a password"
          value={password}
          error={fieldErrors.password ?? null}
          onChangeText={(value) => {
            clearFieldError("password");
            setPassword(value);
          }}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          rightAction={
            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              accessibilityHint="Toggles password visibility"
              hitSlop={8}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
              />
            </Pressable>
          }
        />

        <AppInput
          label="Confirm password"
          required
          placeholder="Re-enter password"
          value={confirmPassword}
          error={fieldErrors.confirmPassword ?? null}
          onChangeText={(value) => {
            clearFieldError("confirmPassword");
            setConfirmPassword(value);
          }}
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          rightAction={
            <Pressable
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              accessibilityHint="Toggles password visibility"
              hitSlop={8}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
              />
            </Pressable>
          }
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
