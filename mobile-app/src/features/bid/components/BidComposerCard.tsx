import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { Card, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useFormValidation } from "@/utils/validation/useFormValidation";
import { Bid, CreateBidData, UpdateBidData } from "../types/bid.types";
import {
    BID_MESSAGE_MIN_LENGTH,
    parseBidAmountInput,
    validateBidDraftFields,
} from "../utils/bidValidation";

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
    const {
        validationError,
        setValidationError,
        fieldErrors,
        setFieldErrors,
        clearFieldError,
        clearValidationError,
    } = useFormValidation<"amount" | "message" | "helpRequestId">();

    useEffect(() => {
        setAmount(initialData?.amount?.toString() ?? "");
        setMessage(initialData?.message ?? "");
        clearValidationError();
    }, [clearValidationError, initialData]);

    const canSubmit = useMemo(() => {
        return !disabled && !loading && amount.trim().length > 0 && message.trim().length >= BID_MESSAGE_MIN_LENGTH;
    }, [amount, disabled, loading, message]);

    const handleSubmit = async () => {
        const validation = validateBidDraftFields({
            amountInput: amount,
            message,
            helpRequestId: helpRequestId ?? initialData?.helpRequestId,
            mode,
        });
        if (!validation.isValid) {
            setValidationError(validation.formError);
            setFieldErrors(validation.fieldErrors);
            return;
        }

        const parsedAmount = parseBidAmountInput(amount);
        if (!parsedAmount.amount) return;

        clearValidationError();
        if (mode === "edit") {
            await onSubmit({
                amount: parsedAmount.amount,
                message: message.trim(),
            });
        } else {
            await onSubmit({
                helpRequestId: helpRequestId ?? initialData?.helpRequestId ?? "",
                amount: parsedAmount.amount,
                message: message.trim(),
            });
        }

        if (mode === "create") {
            setAmount("");
            setMessage("");
        }
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
                    error={fieldErrors.amount ?? null}
                    onChangeText={(value) => {
                        clearFieldError("amount");
                        setAmount(value);
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    editable={!disabled && !loading}
                />

                <AppInput
                    label="Message"
                    value={message}
                    error={fieldErrors.message ?? null}
                    onChangeText={(value) => {
                        clearFieldError("message");
                        setMessage(value);
                    }}
                    placeholder="Share your approach and availability"
                    multiline
                    numberOfLines={4}
                    editable={!disabled && !loading}
                />

                {validationError ? <Text style={[styles.error, { color: palette.danger }]}>{validationError}</Text> : null}

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
