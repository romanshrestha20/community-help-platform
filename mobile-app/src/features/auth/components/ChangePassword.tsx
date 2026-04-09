import React, { useState } from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { Stack, theme } from "@/design-system";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { APP_ROUTES } from "@/config/routes";
import { validateChangePasswordForm } from "@/features/auth/utils/authValidation";
import { useFormValidation } from "@/utils/validation/useFormValidation";


export const ChangePasswordSection = () => {
    const router = useRouter();

    const { handleChangePassword, loadingChangePassword, error } = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const { validationError, setValidationError, clearValidationError } = useFormValidation();

    const onSubmit = async () => {
        const validation = validateChangePasswordForm({
            currentPassword,
            newPassword,
        });

        if (validation) {
            setValidationError(validation);
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
                Toast.show({
                    type: "success",
                    text1: "Password changed successfully. Please log in again."
                });

            } else {
                Toast.show({
                    type: "error",
                    text1: error || "Failed to change password"
                });
            }
        } catch (err: any) {
            console.error("[ChangePassword] Error:", err);
            Toast.show({
                type: "error",
                text1: err?.message || "Failed to change password"
            });
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
                onChangeText={(value) => {
                    clearValidationError();
                    setCurrentPassword(value);
                }}
                secureTextEntry
            />

            <AppInput
                label="New Password"
                value={newPassword}
                onChangeText={(value) => {
                    clearValidationError();
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
