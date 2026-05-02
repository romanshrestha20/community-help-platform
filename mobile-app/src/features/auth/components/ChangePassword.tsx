import React, { useState } from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { Stack, theme } from "@/design-system";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { APP_ROUTES } from "@/config/routes";
import { validateChangePasswordFormFields } from "@/features/auth/utils/authValidation";
import { useFormValidation } from "@/utils/validation/useFormValidation";
import { showErrorToast, showSuccessToast } from "@/utils/toast";


export const ChangePasswordSection = () => {
    const router = useRouter();

    const { handleChangePassword, loadingChangePassword, error } = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const {
        validationError,
        setValidationError,
        fieldErrors,
        setFieldErrors,
        clearFieldError,
        clearValidationError,
    } = useFormValidation<"currentPassword" | "newPassword">();

    const onSubmit = async () => {
        const validation = validateChangePasswordFormFields({
            currentPassword,
            newPassword,
        });

        if (!validation.isValid) {
            setValidationError(validation.formError);
            setFieldErrors(validation.fieldErrors);
            return;
        }

        clearValidationError();

        try {
            const result = await handleChangePassword(
                currentPassword,
                newPassword
            );
            if (result.success) {
                router.replace(APP_ROUTES.AUTH_LOGIN);
                showSuccessToast(
                    "Password changed",
                    "Please sign in again with your new password."
                );

            } else {
                showErrorToast(
                    "Password change failed",
                    result.message || error || "Please try again."
                );
            }
        } catch (err: any) {
            console.error("[ChangePassword] Error:", err);
            showErrorToast(
                "Password change failed",
                err?.message || "Please try again."
            );
        }
    }
    if (!isOpen) {
        return (
            <AppButton
                title="Change Password"
                onPress={() => setIsOpen(true)}
            />
        );
    }

    return (
        <Stack>
            <Text
                style={{
                    fontWeight: theme.typography.fontWeight.semibold,
                    marginBottom: theme.spacing.sm,
                }}
            >
                Change Password
            </Text>
            <AppInput
                label="Current Password"
                value={currentPassword}
                error={fieldErrors.currentPassword ?? null}
                onChangeText={(value) => {
                    clearFieldError("currentPassword");
                    setCurrentPassword(value);
                }}
                secureTextEntry
            />

            <AppInput
                label="New Password"
                value={newPassword}
                error={fieldErrors.newPassword ?? null}
                onChangeText={(value) => {
                    clearFieldError("newPassword");
                    setNewPassword(value);
                }}
                secureTextEntry
            />
            {validationError ? (
                <Text style={{ color: "#dc2626", fontSize: theme.typography.fontSize.sm }}>
                    {validationError}
                </Text>
            ) : null}
            <AppButton
                title={loadingChangePassword ? "Updating..." : "Update Password"}
                onPress={onSubmit}
                loading={loadingChangePassword}
                disabled={loadingChangePassword}
            />

            <AppButton
                title="Cancel"
                onPress={() => {
                    clearValidationError();
                    setIsOpen(false);
                }}
                disabled={loadingChangePassword}
            />
        </Stack>
    )
}
