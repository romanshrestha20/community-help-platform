import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppModal } from "@/components/ui/AppModal";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";
import { showInfoToast } from "@/utils/toast";
import { useFormValidation } from "@/utils/validation/useFormValidation";
import { useHelpRequest } from "../hooks/helpRequest.hook";
import {
    CreateHelpRequestData,
    HelpRequest,
    RequestImageUploadInput,
} from "../types/helpRequest.types";
import { validateRequestDraft } from "../utils/requestValidation";
import { RequestFormContent, RequestFormValues } from "./RequestFormContent";
import { RequestFormTrigger } from "./RequestFormTrigger";

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
    const { validationError, setValidationError, clearValidationError } = useFormValidation();
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
        clearValidationError();
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
            // iOS multi-select can hang on Done in some dev-client/simulator states.
            allowsMultipleSelection: Platform.OS !== "ios",
            selectionLimit: Platform.OS === "ios" ? 1 : remainingSlots,
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
        const validation = validateRequestDraft({
            title: values.title,
            description: values.description,
            budgetInput: values.budget ? String(values.budget) : "",
            location: locationPicker.value,
        });

        if (validation) {
            setValidationError(validation);
            return;
        }

        const location = locationPicker.value;
        if (!location) {
            // Already validated above; this guards against stale state between validation and submit.
            return;
        }

        try {
            clearValidationError();
            const savedRequest = await onSubmit({
                ...values,
                location,
                city: location.city ?? "",
                country: location.country ?? "",
            });

            if (!savedRequest?.id) {
                setValidationError("Could not save request. Please check the form and try again.");
                return;
            }

            if (selectedImages.length) {
                await addHelpRequestImages(savedRequest.id, selectedImages);
            }

            setSelectedImages([]);
            setModalVisible(false);
        } catch (submitError) {
            setValidationError(
                submitError instanceof Error
                    ? submitError.message
                    : "Could not save request. Please try again."
            );
        }
    };

    return (
        <>
            <RequestFormTrigger
                title={initialData ? "Edit request" : "Create request"}
                compact={compactTrigger}
                onPress={() => setModalVisible(true)}
            />

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
