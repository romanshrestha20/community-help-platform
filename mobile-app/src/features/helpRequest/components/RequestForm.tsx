import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack } from "@/design-system/layout/Stack";
import { Card } from "@/design-system/layout/Card";
import { AppModal } from "@/components/ui/AppModal";
import { AppInput } from "@/components/ui/AppInput";
import { AppButton } from "@/components/ui/AppButton";
import { spacing, colors, typography, theme } from "@/design-system";
import { CreateHelpRequestData, HelpRequest } from "../types/helpRequest.types";
import LocationPickerField from "@/features/location/components/LocationPickerField";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type RequestFormData = Omit<CreateHelpRequestData, "location">;

interface RequestFormProps {
    initialData?: HelpRequest;
    onSubmit: (data: CreateHelpRequestData) => Promise<void>;
    loading?: boolean;
    error?: string | null;
    compactTrigger?: boolean;
}

export const RequestForm: React.FC<RequestFormProps> = ({
    initialData,
    onSubmit,
    loading = false,
    error = null,
    compactTrigger = false,
}) => {
    const { palette } = useThemeContext();
    const locationPicker = useLocationPicker({
        initialValue: initialData?.location ?? null,
    });

    const [formData, setFormData] = useState<RequestFormData>({
        title: initialData?.title || "",
        description: initialData?.description || "",
        category: initialData?.category || "FOOD",
        budget: initialData?.budget,
        city: initialData?.city || initialData?.location?.city || "",
        country: initialData?.country || initialData?.location?.country || "",
    });

    const [validationError, setValidationError] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const categories = ["FOOD", "MEDICAL", "EDUCATION", "OTHER"];

    const handleInputChange = (field: keyof RequestFormData, value: any) => {
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
        if (!locationPicker.value) {
            setValidationError("Please select a location");
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        const location = locationPicker.value;
        if (!location) {
            setValidationError("Please select a location");
            return;
        }

        await onSubmit({
            ...formData,
            location,
            city: location.city ?? "",
            country: location.country ?? "",
        });
        setModalVisible(false);
    };

    return (
        <>
            {compactTrigger ? (
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Create request"
                    onPress={() => setModalVisible(true)}
                    style={[styles.compactTileButton, { backgroundColor: `${palette.primary}14` }]}
                    activeOpacity={0.82}
                >
                    <Ionicons name="add-circle-outline" size={18} color={palette.primary} />
                    <Text style={[styles.compactTileText, { color: palette.primary }]}>+ Request</Text>
                </TouchableOpacity>
            ) : (
                <Card style={styles.placeholderCard}>
                    <View style={styles.placeholderHeader}>
                        <Text style={styles.placeholderTitle}>Create Request</Text>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Create request"
                            onPress={() => setModalVisible(true)}
                            style={styles.quickActionIconButton}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add" size={22} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                </Card>
            )}

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
                        <LocationPickerField
                            value={locationPicker.value}
                            loading={locationPicker.loading}
                            error={locationPicker.error}
                            onUseCurrentLocation={locationPicker.useCurrentLocation}
                            streetQuery={locationPicker.streetQuery}
                            onStreetQueryChange={locationPicker.setStreetQuery}
                            suggestions={locationPicker.suggestions}
                            suggestionsLoading={locationPicker.suggestionsLoading}
                            onSelectSuggestion={locationPicker.selectSuggestion}
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
                            variant="primary"
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
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        marginVertical: spacing.xs,
        borderRadius: theme.radius.md,
        backgroundColor: colors.surfaceMuted,
    },
    placeholderTitle: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
        color: colors.textPrimary,
    },
    placeholderHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    quickActionIconButton: {
        width: 44,
        height: 44,
        borderRadius: theme.radius.fill,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    compactTileButton: {
        height: 48,
        borderRadius: theme.radius.md,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
    },
    compactTileText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
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