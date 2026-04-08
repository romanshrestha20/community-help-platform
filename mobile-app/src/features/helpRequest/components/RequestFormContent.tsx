import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { Card, Stack, spacing, colors, typography, theme } from "@/design-system";
import LocationPickerField from "@/features/location/components/LocationPickerField";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import {
    CreateHelpRequestData,
    HelpRequest,
    RequestImageUploadInput,
} from "../types/helpRequest.types";
import { RequestPhotoUploadSection } from "./RequestPhotoUploadSection";

export type RequestFormValues = Omit<CreateHelpRequestData, "location">;
export type RequestFormCategory = RequestFormValues["category"];
export type RequestFormLocationPickerProps = React.ComponentProps<typeof LocationPickerField>;

export type RequestFormContentProps = {
    title: string;
    subtitle: string;
    values: RequestFormValues;
    categories?: RequestFormCategory[];
    loading?: boolean;
    validationError?: string | null;
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
    locationPickerProps: RequestFormLocationPickerProps;
};

type FormSectionProps = {
    title: string;
    description?: string;
    children: React.ReactNode;
};

const DEFAULT_CATEGORIES: RequestFormCategory[] = ["FOOD", "MEDICAL", "EDUCATION", "OTHER"];

const FormSection = ({ title, description, children }: FormSectionProps) => (
    <Card style={styles.sectionCard}>
        <Stack gap="sm">
            <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleWrap}>
                    <Text style={styles.sectionTitle}>{title}</Text>
                    {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
                </View>
            </View>
            {children}
        </Stack>
    </Card>
);

export const RequestFormContent = ({
    title,
    subtitle,
    values,
    categories = DEFAULT_CATEGORIES,
    loading = false,
    validationError,
    error,
    selectedImages = [],
    existingImages = [],
    imageLimit = 5,
    onPickImages,
    onRemoveImage,
    onChangeField,
    locationPickerProps,
}: RequestFormContentProps) => {
    const { palette } = useThemeContext();

    return (
        <Stack gap="md">
            <View
                style={[
                    styles.heroCard,
                    { backgroundColor: palette.surfaceMuted, borderColor: palette.border },
                ]}
            >
                <View style={[styles.heroIcon, { backgroundColor: palette.primary }]}>
                    <Ionicons name="document-text-outline" size={18} color={palette.textInverse} />
                </View>
                <View style={styles.heroCopy}>
                    <Text style={[styles.heroTitle, { color: palette.textPrimary }]}>{title}</Text>
                    <Text style={[styles.heroSubtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
                </View>
            </View>

            <RequestPhotoUploadSection
                loading={loading}
                existingImages={existingImages}
                selectedImages={selectedImages}
                imageLimit={imageLimit}
                onPickImages={onPickImages}
                onRemoveImage={onRemoveImage}
            />

            <FormSection
                title="Details"
                description="Write a clear title and description, then choose the closest category."
            >
                <AppInput
                    label="Title"
                    placeholder="What do you need help with?"
                    value={values.title}
                    onChangeText={(value) => onChangeField("title", value)}
                    editable={!loading}
                />

                <AppInput
                    label="Description"
                    placeholder="Explain the situation, timeline, and anything helpful to know"
                    value={values.description}
                    onChangeText={(value) => onChangeField("description", value)}
                    editable={!loading}
                    multiline
                    numberOfLines={5}
                />

                <Stack gap="sm">
                    <View style={styles.groupHeader}>
                        <Text style={styles.groupTitle}>Category</Text>
                        <Text style={styles.groupMeta}>Select one</Text>
                    </View>

                    <View style={styles.categoryButtons}>
                        {categories.map((category) => (
                            <AppButton
                                key={category}
                                title={category}
                                onPress={() => onChangeField("category", category)}
                                variant={values.category === category ? "primary" : "secondary"}
                                fullWidth={false}
                            />
                        ))}
                    </View>

                    <AppInput
                        label="Budget"
                        placeholder="Optional amount"
                        keyboardType="decimal-pad"
                        value={values.budget?.toString() || ""}
                        onChangeText={(value) =>
                            onChangeField("budget", value ? parseFloat(value) : undefined)
                        }
                    />
                </Stack>
            </FormSection>



            <FormSection
                title="Location"
                description="Pick where the help is needed so nearby helpers can find it."
            >
                <LocationPickerField {...locationPickerProps} />
            </FormSection>

            {validationError || error ? (
                <Card
                    style={[
                        styles.errorCard,
                        {
                            borderColor: palette.dangerSoft,
                            backgroundColor: palette.dangerSoft,
                        },
                    ]}
                >
                    <Text style={[styles.errorText, { color: palette.danger }]}>
                        {validationError || error}
                    </Text>
                </Card>
            ) : null}
        </Stack>
    );
};

const styles = StyleSheet.create({
    heroCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
    },
    heroIcon: {
        width: 42,
        height: 42,
        borderRadius: theme.radius.fill,
        alignItems: "center",
        justifyContent: "center",
    },
    heroCopy: {
        flex: 1,
    },
    heroTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
    heroSubtitle: {
        marginTop: 4,
        fontSize: typography.fontSize.sm,
        lineHeight: 20,
    },
    sectionCard: {
        padding: spacing.md,
        borderRadius: theme.radius.lg,
    },
    sectionHeader: {
        gap: 2,
    },
    sectionTitleWrap: {
        gap: 2,
    },
    sectionTitle: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
        color: colors.textPrimary,
    },
    sectionDescription: {
        fontSize: typography.fontSize.xs,
        lineHeight: 18,
        color: colors.textSecondary,
    },
    sectionGroup: {
        gap: spacing.sm,
    },
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
    errorCard: {
        borderWidth: 1,
        borderRadius: theme.radius.lg,
        padding: spacing.md,
    },
    errorText: {
        fontSize: typography.fontSize.sm,
        lineHeight: 20,
    },
});
