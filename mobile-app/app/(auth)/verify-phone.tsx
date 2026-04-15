import React, { useEffect, useState } from "react";
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
import { APP_ROUTES } from "@/config/routes";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { validateVerifyPhoneCodeFormFields } from "@/features/auth/utils/authValidation";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { formatPhoneNumberForDisplay } from "@/utils/phone";
import { useFormValidation } from "@/utils/validation/useFormValidation";

export default function VerifyPhoneScreen() {
  const router = useRouter();
  const { palette } = useThemeContext();
  const currentUser = useAuthStore((state) => state.user);
  const {
    handleSendPhoneCode,
    handleVerifyPhoneCode,
    loadingSendPhoneCode,
    loadingVerifyPhoneCode,
    error,
  } = useAuth();
  const [code, setCode] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [hasSentInitialCode, setHasSentInitialCode] = useState(false);
  const {
    validationError,
    setValidationError,
    fieldErrors,
    setFieldErrors,
    clearFieldError,
    clearValidationError,
  } = useFormValidation<"code">();

  const phoneNumber = currentUser?.phone ?? "";
  const hasVerifiedPhone = Boolean(currentUser?.isPhoneVerified);
  const canInteract = Boolean(phoneNumber) && !hasVerifiedPhone;

  useEffect(() => {
    if (!canInteract || hasSentInitialCode) {
      return;
    }

    const sendInitialCode = async () => {
      const result = await handleSendPhoneCode();

      if (result?.success) {
        setStatusMessage(result.message);
      }
    };

    setHasSentInitialCode(true);
    void sendInitialCode();
  }, [canInteract, handleSendPhoneCode, hasSentInitialCode]);

  const handleResend = async () => {
    const result = await handleSendPhoneCode();

    if (result?.success) {
      setStatusMessage(result.message);
    }
  };

  const handleVerify = async () => {
    const validation = validateVerifyPhoneCodeFormFields({ code });

    if (!validation.isValid) {
      setValidationError(validation.formError);
      setFieldErrors(validation.fieldErrors);
      return;
    }

    clearValidationError();

    const result = await handleVerifyPhoneCode(code);

    if (result?.success) {
      setStatusMessage(result.message || "Phone number verified successfully.");
      router.replace("/(tabs)/profile");
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
            title="Verify Phone"
            subtitle="Enter the 6-digit code sent to your phone number."
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
              <Text style={[styles.caption, { color: palette.textSecondary }]}>
                {phoneNumber
                  ? `Code destination: ${formatPhoneNumberForDisplay(phoneNumber)}`
                  : "Add a phone number to your profile before verifying it."}
              </Text>

              {hasVerifiedPhone ? (
                <Text style={[styles.success, { color: palette.success }]}>
                  Your phone number is already verified.
                </Text>
              ) : null}

              <AppInput
                label="Verification code"
                placeholder="123456"
                value={code}
                error={fieldErrors.code ?? null}
                onChangeText={(value) => {
                  clearFieldError("code");
                  setCode(value.replace(/\D/g, "").slice(0, 6));
                }}
                keyboardType="number-pad"
                editable={canInteract && !loadingVerifyPhoneCode}
              />

              {validationError || error ? (
                <Text style={[styles.error, { color: palette.danger }]}>
                  {validationError || error}
                </Text>
              ) : null}

              {statusMessage ? (
                <Text style={[styles.success, { color: palette.success }]}>
                  {statusMessage}
                </Text>
              ) : null}

              <AppButton
                title={loadingVerifyPhoneCode ? "Verifying..." : "Verify phone"}
                onPress={handleVerify}
                loading={loadingVerifyPhoneCode}
                disabled={!canInteract || loadingVerifyPhoneCode}
              />

              <AppButton
                title={loadingSendPhoneCode ? "Sending code..." : "Resend code"}
                onPress={handleResend}
                loading={loadingSendPhoneCode}
                disabled={!canInteract || loadingSendPhoneCode}
                variant="secondary"
              />

              <Pressable onPress={() => router.replace("/(tabs)/profile")}>
                <Text style={styles.linkText}>
                  <Text style={{ color: palette.textSecondary }}>Back to </Text>
                  <Text style={{ color: palette.primary }}>Profile</Text>
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
  caption: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.md,
    textAlign: "center",
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
