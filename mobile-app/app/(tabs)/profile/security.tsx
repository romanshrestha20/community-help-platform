import React, { useEffect, useMemo, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { AppInput } from "@/components/ui/AppInput";
import { AppModal } from "@/components/ui/AppModal";
import { Card, Screen, Stack, theme } from "@/design-system";
import { APP_ROUTES } from "@/config/routes";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { confirmSensitiveAction } from "@/features/auth/utils/biometric";
import { validateChangePasswordFormFields } from "@/features/auth/utils/authValidation";
import { DeleteAccountModal } from "@/features/settings/components/DeleteAccountModal";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useUser } from "@/features/user/hooks/user.hook";
import { useFormValidation } from "@/utils/validation/useFormValidation";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

type SecurityRowProps = {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onPress?: () => void;
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
};

const SecurityRow = ({
  title,
  subtitle,
  actionLabel = "Manage",
  onPress,
  danger = false,
  disabled = false,
  loading = false,
}: SecurityRowProps) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.securityRow,
        {
          borderBottomColor: palette.border,
          opacity: disabled ? 0.55 : 1,
        },
      ]}
    >
      <View style={styles.securityCopy}>
        <Text
          style={[
            styles.securityTitle,
            { color: danger ? palette.danger : palette.textPrimary },
          ]}
        >
          {title}
        </Text>
        <Text style={[styles.securitySubtitle, { color: palette.textSecondary }]}>
          {subtitle}
        </Text>
      </View>

      {onPress ? (
        <Pressable
          style={[
            styles.securityAction,
            {
              borderColor: danger ? palette.danger : palette.border,
              backgroundColor: danger ? palette.dangerSoft : palette.surfaceMuted,
            },
          ]}
          onPress={onPress}
          disabled={disabled || loading}
        >
          {loading ? (
            <ActivityIndicator color={danger ? palette.danger : palette.primary} size="small" />
          ) : (
            <Text
              style={[
                styles.securityActionText,
                { color: danger ? palette.danger : palette.textPrimary },
              ]}
            >
              {actionLabel}
            </Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
};

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const { palette } = useThemeContext();
  const authUser = useAuthStore((state) => state.user);

  const {
    handleLogout,
    handleLogoutAll,
    handleChangePassword,
    handleAddPassword,
    handleSendEmailVerification,
    loadingLogout,
    loadingLogoutAll,
    loadingChangePassword,
    loadingAddPassword,
    loadingSendEmailVerification,
    error: authError,
  } = useAuth();

  const {
    user,
    loading: loadingProfile,
    error: profileError,
    handleDeleteProfile,
    loadUserProfile,
  } = useUser();

  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const {
    validationError,
    setValidationError,
    fieldErrors,
    setFieldErrors,
    clearFieldError,
    clearValidationError,
  } = useFormValidation<"currentPassword" | "newPassword">();

  const displayUser = user ?? authUser;
  const hasPasswordSignIn = displayUser?.hasPassword === true;
  const hasVerifiedEmail = displayUser?.isEmailVerified === true;
  const hasPhoneNumber = Boolean(displayUser?.phone);
  const hasVerifiedPhone = displayUser?.isPhoneVerified === true;
  const combinedError = authError || profileError;

  useEffect(() => {
    void loadUserProfile();
  }, [loadUserProfile]);

  const signInSummary = useMemo(() => {
    if (!displayUser?.email) {
      return "No email identity is attached to this account yet.";
    }

    return hasPasswordSignIn
      ? `You currently sign in with ${displayUser.email}. Use the actions below to protect access to your account.`
      : `You sign in with ${displayUser.email} using Google. Add a password if you also want email/password sign-in.`;
  }, [displayUser?.email, hasPasswordSignIn]);

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    clearValidationError();
    setFieldErrors({});
  };

  const syncHasPasswordLocally = () => {
    useAuthStore.setState((state) => ({
      ...state,
      user: state.user
        ? {
            ...state.user,
            hasPassword: true,
          }
        : state.user,
    }));
  };

  const submitPasswordChange = async () => {
    const validation = validateChangePasswordFormFields({
      currentPassword: hasPasswordSignIn ? currentPassword : "temporary-placeholder",
      newPassword,
    });

    if (!validation.isValid) {
      setValidationError(validation.formError);
      setFieldErrors(validation.fieldErrors);
      return;
    }

    clearValidationError();

    const confirmed = await confirmSensitiveAction(
      hasPasswordSignIn ? "Confirm password change" : "Confirm password setup"
    );
    if (!confirmed) {
      showErrorToast("Authentication cancelled", "Security confirmation was not completed.");
      return;
    }

    const result = hasPasswordSignIn
      ? await handleChangePassword(currentPassword, newPassword)
      : await handleAddPassword(newPassword);

    if (!result?.success) {
      const resultMessage = result?.message || authError || "Please try again.";
      const normalizedMessage = resultMessage.toLowerCase();

      if (!hasPasswordSignIn && normalizedMessage.includes("already has a password")) {
        syncHasPasswordLocally();
        setChangePasswordVisible(false);
        resetPasswordForm();
        showSuccessToast(
          "Password already exists",
          "Your account already has a password. You can change it instead."
        );
        return;
      }

      showErrorToast(
        hasPasswordSignIn ? "Password change failed" : "Password setup failed",
        resultMessage
      );
      return;
    }

    setChangePasswordVisible(false);
    resetPasswordForm();

    if (hasPasswordSignIn) {
      showSuccessToast("Password changed", "Please sign in again with your new password.");
      router.replace(APP_ROUTES.AUTH_LOGIN);
      return;
    }

    syncHasPasswordLocally();
    showSuccessToast("Password added", "You can now sign in with email and password too.");
  };

  const resendVerificationEmail = async () => {
    const result = await handleSendEmailVerification("resend");

    if (!result.success) {
      showErrorToast("Could not send email", result.message || "Please try again.");
      return;
    }

    showSuccessToast(
      "Verification email sent",
      result.message || "Check your inbox for the verification link."
    );
  };

  const logoutCurrentSession = async () => {
    await handleLogout();
    router.replace(APP_ROUTES.AUTH_LOGIN);
  };

  const logoutAllDevices = async () => {
    await handleLogoutAll();
    router.replace(APP_ROUTES.AUTH_LOGIN);
  };

  return (
    <Screen>
      <AppHeader
        title="Privacy & security"
        subtitle="Manage password access, account verification, and irreversible account actions."
        showBackButton
        backButtonProps={{
          fallback: APP_ROUTES.PROFILE,
          variant: "secondary",
        }}
      />

      <Stack gap="md">
        <Card>
          <Stack gap="sm">
            <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
              Account access
            </Text>
            <Text style={[styles.sectionDescription, { color: palette.textSecondary }]}>
              {signInSummary}
            </Text>

            <SecurityRow
              title="Add password"
              subtitle={
                hasPasswordSignIn
                  ? "This account already has a password."
                  : "Create a password so this account can also use email/password sign-in."
              }
              actionLabel="Add"
              onPress={!hasPasswordSignIn ? () => setChangePasswordVisible(true) : undefined}
              disabled={hasPasswordSignIn}
            />

            <SecurityRow
              title="Change password"
              subtitle={
                hasPasswordSignIn
                  ? "Update your current password and require a fresh sign-in."
                  : "Add a password first to enable password changes."
              }
              actionLabel="Change"
              onPress={hasPasswordSignIn ? () => setChangePasswordVisible(true) : undefined}
              disabled={!hasPasswordSignIn}
            />

            <SecurityRow
              title="Log out from this device"
              subtitle="End the current session and return to the sign-in screen."
              actionLabel="Log out"
              onPress={logoutCurrentSession}
              disabled={loadingLogout}
              loading={loadingLogout}
            />

            <SecurityRow
              title="Log out from all devices"
              subtitle="Revoke all sessions and require sign-in everywhere."
              actionLabel="Log out all"
              onPress={logoutAllDevices}
              disabled={loadingLogoutAll}
              loading={loadingLogoutAll}
            />
          </Stack>
        </Card>

        <Card>
          <Stack gap="sm">
            <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
              Verification
            </Text>
            <Text style={[styles.sectionDescription, { color: palette.textSecondary }]}>
              Verified contact details improve trust, recovery, and security checks.
            </Text>

            <SecurityRow
              title={hasVerifiedEmail ? "Email verified" : "Verify email"}
              subtitle={
                hasVerifiedEmail
                  ? `Your email ${displayUser?.email ?? ""} is verified.`
                  : "Send a fresh verification link to your email inbox."
              }
              actionLabel={hasVerifiedEmail ? "Done" : "Send link"}
              onPress={hasVerifiedEmail ? undefined : resendVerificationEmail}
              disabled={hasVerifiedEmail || loadingSendEmailVerification}
              loading={loadingSendEmailVerification}
            />

            <SecurityRow
              title={hasVerifiedPhone ? "Phone verified" : "Verify phone number"}
              subtitle={
                hasPhoneNumber
                  ? hasVerifiedPhone
                    ? `Your phone number ${displayUser?.phone ?? ""} is verified.`
                    : "Confirm your phone number with a verification code."
                  : "Add a phone number to your profile before enabling phone verification."
              }
              actionLabel={hasVerifiedPhone ? "Done" : "Verify"}
              onPress={
                !hasVerifiedPhone && hasPhoneNumber
                  ? () => router.push(APP_ROUTES.AUTH_VERIFY_PHONE)
                  : undefined
              }
              disabled={hasVerifiedPhone || !hasPhoneNumber}
            />
          </Stack>
        </Card>

        <Card>
          <Stack gap="sm">
            <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
              Account removal
            </Text>
            <Text style={[styles.sectionDescription, { color: palette.textSecondary }]}>
              Deleting your account is permanent. Your profile, session access, and account
              history cannot be restored afterward.
            </Text>

            <SecurityRow
              title="Delete account"
              subtitle="Permanently remove this account after password confirmation."
              actionLabel="Delete"
              onPress={() => setDeleteAccountVisible(true)}
              danger
              disabled={loadingProfile}
            />
          </Stack>
        </Card>

        {combinedError ? (
          <Text style={[styles.errorText, { color: palette.danger }]}>
            {combinedError}
          </Text>
        ) : null}
      </Stack>

      <AppModal
        visible={changePasswordVisible}
        title={hasPasswordSignIn ? "Change password" : "Add password"}
        onClose={() => {
          setChangePasswordVisible(false);
          resetPasswordForm();
        }}
        dismissOnBackdrop={!(loadingChangePassword || loadingAddPassword)}
        actions={
          <View style={styles.modalActions}>
            <AppButton
              title="Cancel"
              variant="ghost"
              fullWidth={false}
              onPress={() => {
                setChangePasswordVisible(false);
                resetPasswordForm();
              }}
              disabled={loadingChangePassword || loadingAddPassword}
            />
            <AppButton
              title={hasPasswordSignIn ? "Update" : "Add"}
              variant="secondary"
              fullWidth={false}
              onPress={submitPasswordChange}
              loading={loadingChangePassword || loadingAddPassword}
              disabled={loadingChangePassword || loadingAddPassword}
            />
          </View>
        }
      >
        <Text style={[styles.modalDescription, { color: palette.textSecondary }]}>
          {hasPasswordSignIn
            ? "Enter your current password and choose a stronger replacement. You will be signed out immediately after the update."
            : "Create a password for this account so you can sign in without Google in the future."}
        </Text>

        {hasPasswordSignIn ? (
          <AppInput
            label="Current password"
            value={currentPassword}
            error={fieldErrors.currentPassword ?? null}
            onChangeText={(value) => {
              clearFieldError("currentPassword");
              setCurrentPassword(value);
            }}
            secureTextEntry={!showCurrentPassword}
            editable={!loadingChangePassword}
            rightAction={
              <Pressable
                onPress={() => setShowCurrentPassword((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={showCurrentPassword ? "Hide current password" : "Show current password"}
                accessibilityHint="Toggles password visibility"
                hitSlop={8}
              >
                <Ionicons
                  name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={palette.textSecondary}
                />
              </Pressable>
            }
          />
        ) : null}

        <AppInput
          label={hasPasswordSignIn ? "New password" : "Password"}
          value={newPassword}
          error={fieldErrors.newPassword ?? null}
          onChangeText={(value) => {
            clearFieldError("newPassword");
            setNewPassword(value);
          }}
          secureTextEntry={!showNewPassword}
          editable={!(loadingChangePassword || loadingAddPassword)}
          rightAction={
            <Pressable
              onPress={() => setShowNewPassword((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel={showNewPassword ? "Hide password" : "Show password"}
              accessibilityHint="Toggles password visibility"
              hitSlop={8}
            >
              <Ionicons
                name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={palette.textSecondary}
              />
            </Pressable>
          }
        />

        {validationError ? (
          <Text style={[styles.errorText, { color: palette.danger }]}>
            {validationError}
          </Text>
        ) : null}
      </AppModal>

      <DeleteAccountModal
        visible={deleteAccountVisible}
        requiresPassword={hasPasswordSignIn}
        loading={loadingProfile}
        error={profileError}
        onClose={() => setDeleteAccountVisible(false)}
        onConfirm={async (password) => {
          const confirmed = await confirmSensitiveAction("Confirm account deletion");
          if (!confirmed) {
            showErrorToast(
              "Authentication cancelled",
              "Security confirmation was not completed."
            );
            return false;
          }

          const success = await handleDeleteProfile(password);
          if (success) {
            showSuccessToast("Account deleted", "Your account has been removed.");
            router.replace(APP_ROUTES.AUTH_LOGIN);
          }
          return success;
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  sectionDescription: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  securityRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
  },
  securityCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  securityTitle: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  securitySubtitle: {
    fontSize: theme.typography.fontSize.xs + 1,
    lineHeight: theme.typography.lineHeight.xs + 2,
  },
  securityAction: {
    minHeight: 36,
    minWidth: 78,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.fill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  securityActionText: {
    fontSize: theme.typography.fontSize.xs + 1,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  modalDescription: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.md,
    marginBottom: theme.spacing.xs,
  },
  modalActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    width: "100%",
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
});
