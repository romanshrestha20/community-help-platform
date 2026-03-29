import React from "react";
import { Stack } from "@/design-system";
import { AppInput } from "@/components/ui/AppInput";
import { AppButton } from "@/components/ui/AppButton";
import { Text } from "react-native";
import { useModal } from "@/hooks/useModal";
import { AppModal } from "@/components/ui/AppModal";

type Props = {
  password: string;
  setPassword: (val: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
};

export const ProfileDeleteConfirm = ({
  password,
  setPassword,
  onConfirm,
  onCancel,
  loading
}: Props) => {
  const { visible, open, close } = useModal();
  const handleDelete = () => {
    onConfirm();
    close();
  };
  return (
    <Stack>
      <Text style={{ fontWeight: "600", marginBottom: 8 }}>Confirm your password to delete account:</Text>
      <AppInput label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" placeholder="Enter current password" />
      <AppButton
        title={loading ? "Deleting..." : "Confirm Delete"}
        onPress={open}
        variant="danger"
        loading={loading}
        disabled={loading} />
      <AppModal
        visible={visible}
        title="Confirm Delete"
        onClose={close}
        actions={
          <>
            <AppButton title="Cancel" onPress={close} />
            <AppButton title="Delete" variant="danger" onPress={() => {
              handleDelete();
              close();
            }} />
          </>
        }
      >
        <Text>Are you sure you want to delete?</Text>
      </AppModal>

      <AppButton title="Cancel" onPress={onCancel} disabled={loading} />
    </Stack>

  )

}