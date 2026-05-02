import React, { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable } from "react-native";
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
import { validateResetPasswordFormFields } from "@/features/auth/validation/auth.validation";
import { useFormValidation } from "@/utils/validation/useFormValidation";
import { formEvents } from "@/utils/formEvents";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const tokenValue = params.token;
  const token = Array.isArray(tokenValue) ? tokenValue[0] : tokenValue;
  const { handleResetPassword, loadingResetPassword, error } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  React.useEffect(() => {
    formEvents.formStarted("auth_reset_password");
  }, []);

  const handleSubmit = async () => {
    const validation = validateResetPasswordFormFields({
      newPassword,
      confirmPassword,
    });

    if (!validation.isValid) {
      setValidationError(validation.formError);
      setFieldErrors(validation.fieldErrors);
      setSuccessMessage(null);
      formEvents.formValidationFailed("auth_reset_password", Object.keys(validation.fieldErrors)[0]);
      return;
    }

    if (!token) {
      setValidationError(tokenError);
      setSuccessMessage(null);
      return;
    }

    clearValidationError();
    formEvents.formSubmitStarted("auth_reset_password");

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
            required
            helperText="Use a strong password you haven’t used before."
            placeholder="Enter a new password"
            value={newPassword}
            error={fieldErrors.newPassword ?? null}
            onChangeText={(value) => {
              clearFieldError("newPassword");
              setNewPassword(value);
            }}
            secureTextEntry={!showNewPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            editable={!isFormDisabled}
            rightAction={
              <Pressable
                onPress={() => setShowNewPassword((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={showNewPassword ? "Hide new password" : "Show new password"}
                accessibilityHint="Toggles password visibility"
                hitSlop={8}
              >
                <Ionicons
                  name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                />
              </Pressable>
            }
          />

          <AppInput
            label="Confirm new password"
            required
            placeholder="Re-enter your new password"
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
            editable={!isFormDisabled}
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
