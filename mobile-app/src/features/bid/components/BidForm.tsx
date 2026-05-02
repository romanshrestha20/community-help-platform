import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppInput } from "@/components/ui/AppInput";
import { AppButton } from "@/components/ui/AppButton";
import { Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useFormValidation } from "@/utils/validation/useFormValidation";
import { CreateBidData, UpdateBidData, Bid } from "../types/bid.types";
import { validateBidDraftFields } from "../utils/bidValidation";
import { mapBidErrorMessage } from "../utils/bidErrorMessage";
import { formEvents } from "@/utils/formEvents";

interface BidFormProps {
    helpRequestId?: string;
    requestTitle?: string;
    initialData?: Bid;
    onSubmit: (data: CreateBidData | UpdateBidData) => Promise<void>;
    onCancel?: () => void;
    loading?: boolean;
    error?: string | null;
    isUpdate?: boolean;
}

export const BidForm: React.FC<BidFormProps> = ({
    helpRequestId,
    requestTitle,
    initialData,
    onSubmit,
    onCancel,
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
            formEvents.formValidationFailed("bid_form", Object.keys(validation.fieldErrors)[0]);
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
        formEvents.formSubmitStarted("bid_form");
        await onSubmit(data).catch((submitError) => {
            const friendly = mapBidErrorMessage(submitError);
            setValidationError(friendly);
            formEvents.formSubmitFailed("bid_form", friendly);
            throw submitError;
        });
        formEvents.formSubmitSuccess("bid_form");

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
            <Text style={[styles.caption, { color: palette.textSecondary }]}>
                Fields marked * are required
            </Text>

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
                    <Text style={[styles.requestLabel, { color: palette.textSecondary }]}>
                        Request
                    </Text>
                    <Text
                        style={[styles.requestTitle, { color: palette.textPrimary }]}
                        numberOfLines={2}
                    >
                        {requestTitle}
                    </Text>
                </View>
            ) : null}

            <View
                style={[
                    styles.sectionCard,
                    {
                        borderColor: palette.border,
                        backgroundColor: palette.surfaceSecondary,
                    },
                ]}
            >
                <AppInput
                    label="Offer amount"
                    required
                    helperText="Enter the amount you want to offer in EUR."
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={formData.amount}
                    error={fieldErrors.amount ?? null}
                    onChangeText={(value) => handleInputChange("amount", value)}
                    editable={!loading}
                />

                {amountPreview ? (
                    <Text style={[styles.helperTextStrong, { color: palette.textPrimary }]}>
                        Your offer: EUR {amountPreview}
                    </Text>
                ) : null}
            </View>

            <View
                style={[
                    styles.sectionCard,
                    {
                        borderColor: palette.border,
                        backgroundColor: palette.surfaceSecondary,
                    },
                ]}
            >
                <AppInput
                    label="Pitch message"
                    required
                    helperText="Explain why you’re a good fit and when you can help."
                    placeholder="Tell the requester why you are a good fit."
                    multiline
                    numberOfLines={5}
                    autoFocus
                    value={formData.message}
                    error={fieldErrors.message ?? null}
                    onChangeText={(value) => handleInputChange("message", value)}
                    editable={!loading}
                />

                <Text style={[styles.helperText, { color: palette.textSecondary }]}> 
                    Contact information is shared only after the requester accepts your offer.
                </Text>

                <Text style={[styles.counterText, { color: counterColor }]}>{messageLength}/500</Text>
            </View>

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
                    <Text style={[styles.errorText, { color: palette.danger }]}>{mapBidErrorMessage(error)}</Text>
                </View>
            ) : null}

            {onCancel ? (
                <View style={styles.actionsRow}>
                    <View style={styles.actionButton}>
                        <AppButton
                            title="Cancel"
                            onPress={onCancel}
                            variant="secondary"
                            fullWidth
                            disabled={loading}
                        />
                    </View>

                    <View style={styles.actionButton}>
                        <AppButton
                            title={loading ? "Sending..." : isUpdate ? "Save Bid" : "Send Offer"}
                            onPress={handleSubmit}
                            fullWidth
                            disabled={loading || !formData.amount || !formData.message.trim()}
                        />
                    </View>
                </View>
            ) : (
                <AppButton
                    title={loading ? "Sending..." : isUpdate ? "Save Bid" : "Send Offer"}
                    onPress={handleSubmit}
                    disabled={loading || !formData.amount || !formData.message.trim()}
                />
            )}
        </Stack>
    );
};

const styles = StyleSheet.create({
    caption: {
        fontSize: theme.typography.fontSize.xs,
        lineHeight: theme.typography.lineHeight.xs,
    },
    requestInfo: {
        borderWidth: 1,
        borderRadius: theme.radius.md,
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
    sectionCard: {
        borderWidth: 1,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        gap: theme.spacing.xs,
    },
    helperText: {
        fontSize: theme.typography.fontSize.xs,
        lineHeight: theme.typography.lineHeight.xs,
    },
    helperTextStrong: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    counterText: {
        fontSize: theme.typography.fontSize.xs,
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
    actionsRow: {
        flexDirection: "row",
        gap: theme.spacing.sm,
    },
    actionButton: {
        flex: 1,
    },
});
