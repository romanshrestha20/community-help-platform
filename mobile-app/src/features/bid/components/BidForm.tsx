import React, { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { Card } from "@/design-system/layout/Card";
import { AppInput } from "@/components/ui/AppInput";
import { Stack } from "@/design-system/layout/Stack";
import { AppButton } from "@/components/ui/AppButton";
import { spacing, colors } from "@/design-system/tokens";
import { CreateBidData, UpdateBidData, Bid } from "../types/bid.types";
import { Toast } from "react-native-toast-message/lib/src/Toast";

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
    const [formData, setFormData] = useState({
        helpRequestId: initialData?.helpRequestId || helpRequestId || "",
        amount: initialData?.amount?.toString() || "",
        message: initialData?.message || "",
    });

    const [validationError, setValidationError] = useState<string | null>(null);

    const validateForm = (): boolean => {
        const amount = parseFloat(formData.amount);

        if (!formData.amount || isNaN(amount) || amount <= 0) {
            setValidationError("Bid amount must be greater than 0");
            return false;
        }

        if (!formData.message.trim()) {
            setValidationError("Message is required");
            return false;
        }

        if (formData.message.length < 10) {
            setValidationError("Message must be at least 10 characters");
            return false;
        }

        if (formData.message.length > 500) {
            setValidationError("Message must be less than 500 characters");
            return false;
        }


        return true;
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        setValidationError(null);
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const data = isUpdate
            ? {
                amount: parseFloat(formData.amount),
                message: formData.message,
            }
            : {
                helpRequestId: formData.helpRequestId,
                amount: parseFloat(formData.amount),
                message: formData.message,
            };

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

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Card>
                <Stack gap="md">
                    {/* Request Info */}
                    {requestTitle && (
                        <Card style={{ backgroundColor: colors.primary + "10" }}>
                            <Stack gap="sm">
                                <Text >
                                    For Request
                                </Text>
                                <Text

                                    numberOfLines={2}
                                >
                                    {requestTitle}
                                </Text>
                            </Stack>
                        </Card>
                    )}

                    {/* Bid Amount */}
                    <Stack gap="sm">
                        <Text>Bid Amount (USD) *</Text>
                        <AppInput
                            placeholder="Enter your bid amount"
                            keyboardType="decimal-pad"
                            value={formData.amount}
                            onChangeText={(value) => handleInputChange("amount", value)}
                            editable={!loading}
                        />
                        {formData.amount && !isNaN(parsedAmount) && (
                            <Text >
                                ${parsedAmount.toFixed(2)}
                            </Text>
                        )}
                    </Stack>

                    {/* Message */}
                    <Stack gap="sm">
                        <Text >Message *</Text>
                        <AppInput
                            placeholder="Why are you a good fit for this request? (10-500 chars)"
                            multiline
                            numberOfLines={5}
                            value={formData.message}
                            onChangeText={(value) => handleInputChange("message", value)}
                            editable={!loading}
                        />
                        <Text
                            style={[

                                {
                                    color:
                                        messageLength >= 10 && messageLength <= 500
                                            ? colors.success
                                            : messageLength > 500
                                                ? colors.danger
                                                : colors.textSecondary,
                                },
                            ]}
                        >
                            {messageLength}/500 characters
                        </Text>
                    </Stack>

                    {/* Validation Error */}
                    {validationError && (
                        <Card style={{ backgroundColor: colors.danger + "20" }}>
                            <Text >
                                {validationError}
                            </Text>
                        </Card>
                    )}
                    {/* Submit */}
                    <AppButton
                        title={loading ? "Submitting..." : isUpdate ? "Update Bid" : "Place Bid"}
                        onPress={handleSubmit}
                        disabled={loading || !formData.amount || !formData.message.trim()}
                    />
                </Stack>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: spacing.lg,
    },
});
