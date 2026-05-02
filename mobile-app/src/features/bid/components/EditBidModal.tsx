import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppModal } from "@/components/ui/AppModal";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { theme } from "@/design-system";
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

  const unchanged =
    !bid ||
    (String(bid.amount ?? "") === amount.trim() && (bid.message ?? "").trim() === message.trim());

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
            disabled={loading || unchanged}
          />
        </>
      }
    >
      <View style={styles.fieldGroup}>
        <AppInput
          label="Bid amount"
          required
          helperText="Enter your updated offer amount in EUR."
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="Enter bid amount"
          editable={!loading}
        />
      </View>

      <View style={styles.fieldGroup}>
        <AppInput
          label="Message"
          required
          helperText="Update your message for the requester."
          value={message}
          onChangeText={setMessage}
          placeholder="Update your message"
          editable={!loading}
          multiline
          numberOfLines={4}
        />
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  fieldGroup: {
    gap: theme.spacing.xs,
  },
  label: {},
  input: {},
  textArea: {},
});
