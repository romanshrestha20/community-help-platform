import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { Stack, colors, spacing, typography } from "@/design-system";
import LocationPickerField from "@/features/location/components/LocationPickerField";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import {
    CreateHelpRequestData,
    HelpRequest,
    RequestImageUploadInput,
} from "../types/helpRequest.types";
import { RequestPhotoUploadSection } from "./RequestPhotoUploadSection";
import { RequestFormHero } from "./RequestFormHero";
import { RequestFormSection } from "./RequestFormSection";
import { AppCategory } from "@/features/category/types/category.types";

export type RequestFormValues = Omit<CreateHelpRequestData, "location">;
export type RequestFormLocationPickerProps = React.ComponentProps<typeof LocationPickerField>;

export type RequestFormContentProps = {
    title: string;
    subtitle: string;
    values: RequestFormValues;
    categories?: AppCategory[];
    loading?: boolean;
    validationError?: string | null;
    fieldErrors?: Partial<Record<"title" | "description" | "budget" | "location", string>>;
    error?: string | null;
    selectedImages?: RequestImageUploadInput[];
    existingImages?: HelpRequest["images"];
    imageLimit?: number;
    onPickImages: () => void;
    onRemoveImage: (index: number) => void;
    onChangeField: <K extends keyof RequestFormValues>(
        field: K,
        value: RequestFormValues[K]
    ) => void;
    onOpenMapPicker?: () => void;
    locationPickerProps: RequestFormLocationPickerProps;
};

export const RequestFormContent = ({
    title,
    subtitle,
    values,
    categories = [],
    loading = false,
    validationError,
    fieldErrors = {},
    error,
    selectedImages = [],
    existingImages = [],
    imageLimit = 5,
    onPickImages,
    onRemoveImage,
    onChangeField,
    onOpenMapPicker,
    locationPickerProps,
}: RequestFormContentProps) => {
    const { palette } = useThemeContext();

    return (
        <Stack gap="md">
            <RequestFormHero title={title} subtitle={subtitle} />

            <RequestPhotoUploadSection
                loading={loading}
                existingImages={existingImages}
                selectedImages={selectedImages}
                imageLimit={imageLimit}
                onPickImages={onPickImages}
                onRemoveImage={onRemoveImage}
            />

            <RequestFormSection
                title="Details"
                description="Write a clear title and description, then choose the closest category."
            >
                <AppInput
                    label="Title"
                    placeholder="What do you need help with?"
                    value={values.title}
                    error={fieldErrors.title ?? null}
                    onChangeText={(value) => onChangeField("title", value)}
                    editable={!loading}
                />

                <AppInput
                    label="Description"
                    placeholder="Explain the situation, timeline, and anything helpful to know"
                    value={values.description}
                    error={fieldErrors.description ?? null}
                    onChangeText={(value) => onChangeField("description", value)}
                    editable={!loading}
                    multiline
                    numberOfLines={5}
                />

                <Stack gap="sm">
                    <View style={styles.groupHeader}>
                        <Text style={styles.groupTitle}>Category</Text>
                        <Text style={styles.groupMeta}>
                            {categories.length ? "Select one" : "Loading categories"}
                        </Text>
                    </View>

                    <View style={styles.categoryButtons}>
                        {categories.map((category) => (
                            <AppButton
                                key={category.id}
                                title={category.name}
                                onPress={() => onChangeField("categoryId", category.id)}
                                variant={values.categoryId === category.id ? "primary" : "secondary"}
                                fullWidth={false}
                            />
                        ))}
                    </View>

                    <AppInput
                        label="Budget"
                        placeholder="Optional amount"
                        keyboardType="decimal-pad"
                        value={values.budget?.toString() || ""}
                        error={fieldErrors.budget ?? null}
                        onChangeText={(value) =>
                            onChangeField("budget", value ? parseFloat(value) : undefined)
                        }
                    />
                </Stack>

            </RequestFormSection>

            <RequestFormSection
                title="Location"
                description="Pick where the help is needed so nearby helpers can find it."
            >
                {onOpenMapPicker ? (
                    <AppButton
                        title="Choose on map"
                        onPress={onOpenMapPicker}
                        variant="secondary"
                    />
                ) : null}
                <LocationPickerField {...locationPickerProps} />
            </RequestFormSection>

            {validationError || error ? (
                <RequestFormSection
                    title="Form issue"
                    description="Fix the highlighted problem before you post the request."
                    style={{
                        borderColor: palette.dangerSoft,
                        backgroundColor: palette.dangerSoft,
                    }}
                >
                    <Text style={[styles.errorText, { color: palette.danger }]}>
                        {fieldErrors.location || validationError || error}
                    </Text>
                </RequestFormSection>
            ) : null}
        </Stack>
    );
};

const styles = StyleSheet.create({
    groupHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    groupTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
        color: colors.textPrimary,
    },
    groupMeta: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.semibold,
        color: colors.textSecondary,
    },
    categoryButtons: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    errorText: {
        fontSize: typography.fontSize.sm,
        lineHeight: 20,
    },
});
