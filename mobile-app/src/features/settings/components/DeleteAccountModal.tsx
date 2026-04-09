import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppInput } from "@/components/ui/AppInput";
import { Card, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { validatePasswordConfirmation } from "@/features/auth/utils/authValidation";
import { useFormValidation } from "@/utils/validation/useFormValidation";

type Props = {
  visible: boolean;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (password: string) => Promise<boolean>;
};

export const DeleteAccountModal = ({
  visible,
  loading = false,
  error,
  onClose,
  onConfirm,
}: Props) => {
  const { palette } = useThemeContext();
  const [password, setPassword] = useState("");
  const {
    validationError,
    setValidationError,
    fieldErrors,
    setFieldError,
    clearFieldError,
    clearValidationError,
  } = useFormValidation<"password">();

  useEffect(() => {
    if (!visible) {
      setPassword("");
      clearFieldError("password");
      clearValidationError();
    }
  }, [visible, clearFieldError, clearValidationError]);

  const handleConfirm = async () => {
    const validation = validatePasswordConfirmation(password);
    if (validation) {
      setValidationError(validation);
      setFieldError("password", validation);
      return;
    }

    clearFieldError("password");
    clearValidationError();

    const success = await onConfirm(password);
    if (success) {
      setPassword("");
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Card style={[styles.card, { backgroundColor: palette.surface }]}>
          <Stack gap="sm">
            <Text style={[styles.title, { color: palette.danger }]}>
              Delete account
            </Text>

            <Text style={[styles.description, { color: palette.textSecondary }]}>
              This action is permanent. Enter your password to confirm account deletion.
            </Text>

            <AppInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              error={fieldErrors.password ?? null}
              onChangeText={(value) => {
                clearFieldError("password");
                clearValidationError();
                setPassword(value);
              }}
              secureTextEntry
              editable={!loading}
            />

            {validationError ? (
              <Text style={[styles.errorText, { color: palette.danger }]}>
                {validationError}
              </Text>
            ) : null}

            {error ? (
              <Text style={[styles.errorText, { color: palette.danger }]}>
                {error}
              </Text>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: palette.surfaceMuted,
                    borderColor: palette.border,
                  },
                ]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: palette.danger,
                  },
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={palette.textInverse} />
                ) : (
                  <Text style={[styles.primaryButtonText, { color: palette.textInverse }]}>
                    Delete
                  </Text>
                )}
              </Pressable>
            </View>
          </Stack>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 420,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xxs,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  primaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  primaryButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
});
