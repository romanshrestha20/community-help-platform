import React, { useState } from "react";
import { ScrollView, StyleSheet, View, Text } from "react-native";
import { Stack } from "@/design-system/layout/Stack";
import { Card } from "@/design-system/layout/Card";
import { AppInput } from "@/components/ui/AppInput";
import { AppButton } from "@/components/ui/AppButton";
import { spacing, colors, typography } from "@/design-system";
import { CreateHelpRequestData, HelpRequest } from "../types/helpRequest.types";

interface RequestFormProps {
    initialData?: HelpRequest;
    onSubmit: (data: CreateHelpRequestData) => Promise<void>;
    loading?: boolean;
    error?: string | null;
}

export const RequestForm: React.FC<RequestFormProps> = ({
    initialData,
    onSubmit,
    loading = false,
    error = null,
}) => {
    const [formData, setFormData] = useState<CreateHelpRequestData>({
        title: initialData?.title || "",
        description: initialData?.description || "",
        category: initialData?.category || "FOOD",
        budget: initialData?.budget,
        city: initialData?.city || "",
        country: initialData?.country || "",
    });

    const [validationError, setValidationError] = useState<string | null>(null);

    const categories = ["FOOD", "MEDICAL", "EDUCATION", "OTHER"];

    const validateForm = (): boolean => {
        if (!formData.title.trim()) {
            setValidationError("Title is required");
            return false;
        }
        if (!formData.description.trim()) {
            setValidationError("Description is required");
            return false;
        }
        if (formData.budget && formData.budget <= 0) {
            setValidationError("Budget must be greater than 0");
            return false;
        }
        return true;
    };

    const handleInputChange = (field: keyof CreateHelpRequestData, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        setValidationError(null);
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        await onSubmit(formData);
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Card>
                <Stack gap="md">
                    {/* Title */}
                    <Stack gap="sm">
                        <Text style={[styles.captionText, { fontWeight: typography.fontWeight.semibold }]}>Title *</Text>
                        <AppInput
                            placeholder="What do you need help with?"
                            value={formData.title}
                            onChangeText={(value) => handleInputChange("title", value)}
                            editable={!loading}
                        />
                    </Stack>

                    {/* Description */}
                    <Stack gap="sm">
                        <Text style={[styles.captionText, { fontWeight: typography.fontWeight.semibold }]}>Description *</Text>
                        <AppInput
                            placeholder="Describe your request in detail"
                            multiline
                            numberOfLines={4}
                            value={formData.description}
                            onChangeText={(value) => handleInputChange("description", value)}
                            editable={!loading}
                        />
                    </Stack>

                    {/* Category */}
                    <Stack gap="sm">
                        <Text style={[styles.captionText, { fontWeight: typography.fontWeight.semibold }]}>Category *</Text>
                        <AppInput
                            placeholder="Select category"
                            value={formData.category}
                            editable={!loading}
                        />
                        <View style={styles.categoryButtons}>
                            {categories.map((cat) => (
                                <AppButton
                                    key={cat}
                                    title={cat}
                                    onPress={() => handleInputChange("category", cat)}
                                    variant={formData.category === cat ? "primary" : "danger"}
                                    fullWidth={false}
                                />
                            ))}
                        </View>
                    </Stack>

                    {/* Budget */}
                    <Stack gap="sm">
                        <Text style={[styles.captionText, { fontWeight: typography.fontWeight.semibold }]}>Budget (USD)</Text>
                        <AppInput
                            placeholder="Enter budget amount"
                            keyboardType="decimal-pad"
                            value={formData.budget?.toString() || ""}
                            onChangeText={(value) =>
                                handleInputChange("budget", value ? parseFloat(value) : undefined)
                            }
                            editable={!loading}
                        />
                    </Stack>

                    {/* City */}
                    <Stack gap="sm">
                        <Text style={[styles.captionText, { fontWeight: typography.fontWeight.semibold }]}>City</Text>
                        <AppInput
                            placeholder="Enter city"
                            value={formData.city}
                            onChangeText={(value) => handleInputChange("city", value)}
                            editable={!loading}
                        />
                    </Stack>

                    {/* Country */}
                    <Stack gap="sm">
                        <Text style={[styles.captionText, { fontWeight: typography.fontWeight.semibold }]}>Country</Text>
                        <AppInput
                            placeholder="Enter country"
                            value={formData.country}
                            onChangeText={(value) => handleInputChange("country", value)}
                            editable={!loading}
                        />
                    </Stack>

                    {/* Validation Error */}
                    {validationError && (
                        <Card style={{ backgroundColor: colors.dangerSoft }}>
                            <Text style={[styles.captionText, { color: colors.danger }]}>
                                {validationError}
                            </Text>
                        </Card>
                    )}

                    {/* Error */}
                    {error && (
                        <Card style={{ backgroundColor: colors.dangerSoft }}>
                            <Text style={[styles.captionText, { color: colors.danger }]}>{error}</Text>
                        </Card>
                    )}

                    {/* Submit */}
                    <AppButton
                        title={loading ? "Saving..." : initialData ? "Update Request" : "Create Request"}
                        onPress={handleSubmit}
                        disabled={loading}
                    />
                </Stack>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    captionText: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        lineHeight: typography.lineHeight.sm,
        fontWeight: typography.fontWeight.regular,
        color: colors.textPrimary,
    },
    container: {
        padding: spacing.lg,
    },
    categoryButtons: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
});
