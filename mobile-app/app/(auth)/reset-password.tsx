import React, { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

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
import { APP_ROUTES } from "@/config/routes";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { validateResetPasswordFormFields } from "@/features/auth/utils/authValidation";
import { useFormValidation } from "@/utils/validation/useFormValidation";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const tokenValue = params.token;
  const token = Array.isArray(tokenValue) ? tokenValue[0] : tokenValue;
  const { handleResetPassword, loadingResetPassword, error } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    validationError,
    setValidationError,
    fieldErrors,
    setFieldErrors,
    clearFieldError,
    clearValidationError,
  } = useFormValidation<"newPassword" | "confirmPassword">();

  const tokenError = token ? null : "Reset token is missing. Request a new reset link.";
  const isFormDisabled = loadingResetPassword || Boolean(tokenError);

  const handleSubmit = async () => {
    const validation = validateResetPasswordFormFields({
      newPassword,
      confirmPassword,
    });

    if (!validation.isValid) {
      setValidationError(validation.formError);
      setFieldErrors(validation.fieldErrors);
      setSuccessMessage(null);
      return;
    }

    if (!token) {
      setValidationError(tokenError);
      setSuccessMessage(null);
      return;
    }

    clearValidationError();

    const result = await handleResetPassword(token, newPassword);

    if (result?.success) {
      setSuccessMessage(result.message);
    } else {
      setSuccessMessage(null);
    }
  };

  return (
    <AuthScreen>
      <AuthHero
        icon="key-outline"
        eyebrow="Create a new password"
        title="Reset password"
        subtitle="Set a new password for your account and return to the app with a fresh sign-in."
      />

      <AuthCard>
        <Stack gap="md">
          {tokenError || validationError || error ? (
            <AuthBanner tone="error">{tokenError || validationError || error}</AuthBanner>
          ) : null}

          {successMessage ? (
            <AuthBanner tone="success">{successMessage}</AuthBanner>
          ) : null}

          <AppInput
            label="New password"
            placeholder="Enter a new password"
            value={newPassword}
            error={fieldErrors.newPassword ?? null}
            onChangeText={(value) => {
              clearFieldError("newPassword");
              setNewPassword(value);
            }}
            secureTextEntry
            editable={!isFormDisabled}
          />

          <AppInput
            label="Confirm new password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            error={fieldErrors.confirmPassword ?? null}
            onChangeText={(value) => {
              clearFieldError("confirmPassword");
              setConfirmPassword(value);
            }}
            secureTextEntry
            editable={!isFormDisabled}
          />

          <AuthActions>
            <AppButton
              title={loadingResetPassword ? "Updating password..." : "Reset password"}
              onPress={handleSubmit}
              loading={loadingResetPassword}
              disabled={isFormDisabled}
            />
          </AuthActions>

          <AuthFooterLink
            prefix="Ready to sign in?"
            actionLabel="Back to sign in"
            onPress={() => router.replace(APP_ROUTES.AUTH_LOGIN)}
          />
        </Stack>
      </AuthCard>
    </AuthScreen>
  );
}
