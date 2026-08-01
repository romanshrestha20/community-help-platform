import React, { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Platform, StyleSheet, View } from "react-native";
import { usePathname, useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppModal } from "@/components/ui/AppModal";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";
import { useLocationPickerScreenStore } from "@/features/location/store/locationPickerScreen.store";
import { showInfoToast } from "@/utils/toast";
import { useFormValidation } from "@/utils/validation/useFormValidation";
import { optimizePickedImage } from "@/utils/imageUpload";
import { useHelpRequest } from "../hooks/helpRequest.hook";
import { useCategories } from "@/features/category/hooks/category.hook";
import {
    CreateHelpRequestData,
    HelpRequest,
    RequestImageUploadInput,
} from "../types/helpRequest.types";
import { validateRequestDraftFields } from "../utils/requestValidation";
import { RequestFormContent, RequestFormValues } from "./RequestFormContent";
import { RequestFormTrigger } from "./RequestFormTrigger";
import { resolveRequestCategoryId } from "../utils/resolveRequestCategoryId";
import { APP_ROUTES } from "@/config/routes";

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
    const router = useRouter();
    const pathname = usePathname();
    const locationPickerOwnerId = pathname;
    const { addHelpRequestImages } = useHelpRequest();
    const { categories } = useCategories();
    const confirmedMapLocation = useLocationPickerScreenStore((state) => state.confirmedLocation);
    const setDraftMapLocation = useLocationPickerScreenStore((state) => state.setDraftLocation);
    const consumeConfirmedLocation = useLocationPickerScreenStore(
        (state) => state.consumeConfirmedLocation
    );
    const existingImages = initialData?.images ?? [];
    const locationPicker = useLocationPicker({
        initialValue: initialData?.location ?? null,
        storageKey: null,
    });

    const [values, setValues] = useState<RequestFormValues>({
        title: initialData?.title || "",
        description: initialData?.description || "",
        categoryId: initialData ? resolveRequestCategoryId(initialData, categories) : "",
        budget: initialData?.budget,
        isUrgent: Boolean(initialData?.isUrgent),
        urgentDurationMinutes: 120,
        city: initialData?.city || initialData?.location?.city || "",
        country: initialData?.country || initialData?.location?.country || "",
    });

    const [selectedImages, setSelectedImages] = useState<RequestImageUploadInput[]>([]);
    const {
        validationError,
        setValidationError,
        fieldErrors,
        setFieldErrors,
        clearFieldError,
        clearValidationError,
    } = useFormValidation<"title" | "description" | "budget" | "location">();
    const [modalVisible, setModalVisible] = useState(false);
    const isProfileRoute = pathname.startsWith(APP_ROUTES.PROFILE_REQUESTS);
    const locationPickerReturnRoute = isProfileRoute
        ? APP_ROUTES.PROFILE_REQUESTS
        : APP_ROUTES.HOME_REQUESTS;

    const triggerTitle = initialData ? "Edit request" : "Create request";
    const triggerSubtitle = initialData
        ? "Refine the details and add more photos."
        : "Describe the need, add photos, and get help faster.";

    useEffect(() => {
        if (values.categoryId || !categories.length) return;

        setValues((prev) => ({
            ...prev,
            categoryId: categories[0].id,
        }));
    }, [categories, values.categoryId]);

    useEffect(() => {
        if (!confirmedMapLocation) return;

        void (async () => {
            const nextLocation = consumeConfirmedLocation(locationPickerOwnerId);
            if (!nextLocation) return;
            clearFieldError("location");
            await locationPicker.setValue(nextLocation);
            setModalVisible(true);
        })();
    }, [clearFieldError, confirmedMapLocation, consumeConfirmedLocation, locationPicker, locationPickerOwnerId]);

    const handleChangeField = <K extends keyof RequestFormValues>(
        field: K,
        value: RequestFormValues[K]
    ) => {
        setValues((prev) => ({ ...prev, [field]: value }));
        clearFieldError(field as "title" | "description" | "budget");
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

        const nextImages = await Promise.all(
            result.assets.slice(0, remainingSlots).map((asset, index) =>
                optimizePickedImage(asset, `request-image-${Date.now()}-${index}.jpg`)
            )
        );

        setSelectedImages((prev) => [...prev, ...nextImages]);
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setSelectedImages((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async () => {
        const validation = validateRequestDraftFields({
            title: values.title,
            description: values.description,
            budgetInput: values.budget ? String(values.budget) : "",
            location: locationPicker.value,
        });

        if (!validation.isValid) {
            setValidationError(validation.formError);
            setFieldErrors(validation.fieldErrors);
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

    const handleOpenMapPicker = () => {
        setDraftMapLocation(locationPicker.value, locationPickerOwnerId, locationPickerReturnRoute);
        setModalVisible(false);

        requestAnimationFrame(() => {
            router.push(APP_ROUTES.LOCATION_PICKER);
        });
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
                        <View style={styles.actionButton}>
                            <AppButton
                                title="Cancel"
                                onPress={() => setModalVisible(false)}
                                variant="secondary"
                                fullWidth
                                disabled={loading}
                            />
                        </View>
                        <View style={styles.actionButton}>
                            <AppButton
                                title={loading ? "Saving..." : initialData ? "Update request" : "Post request"}
                                onPress={handleSubmit}
                                variant="primary"
                                fullWidth
                                disabled={loading}
                            />
                        </View>
                    </>
                }
            >
                <RequestFormContent
                    title={triggerTitle}
                    subtitle={triggerSubtitle}
                    values={values}
                    categories={categories}
                    loading={loading}
                    validationError={validationError}
                    fieldErrors={fieldErrors}
                    error={error}
                    selectedImages={selectedImages}
                    existingImages={existingImages}
                    imageLimit={MAX_REQUEST_IMAGES}
                    onPickImages={handlePickImages}
                    onRemoveImage={handleRemoveImage}
                    onChangeField={handleChangeField}
                    onOpenMapPicker={handleOpenMapPicker}
                    locationPickerProps={{
                        ...locationPicker,
                        onUseCurrentLocation: async () => {
                            clearFieldError("location");
                            await locationPicker.useCurrentLocation();
                        },
                        onSelectSuggestion: async (suggestion) => {
                            clearFieldError("location");
                            await locationPicker.selectSuggestion?.(suggestion);
                        },
                    }}
                />
            </AppModal>
        </>
    );
};

const styles = StyleSheet.create({
    actionButton: {
        flex: 1,
    },
});
