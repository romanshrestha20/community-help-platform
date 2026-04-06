import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { Card, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { Bid, CreateBidData, UpdateBidData } from "../types/bid.types";

type Props = {
    helpRequestId?: string;
    initialData?: Bid;
    mode?: "create" | "edit";
    title?: string;
    submitLabel?: string;
    onSubmit: (payload: CreateBidData | UpdateBidData) => Promise<void>;
    loading?: boolean;
    disabled?: boolean;
};

export const BidComposerCard = ({
    helpRequestId,
    initialData,
    mode = "create",
    title,
    submitLabel,
    onSubmit,
    loading = false,
    disabled = false,
}: Props) => {
    const { palette } = useThemeContext();
    const [amount, setAmount] = useState(initialData?.amount?.toString() ?? "");
    const [message, setMessage] = useState(initialData?.message ?? "");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setAmount(initialData?.amount?.toString() ?? "");
        setMessage(initialData?.message ?? "");
        setError(null);
    }, [initialData]);

    const canSubmit = useMemo(() => {
        return !disabled && !loading && amount.trim().length > 0 && message.trim().length >= 10;
    }, [amount, disabled, loading, message]);

    const handleSubmit = async () => {
        const parsedAmount = Number(amount);

        if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
            setError("Bid amount must be greater than 0.");
            return;
        }

        if (message.trim().length < 10) {
            setError("Message must be at least 10 characters.");
            return;
        }

        setError(null);
        if (mode === "edit") {
            await onSubmit({
                amount: parsedAmount,
                message: message.trim(),
            });
        } else {
            await onSubmit({
                helpRequestId: helpRequestId ?? initialData?.helpRequestId ?? "",
                amount: parsedAmount,
                message: message.trim(),
            });
        }

        setAmount("");
        setMessage("");
    };

    const resolvedTitle = title ?? (mode === "edit" ? "Edit bid" : "Place a bid");
    const resolvedSubmitLabel = submitLabel ?? (mode === "edit" ? "Update bid" : "Submit bid");

    return (
        <Card>
            <Stack gap="sm">
                <Text style={[styles.title, { color: palette.textPrimary }]}>{resolvedTitle}</Text>

                <AppInput
                    label="Amount"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    editable={!disabled && !loading}
                />

                <AppInput
                    label="Message"
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Share your approach and availability"
                    multiline
                    numberOfLines={4}
                    editable={!disabled && !loading}
                />

                {error ? <Text style={[styles.error, { color: palette.danger }]}>{error}</Text> : null}

                <AppButton
                    title={resolvedSubmitLabel}
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={!canSubmit}
                />
            </Stack>
        </Card>
    );
};

const styles = StyleSheet.create({
    title: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    error: {
        fontSize: theme.typography.fontSize.sm,
    },
});
