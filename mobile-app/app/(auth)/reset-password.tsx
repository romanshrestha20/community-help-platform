import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { AppInput } from "@/components/ui/AppInput";
import { Card, Stack, theme } from "@/design-system";
import { APP_ROUTES } from "@/config/routes";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { validateResetPasswordFormFields } from "@/features/auth/utils/authValidation";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useFormValidation } from "@/utils/validation/useFormValidation";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const tokenValue = params.token;
  const token = Array.isArray(tokenValue) ? tokenValue[0] : tokenValue;
  const { palette } = useThemeContext();
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
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: palette.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <View style={styles.authBlock}>
          <AppHeader
            title="Reset Password"
            subtitle="Choose a new password for your account."
            align="center"
            variant="large"
          />

          <Card
            style={[
              styles.card,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <Stack gap="md">
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

              {tokenError || validationError || error ? (
                <Text style={[styles.error, { color: palette.danger }]}>
                  {tokenError || validationError || error}
                </Text>
              ) : null}

              {successMessage ? (
                <Text style={[styles.success, { color: palette.success }]}>
                  {successMessage}
                </Text>
              ) : null}

              <AppButton
                title={
                  loadingResetPassword ? "Updating password..." : "Reset password"
                }
                onPress={handleSubmit}
                loading={loadingResetPassword}
                disabled={isFormDisabled}
              />

              <Pressable onPress={() => router.replace(APP_ROUTES.AUTH_LOGIN)}>
                <Text style={styles.linkText}>
                  <Text style={{ color: palette.textSecondary }}>
                    Back to{" "}
                  </Text>
                  <Text style={{ color: palette.primary }}>Sign in</Text>
                </Text>
              </Pressable>
            </Stack>
          </Card>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    justifyContent: "center",
  },
  authBlock: {
    width: "100%",
    gap: theme.spacing.lg,
  },
  card: {
    width: "100%",
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
  },
  error: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  success: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  linkText: {
    textAlign: "center",
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: theme.spacing.xs,
  },
});
