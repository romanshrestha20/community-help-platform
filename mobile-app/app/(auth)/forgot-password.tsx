import React, { useState } from "react";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { Stack } from "@/design-system";
import {
  AuthActions,
  AuthBanner,
  AuthCard,
  AuthFooterLink,
  AuthHero,
  AuthScreen,
} from "@/features/auth/components";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { validateForgotPasswordFormFields } from "@/features/auth/validation/auth.validation";
import { APP_ROUTES } from "@/config/routes";
import { useFormValidation } from "@/utils/validation/useFormValidation";
import { formEvents } from "@/utils/formEvents";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { handleForgotPassword, loadingForgotPassword, error } = useAuth();
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    validationError,
    setValidationError,
    fieldErrors,
    setFieldErrors,
    clearFieldError,
    clearValidationError,
  } = useFormValidation<"email">();

  React.useEffect(() => {
    formEvents.formStarted("auth_forgot_password");
  }, []);

  const handleSubmit = async () => {
    const validation = validateForgotPasswordFormFields({ email });

    if (!validation.isValid) {
      setValidationError(validation.formError);
      setFieldErrors(validation.fieldErrors);
      setSuccessMessage(null);
      formEvents.formValidationFailed("auth_forgot_password", Object.keys(validation.fieldErrors)[0]);
      return;
    }

    clearValidationError();
    formEvents.formSubmitStarted("auth_forgot_password");

    const result = await handleForgotPassword(email);

    if (result?.success) {
      setSuccessMessage(result.message);
    } else {
      setSuccessMessage(null);
    }
  };

  return (
    <AuthScreen>
      <AuthHero
        icon="mail-open-outline"
        eyebrow="Password help"
        title="Reset your password"
        subtitle="Enter the email address linked to your account and we’ll send a reset link."
      />

      <AuthCard>
        <Stack gap="md">
          {validationError || error ? (
            <AuthBanner tone="error">{validationError || error}</AuthBanner>
          ) : null}

          {successMessage ? (
            <AuthBanner tone="success">{successMessage}</AuthBanner>
          ) : null}

          <AppInput
            label="Email"
            required
            helperText="We’ll send a reset link to this address."
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
            editable={!loadingForgotPassword}
          />

          <AuthActions>
            <AppButton
              title={loadingForgotPassword ? "Sending reset link..." : "Send reset link"}
              onPress={handleSubmit}
              loading={loadingForgotPassword}
              disabled={loadingForgotPassword}
            />
          </AuthActions>

          <AuthFooterLink
            prefix="Remembered your password?"
            actionLabel="Back to sign in"
            onPress={() => router.push(APP_ROUTES.AUTH_LOGIN)}
          />
        </Stack>
      </AuthCard>
    </AuthScreen>
  );
}
