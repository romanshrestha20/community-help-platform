import React, { useEffect, useState } from "react";
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
import { useAuthStore } from "@/features/auth/store/auth.store";
import { validateVerifyPhoneCodeFormFields } from "@/features/auth/utils/authValidation";
import { formatPhoneNumberForDisplay } from "@/utils/phone";
import { useFormValidation } from "@/utils/validation/useFormValidation";

export default function VerifyPhoneScreen() {
  const router = useRouter();
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
    <AuthScreen>
      <AuthHero
        icon="call-outline"
        eyebrow="Phone confirmation"
        title="Verify your phone"
        subtitle="Enter the 6-digit code sent to your phone number so helpers can trust how to reach you."
      />

      <AuthCard>
        <Stack gap="md">
          <AuthBanner tone={hasVerifiedPhone ? "success" : "info"}>
            {phoneNumber
              ? `Code destination: ${formatPhoneNumberForDisplay(phoneNumber)}`
              : "Add a phone number to your profile before verifying it."}
          </AuthBanner>

          {validationError || error ? (
            <AuthBanner tone="error">{validationError || error}</AuthBanner>
          ) : null}

          {statusMessage ? (
            <AuthBanner tone="success">{statusMessage}</AuthBanner>
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

          <AuthActions>
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
          </AuthActions>

          <AuthFooterLink
            prefix="Finished here?"
            actionLabel="Back to profile"
            onPress={() => router.replace("/(tabs)/profile")}
          />
        </Stack>
      </AuthCard>
    </AuthScreen>
  );
}
