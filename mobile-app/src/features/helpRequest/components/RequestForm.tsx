import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";

import { AppButton } from "@/components/ui/AppButton";
import { AppModal } from "@/components/ui/AppModal";
import { Card, colors, spacing, theme, typography } from "@/design-system";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { showInfoToast } from "@/utils/toast";
import { useHelpRequest } from "../hooks/helpRequest.hook";
import {
    CreateHelpRequestData,
    HelpRequest,
    RequestImageUploadInput,
} from "../types/helpRequest.types";
import { RequestFormContent, RequestFormValues } from "./RequestFormContent";

const MAX_REQUEST_IMAGES = 5;

interface RequestFormProps {
    initialData?: HelpRequest;
    onSubmit: (data: CreateHelpRequestData) => Promise<HelpRequest | null>;
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
    const { addHelpRequestImages } = useHelpRequest();
    const existingImages = initialData?.images ?? [];
    const locationPicker = useLocationPicker({
        initialValue: initialData?.location ?? null,
    });

    const [values, setValues] = useState<RequestFormValues>({
        title: initialData?.title || "",
        description: initialData?.description || "",
        category: initialData?.category || "FOOD",
        budget: initialData?.budget,
        city: initialData?.city || initialData?.location?.city || "",
        country: initialData?.country || initialData?.location?.country || "",
    });

    const [selectedImages, setSelectedImages] = useState<RequestImageUploadInput[]>([]);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const triggerTitle = initialData ? "Edit request" : "Create request";
    const triggerSubtitle = initialData
        ? "Refine the details and add more photos."
        : "Describe the need, add photos, and get help faster.";

    const handleChangeField = <K extends keyof RequestFormValues>(
        field: K,
        value: RequestFormValues[K]
    ) => {
        setValues((prev) => ({ ...prev, [field]: value }));
        setValidationError(null);
    };

    const validateForm = () => {
        if (!values.title.trim() || !values.description.trim()) {
            setValidationError("Title and Description are required");
            return false;
        }

        if (values.budget && values.budget <= 0) {
            setValidationError("Budget must be greater than 0");
            return false;
        }

        if (!locationPicker.value) {
            setValidationError("Please select a location");
            return false;
        }

        return true;
    };

    const handlePickImages = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            showInfoToast("Permission required", "Please allow access to your photo library.");
            return;
        }

        const remainingSlots = MAX_REQUEST_IMAGES - selectedImages.length;

        if (remainingSlots <= 0) {
            showInfoToast("Image limit reached", `You can upload up to ${MAX_REQUEST_IMAGES} images.`);
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: remainingSlots,
            quality: 0.85,
        });

        if (result.canceled || !result.assets.length) return;

        const nextImages = result.assets.slice(0, remainingSlots).map((asset, index) => ({
            uri: asset.uri,
            name: asset.fileName ?? `request-image-${Date.now()}-${index}.jpg`,
            type: asset.mimeType ?? "image/jpeg",
            webFile: (asset as any).file ?? undefined,
        }));

        setSelectedImages((prev) => [...prev, ...nextImages]);
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setSelectedImages((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const location = locationPicker.value;
        if (!location) {
            setValidationError("Please select a location");
            return;
        }

        const savedRequest = await onSubmit({
            ...values,
            location,
            city: location.city ?? "",
            country: location.country ?? "",
        });

        if (savedRequest?.id && selectedImages.length) {
            await addHelpRequestImages(savedRequest.id, selectedImages);
        }

        setSelectedImages([]);
        setModalVisible(false);
    };

    return (
        <>
            {compactTrigger ? (
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Create request"
                    onPress={() => setModalVisible(true)}
                    style={[
                        styles.compactTileButton,
                        {
                            backgroundColor: palette.surfaceMuted,
                            borderColor: palette.border,
                        },
                    ]}
                    activeOpacity={0.82}
                >
                    <View style={[styles.compactTileIcon, { backgroundColor: palette.primary }]}>
                        <Ionicons name="add" size={18} color={palette.textInverse} />
                    </View>
                    <View style={styles.compactTileContent}>
                        <Text style={[styles.compactTileTitle, { color: palette.textPrimary }]}>Request help</Text>
                        <Text style={[styles.compactTileText, { color: palette.textSecondary }]}>Post a new request</Text>
                    </View>
                </TouchableOpacity>
            ) : (
                <Card style={styles.placeholderCard}>
                    <View style={styles.placeholderHeader}>
                        <View style={styles.placeholderIconWrap}>
                            <Ionicons name="sparkles-outline" size={20} color={palette.primary} />
                        </View>
                        <View style={styles.placeholderCopy}>
                            <Text style={[styles.placeholderTitle, { color: palette.textPrimary }]}>Create request</Text>
                            <Text style={[styles.placeholderSubtitle, { color: palette.textSecondary }]}>Share what you need and attach a few photos for context.</Text>
                        </View>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Create request"
                            onPress={() => setModalVisible(true)}
                            style={[
                                styles.quickActionIconButton,
                                { borderColor: palette.border, backgroundColor: palette.surface },
                            ]}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="arrow-up-right-box" size={18} color={palette.textPrimary} />
                        </TouchableOpacity>
                    </View>
                </Card>
            )}

            <AppModal
                visible={modalVisible}
                title={initialData ? "Edit Request" : "Create Request"}
                onClose={() => setModalVisible(false)}
                scrollable
                actions={
                    <>
                        <AppButton
                            title="Cancel"
                            onPress={() => setModalVisible(false)}
                            variant="secondary"
                            fullWidth={false}
                            disabled={loading}
                        />
                        <AppButton
                            title={loading ? "Saving..." : initialData ? "Update request" : "Post request"}
                            onPress={handleSubmit}
                            variant="primary"
                            fullWidth={false}
                            disabled={loading}
                        />
                    </>
                }
            >
                <RequestFormContent
                    title={triggerTitle}
                    subtitle={triggerSubtitle}
                    values={values}
                    loading={loading}
                    validationError={validationError}
                    error={error}
                    selectedImages={selectedImages}
                    existingImages={existingImages}
                    imageLimit={MAX_REQUEST_IMAGES}
                    onPickImages={handlePickImages}
                    onRemoveImage={handleRemoveImage}
                    onChangeField={handleChangeField}
                    locationPickerProps={{
                        ...locationPicker,
                        onUseCurrentLocation: locationPicker.useCurrentLocation,
                    }}
                />
            </AppModal>
        </>
    );
};

const styles = StyleSheet.create({
    placeholderCard: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        marginVertical: spacing.xs,
        borderRadius: theme.radius.lg,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
    },
    placeholderHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    placeholderIconWrap: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.fill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    placeholderCopy: {
        flex: 1,
    },
    placeholderTitle: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
    },
    placeholderSubtitle: {
        marginTop: 2,
        fontSize: typography.fontSize.xs,
        lineHeight: 18,
    },
    quickActionIconButton: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.fill,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
    },
    compactTileButton: {
        minHeight: 56,
        borderRadius: theme.radius.lg,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
    },
    compactTileIcon: {
        width: 34,
        height: 34,
        borderRadius: theme.radius.fill,
        alignItems: "center",
        justifyContent: "center",
    },
    compactTileContent: {
        flex: 1,
    },
    compactTileTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
    },
    compactTileText: {
        marginTop: 2,
        fontSize: typography.fontSize.xs,
    },
});
