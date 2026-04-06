import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { AppButton } from "@/components/ui/AppButton";
import { AppModal } from "@/components/ui/AppModal";

type Props = {
  loading?: boolean;
  onLogout: () => Promise<void> | void;
};

export const SessionCard = ({ loading = false, onLogout }: Props) => {
  const { palette } = useThemeContext();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleConfirmLogout = async () => {
    await onLogout();
    setLogoutModalVisible(false);
  };

  return (
    <>
      <Card>
        <Stack gap="sm">
          <Text style={[styles.title, { color: palette.textPrimary }]}>
            Session
          </Text>

          <Text style={[styles.description, { color: palette.textSecondary }]}>
            Log out from this device if you are done using your account.
          </Text>

          <AppButton
            title="Logout"
            variant="secondary"
            loading={loading}
            disabled={loading}
            onPress={() => setLogoutModalVisible(true)}
          />
        </Stack>
      </Card>

      <AppModal
        visible={logoutModalVisible}
        title="Log out"
        onClose={() => setLogoutModalVisible(false)}
        dismissOnBackdrop
        showCloseButton={false}
        scrollable={false}
        actions={
          <View style={styles.actions}>
            <AppButton
              title="Cancel"
              variant="ghost"
              fullWidth={false}
              onPress={() => setLogoutModalVisible(false)}
              disabled={loading}
            />

            <AppButton
              title="Logout"
              variant="danger"
              fullWidth={false}
              onPress={handleConfirmLogout}
              loading={loading}
              disabled={loading}
            />
          </View>
        }
      >
        <Text style={[styles.modalText, { color: palette.textSecondary }]}>
          Are you sure you want to log out from this device?
        </Text>
      </AppModal>
    </>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
  modalText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    width: "100%",
  },
});