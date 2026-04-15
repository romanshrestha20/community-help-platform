import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { AppInput } from "@/components/ui/AppInput";
import { Card, Stack, theme } from "@/design-system";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { validateForgotPasswordFormFields } from "@/features/auth/utils/authValidation";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { APP_ROUTES } from "@/config/routes";
import { useFormValidation } from "@/utils/validation/useFormValidation";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { palette } = useThemeContext();
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

  const isFormDisabled = loadingForgotPassword;

  const handleSubmit = async () => {
    const validation = validateForgotPasswordFormFields({ email });

    if (!validation.isValid) {
      setValidationError(validation.formError);
      setFieldErrors(validation.fieldErrors);
      setSuccessMessage(null);
      return;
    }

    clearValidationError();

    const result = await handleForgotPassword(email);

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
            title="Forgot Password"
            subtitle="Enter your email and we’ll send you a reset link."
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
                editable={!isFormDisabled}
              />

              {validationError || error ? (
                <Text style={[styles.error, { color: palette.danger }]}>
                  {validationError || error}
                </Text>
              ) : null}

              {successMessage ? (
                <Text style={[styles.success, { color: palette.success }]}>
                  {successMessage}
                </Text>
              ) : null}

              <AppButton
                title={
                  loadingForgotPassword ? "Sending link..." : "Send reset link"
                }
                onPress={handleSubmit}
                loading={loadingForgotPassword}
                disabled={isFormDisabled}
              />

              <Pressable onPress={() => router.push(APP_ROUTES.AUTH_LOGIN)}>
                <Text style={styles.linkText}>
                  <Text style={{ color: palette.textSecondary }}>
                    Remembered it?{" "}
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
