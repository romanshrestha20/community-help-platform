import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Stack } from "@/design-system/layout/Stack";
import { Card } from "@/design-system/layout/Card";
import { AppModal } from "@/components/ui/AppModal";
import { AppInput } from "@/components/ui/AppInput";
import { AppButton } from "@/components/ui/AppButton";
import { spacing, colors, typography, theme } from "@/design-system";
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
    const [modalVisible, setModalVisible] = useState(false);

    const categories = ["FOOD", "MEDICAL", "EDUCATION", "OTHER"];

    const handleInputChange = (field: keyof CreateHelpRequestData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setValidationError(null);
    };

    const validateForm = (): boolean => {
        if (!formData.title.trim() || !formData.description.trim()) {
            setValidationError("Title and Description are required");
            return false;
        }
        if (formData.budget && formData.budget <= 0) {
            setValidationError("Budget must be greater than 0");
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        await onSubmit(formData);
        setModalVisible(false);
    };

    return (
        <>
            {/* Facebook-style placeholder card */}
            <Card style={styles.placeholderCard}>
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <Text style={styles.placeholderText}>
                        What is your request? (Tap to create)
                    </Text>
                </TouchableOpacity>
            </Card>

            {/* Modal with full form */}
            <AppModal
                visible={modalVisible}
                title={initialData ? "Edit Request" : "Create Request"}
                onClose={() => setModalVisible(false)}
               >
                <ScrollView contentContainerStyle={{ paddingVertical: spacing.md }}>
                    <Stack gap="md">
                        {/* Title */}
                        <AppInput
                            placeholder="Title"
                            value={formData.title}
                            onChangeText={(v) => handleInputChange("title", v)}
                            editable={!loading}
                        />
                        {/* Description */}
                        <AppInput
                            placeholder="Description"
                            value={formData.description}
                            onChangeText={(v) => handleInputChange("description", v)}
                            editable={!loading}
                            multiline
                            numberOfLines={4}
                        />
                        {/* Category */}
                        <Stack gap="sm">
                            <Text style={styles.label}>Category</Text>
                            <View style={styles.categoryButtons}>
                                {categories.map((cat) => (
                                    <AppButton
                                        key={cat}
                                        title={cat}
                                        onPress={() => handleInputChange("category", cat)}
                                        variant={formData.category === cat ? "primary" : "ghost"}
                                        fullWidth={false}
                                    />
                                ))}
                            </View>
                        </Stack>
                        {/* Budget */}
                        <AppInput
                            placeholder="Budget (USD)"
                            keyboardType="decimal-pad"
                            value={formData.budget?.toString() || ""}
                            onChangeText={(v) =>
                                handleInputChange("budget", v ? parseFloat(v) : undefined)
                            }
                        />
                        {/* City */}
                        <AppInput
                            placeholder="City"
                            value={formData.city}
                            onChangeText={(v) => handleInputChange("city", v)}
                        />
                        {/* Country */}
                        <AppInput
                            placeholder="Country"
                            value={formData.country}
                            onChangeText={(v) => handleInputChange("country", v)}
                        />

                        {/* Validation/Error */}
                        {validationError && (
                            <Text style={[styles.errorText]}>{validationError}</Text>
                        )}
                        {error && <Text style={[styles.errorText]}>{error}</Text>}

                        {/* Submit */}
                        <AppButton
                            title={loading ? "Saving..." : initialData ? "Update" : "Post Request"}
                            onPress={handleSubmit}
                            disabled={loading}
                        />
                        
                        
                    </Stack>
                </ScrollView>
            </AppModal>
        </>
    );
};

const styles = StyleSheet.create({
    placeholderCard: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginVertical: spacing.sm,
        borderRadius: theme.radius.md,
        backgroundColor: colors.surfaceMuted,
    },
    placeholderText: {
        fontSize: typography.fontSize.md,
        color: colors.textSecondary,
    },
    label: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
        color: colors.textPrimary,
    },
    categoryButtons: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    errorText: {
        color: colors.danger,
        fontSize: typography.fontSize.sm,
    },
});