import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { AppModal } from "@/components/ui/AppModal";
import { AppButton } from "@/components/ui/AppButton";
import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { Bid } from "../types/bid.types";

type Props = {
  visible: boolean;
  bid: Bid | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: { amount?: number; message?: string }) => void;
};

export const EditBidModal: React.FC<Props> = ({
  visible,
  bid,
  loading = false,
  onClose,
  onSubmit,
}) => {
  const { palette } = useThemeContext();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (bid && visible) {
      setAmount(String(bid.amount ?? ""));
      setMessage(bid.message ?? "");
    }
  }, [bid, visible]);

  const handleSubmit = () => {
    const parsedAmount = Number(amount);

    onSubmit({
      amount: Number.isFinite(parsedAmount) ? parsedAmount : undefined,
      message: message.trim(),
    });
  };

  return (
    <AppModal
      visible={visible}
      title="Edit bid"
      onClose={onClose}
      showCloseButton
      dismissOnBackdrop={!loading}
      scrollable
      actions={
        <>
          <AppButton
            title="Cancel"
            variant="ghost"
            onPress={onClose}
            disabled={loading}
          />
          <AppButton
            title={loading ? "Saving..." : "Save changes"}
            onPress={handleSubmit}
            disabled={loading}
          />
        </>
      }
    >
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: palette.textSecondary }]}>
          Bid amount
        </Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="Enter bid amount"
          placeholderTextColor={palette.textSecondary}
          editable={!loading}
          style={[
            styles.input,
            {
              color: palette.textPrimary,
              backgroundColor: palette.surfaceMuted,
              borderColor: palette.border,
            },
          ]}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: palette.textSecondary }]}>
          Message
        </Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Update your message"
          placeholderTextColor={palette.textSecondary}
          editable={!loading}
          multiline
          textAlignVertical="top"
          style={[
            styles.input,
            styles.textArea,
            {
              color: palette.textPrimary,
              backgroundColor: palette.surfaceMuted,
              borderColor: palette.border,
            },
          ]}
        />
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  fieldGroup: {
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
  },
  textArea: {
    minHeight: 120,
  },
});
