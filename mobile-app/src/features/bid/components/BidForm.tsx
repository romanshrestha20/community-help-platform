import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppInput } from "@/components/ui/AppInput";
import { AppButton } from "@/components/ui/AppButton";
import { Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useFormValidation } from "@/utils/validation/useFormValidation";
import { CreateBidData, UpdateBidData, Bid } from "../types/bid.types";
import { validateBidDraftFields } from "../utils/bidValidation";

interface BidFormProps {
    helpRequestId?: string;
    requestTitle?: string;
    initialData?: Bid;
    onSubmit: (data: CreateBidData | UpdateBidData) => Promise<void>;
    loading?: boolean;
    error?: string | null;
    isUpdate?: boolean;
}

export const BidForm: React.FC<BidFormProps> = ({
    helpRequestId,
    requestTitle,
    initialData,
    onSubmit,
    loading = false,
    error = null,
    isUpdate = false,
}) => {
    const { palette } = useThemeContext();

    const [formData, setFormData] = useState({
        helpRequestId: initialData?.helpRequestId || helpRequestId || "",
        amount: initialData?.amount?.toString() || "",
        message: initialData?.message || "",
    });

    const {
        validationError,
        setValidationError,
        fieldErrors,
        setFieldErrors,
        clearFieldError,
        clearValidationError,
    } = useFormValidation<"amount" | "message" | "helpRequestId">();

    const handleInputChange = (field: "amount" | "message" | "helpRequestId", value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        if (field === "amount" || field === "message") {
            clearFieldError(field);
        }
    };

    const handleSubmit = async () => {
        const validation = validateBidDraftFields({
            amountInput: formData.amount,
            message: formData.message,
            helpRequestId: isUpdate ? undefined : formData.helpRequestId,
            mode: isUpdate ? "edit" : "create",
        });

        if (!validation.isValid) {
            setValidationError(validation.formError);
            setFieldErrors(validation.fieldErrors);
            return;
        }

        const data = isUpdate
            ? {
                amount: parseFloat(formData.amount),
                message: formData.message.trim(),
            }
            : {
                helpRequestId: formData.helpRequestId,
                amount: parseFloat(formData.amount),
                message: formData.message.trim(),
            };

        clearValidationError();
        await onSubmit(data);

        if (!isUpdate) {
            setFormData((prev) => ({
                ...prev,
                amount: "",
                message: "",
            }));
        }
    };

    const messageLength = formData.message.length;
    const parsedAmount = parseFloat(formData.amount);

    const amountPreview = useMemo(() => {
        if (!formData.amount || Number.isNaN(parsedAmount)) return null;
        return parsedAmount.toFixed(2);
    }, [formData.amount, parsedAmount]);

    const counterColor =
        messageLength === 0
            ? palette.textSecondary
            : messageLength >= 10 && messageLength <= 500
                ? palette.success
                : palette.danger;

    return (
        <Stack gap="md">
            {requestTitle ? (
                <View
                    style={[
                        styles.requestInfo,
                        {
                            backgroundColor: palette.surfaceMuted,
                            borderColor: palette.border,
                        },
                    ]}
                >
                    <Text style={[styles.requestLabel, { color: palette.textSecondary }]}>Request</Text>
                    <Text
                        style={[styles.requestTitle, { color: palette.textPrimary }]}
                        numberOfLines={2}
                    >
                        {requestTitle}
                    </Text>
                </View>
            ) : null}

            <Stack gap="xs">
                <Text style={[styles.label, { color: palette.textPrimary }]}>Bid amount *</Text>

                <AppInput
                    placeholder="Enter your offer amount"
                    keyboardType="decimal-pad"
                    value={formData.amount}
                    error={fieldErrors.amount ?? null}
                    onChangeText={(value) => handleInputChange("amount", value)}
                    editable={!loading}
                />

                {amountPreview ? (
                    <Text style={[styles.helperText, { color: palette.textSecondary }]}>Your offer: ${amountPreview}</Text>
                ) : null}
            </Stack>

            <Stack gap="xs">
                <Text style={[styles.label, { color: palette.textPrimary }]}>Message *</Text>

                <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                    Explain briefly why you are a good fit for this request.
                </Text>

                <AppInput
                    placeholder="Write a short message..."
                    multiline
                    numberOfLines={5}
                    value={formData.message}
                    error={fieldErrors.message ?? null}
                    onChangeText={(value) => handleInputChange("message", value)}
                    editable={!loading}
                />

                <Text style={[styles.counterText, { color: counterColor }]}>{messageLength}/500</Text>
            </Stack>

            {validationError ? (
                <View
                    style={[
                        styles.errorBox,
                        {
                            backgroundColor: palette.dangerSoft,
                            borderColor: palette.danger,
                        },
                    ]}
                >
                    <Text style={[styles.errorText, { color: palette.danger }]}>{validationError}</Text>
                </View>
            ) : null}

            {error ? (
                <View
                    style={[
                        styles.errorBox,
                        {
                            backgroundColor: palette.dangerSoft,
                            borderColor: palette.danger,
                        },
                    ]}
                >
                    <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text>
                </View>
            ) : null}

            <AppButton
                title={loading ? "Submitting..." : isUpdate ? "Update Bid" : "Place Bid"}
                onPress={handleSubmit}
                disabled={loading || !formData.amount || !formData.message.trim()}
            />
        </Stack>
    );
};

const styles = StyleSheet.create({
    requestInfo: {
        borderWidth: 1,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
    },
    requestLabel: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semibold,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginBottom: theme.spacing.xxs,
    },
    requestTitle: {
        fontSize: theme.typography.fontSize.md,
        lineHeight: theme.typography.lineHeight.md,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    label: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    helperText: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
    },
    counterText: {
        fontSize: theme.typography.fontSize.sm,
        textAlign: "right",
    },
    errorBox: {
        borderWidth: 1,
        borderRadius: theme.radius.md,
        padding: theme.spacing.sm,
    },
    errorText: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
        fontWeight: theme.typography.fontWeight.medium,
    },
});


