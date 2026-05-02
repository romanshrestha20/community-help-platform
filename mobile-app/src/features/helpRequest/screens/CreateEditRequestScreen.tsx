import React, { useEffect, useMemo, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { LayoutChangeEvent, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card, Row, Screen, ScreenView, Stack, theme } from "@/design-system";
import LocationPickerField from "@/features/location/components/LocationPickerField";
import { useLocationPickerScreenStore } from "@/features/location/store/locationPickerScreen.store";
import { RequestPhotoUploadSection } from "@/features/helpRequest/components/RequestPhotoUploadSection";
import { RequestCategoryBudgetPicker } from "@/features/helpRequest/components/RequestCategoryBudgetPicker";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useCreateEditRequestScreen } from "@/features/helpRequest/hooks/useCreateEditRequestScreen";
import { useCategories } from "@/features/category/hooks/category.hook";
import { RequestEmptyState } from "@/features/helpRequest/components/RequestEmptyState";
import { RequestImageUploadInput } from "@/features/helpRequest/types/helpRequest.types";
import { showErrorToast, showInfoToast, showSuccessToast } from "@/utils/toast";
import { APP_ROUTES } from "@/config/routes";
import { goBackOrFallback } from "@/utils/navigation";
import { StickySubmitBar } from "@/components/ui/StickySubmitBar";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { DEFAULT_REQUEST_FORM } from "@/features/helpRequest/types/requestForm.types";
import { AppModal } from "@/components/ui/AppModal";
import { validateRequestForm } from "@/features/helpRequest/validation/request.validation";
import { mapRequestErrorMessage } from "@/features/helpRequest/utils/requestErrorMessage";
import { buildRequestDraftKey, useRequestDraftStore } from "@/features/helpRequest/store/requestDraft.store";
import { requestFormEvents } from "@/features/helpRequest/utils/requestFormEvents";

const MAX_REQUEST_IMAGES = 5;
const URGENT_DURATION_OPTIONS: Array<{ label: string; value: 30 | 60 | 120 | 240 }> = [
    { label: "30m", value: 30 },
    { label: "1h", value: 60 },
    { label: "2h", value: 120 },
    { label: "4h", value: 240 },
];

type Props = {
    requestId?: string;
};

export const CreateEditRequestScreen = ({ requestId }: Props) => {
    const params = useLocalSearchParams<{ id?: string }>();
    const pathname = usePathname();
    const router = useRouter();
    const locationPickerOwnerId = pathname;
    const { palette } = useThemeContext();
    const { categories } = useCategories();
    const confirmedMapLocation = useLocationPickerScreenStore((state) => state.confirmedLocation);
    const setDraftMapLocation = useLocationPickerScreenStore((state) => state.setDraftLocation);
    const consumeConfirmedLocation = useLocationPickerScreenStore(
        (state) => state.consumeConfirmedLocation
    );
    const [selectedImages, setSelectedImages] = useState<RequestImageUploadInput[]>([]);
    const [reviewVisible, setReviewVisible] = useState(false);
    const [categoryFieldError, setCategoryFieldError] = useState<string | null>(null);
    const isProfileRoute = pathname.startsWith(APP_ROUTES.PROFILE_REQUESTS);
    const activeRequestId = requestId || params.id;
    const draftKey = buildRequestDraftKey(activeRequestId);
    const saveDraft = useRequestDraftStore((state) => state.saveDraft);
    const getDraft = useRequestDraftStore((state) => state.getDraft);
    const isEditingRoute = Boolean(activeRequestId);
    const requestListRoute = isProfileRoute
        ? APP_ROUTES.PROFILE_REQUESTS
        : APP_ROUTES.HOME_REQUESTS;
    const requestDetailRoute = (id: string) =>
        isProfileRoute ? APP_ROUTES.PROFILE_REQUEST_DETAILS(id) : APP_ROUTES.HOME_REQUEST_DETAILS(id);
    const locationPickerReturnRoute =
        activeRequestId && isEditingRoute
            ? isProfileRoute
                ? APP_ROUTES.PROFILE_REQUEST_EDIT(activeRequestId)
                : APP_ROUTES.HOME_REQUEST_EDIT(activeRequestId)
            : pathname;
    const {
        request,
        isEditing,
        form,
        loadingRequest,
        saving,
        validationError,
        requestError,
        locationPicker,
        fieldErrors,
        updateField,
        clearFieldError,
        setValidationError,
        setFieldErrors,
        submitRequest,
    } = useCreateEditRequestScreen({ requestId: activeRequestId });
    const scrollRef = useRef<ScrollView>(null);
    const titleRef = useRef<any>(null);
    const descriptionRef = useRef<any>(null);
    const budgetRef = useRef<any>(null);
    const sectionY = useRef<Record<"photos" | "category" | "location", number>>({
        photos: 0,
        category: 0,
        location: 0,
    });

    const normalizedCurrentForm = useMemo(
        () => ({
            title: form.title.trim(),
            description: form.description.trim(),
            categoryId: form.categoryId,
            budget: form.budget.trim(),
            isUrgent: form.isUrgent,
            urgentDurationMinutes: form.urgentDurationMinutes,
            city: form.city.trim(),
            country: form.country.trim(),
        }),
        [form]
    );

    const normalizedBaselineForm = useMemo(() => {
        if (!isEditing || !request) {
            return {
                ...DEFAULT_REQUEST_FORM,
                title: DEFAULT_REQUEST_FORM.title.trim(),
                description: DEFAULT_REQUEST_FORM.description.trim(),
                budget: DEFAULT_REQUEST_FORM.budget.trim(),
                city: DEFAULT_REQUEST_FORM.city.trim(),
                country: DEFAULT_REQUEST_FORM.country.trim(),
            };
        }

        return {
            title: request.title.trim(),
            description: request.description.trim(),
            categoryId: request.categoryId ?? "",
            budget: typeof request.budget === "number" ? String(request.budget) : "",
            isUrgent: Boolean(request.isUrgent),
            urgentDurationMinutes: DEFAULT_REQUEST_FORM.urgentDurationMinutes,
            city: (request.city ?? request.location?.city ?? "").trim(),
            country: (request.country ?? request.location?.country ?? "").trim(),
        };
    }, [isEditing, request]);

    const isFormDirty =
        JSON.stringify(normalizedCurrentForm) !== JSON.stringify(normalizedBaselineForm) ||
        selectedImages.length > 0;

    useUnsavedChangesGuard({
        enabled: isFormDirty && !saving,
    });

    useEffect(() => {
        if (form.categoryId || !categories.length) return;
        updateField("categoryId", categories[0].id);
    }, [categories, form.categoryId, updateField]);

    useEffect(() => {
        const draft = getDraft(draftKey);
        if (draft?.selectedImages?.length && selectedImages.length === 0) {
            setSelectedImages(draft.selectedImages);
        }
    }, [draftKey, getDraft, selectedImages.length]);

    useEffect(() => {
        saveDraft(draftKey, {
            form,
            location: locationPicker.value,
            selectedImages,
        });
    }, [draftKey, form, locationPicker.value, saveDraft, selectedImages]);

    useEffect(() => {
        if (!confirmedMapLocation) return;

        void (async () => {
            const nextLocation = consumeConfirmedLocation(locationPickerOwnerId);
            if (!nextLocation) return;
            clearFieldError("location");
            await locationPicker.setValue(nextLocation);
            requestFormEvents.createRequestLocationSelected();
        })();
    }, [clearFieldError, confirmedMapLocation, consumeConfirmedLocation, locationPicker, locationPickerOwnerId]);

    useEffect(() => {
        if (!isEditing) {
            requestFormEvents.createRequestStarted();
        }
    }, [isEditing]);

    const handleBack = () => {
        goBackOrFallback({
            fallback: requestListRoute,
            replace: true,
        });
    };

    const focusOrScrollToInvalidField = (field?: string) => {
        if (field === "title") {
            titleRef.current?.focus?.();
            return;
        }
        if (field === "description") {
            descriptionRef.current?.focus?.();
            return;
        }
        if (field === "budget") {
            budgetRef.current?.focus?.();
            return;
        }
        if (field === "images") {
            scrollRef.current?.scrollTo({ y: sectionY.current.photos, animated: true });
            return;
        }
        if (field === "categoryId") {
            scrollRef.current?.scrollTo({ y: sectionY.current.category, animated: true });
            return;
        }
        if (field === "location") {
            scrollRef.current?.scrollTo({ y: sectionY.current.location, animated: true });
        }
    };

    const validateBeforeSubmit = () => {
        const validation = validateRequestForm({
            form,
            location: locationPicker.value,
            selectedImages,
            existingImageCount: request?.images?.length ?? 0,
            requireAtLeastOneImage: false,
        });

        setValidationError(validation.formError);
        setFieldErrors({
            title: validation.fieldErrors.title,
            description: validation.fieldErrors.description,
            budget: validation.fieldErrors.budget,
            location: validation.fieldErrors.location,
        });
        setCategoryFieldError(validation.fieldErrors.categoryId ?? null);

        if (!validation.isValid) {
            const firstInvalidField = Object.keys(validation.fieldErrors)[0];
            focusOrScrollToInvalidField(firstInvalidField);
            if (isEditing) requestFormEvents.editRequestValidationFailed(firstInvalidField);
            else requestFormEvents.createRequestValidationFailed(firstInvalidField);
        }

        return validation.isValid;
    };

    const executeSave = async () => {
        const saved = await submitRequest(selectedImages);
        if (!saved) {
            if ((requestError || "").toLowerCase().includes("verification required")) {
                showErrorToast(
                    "Email verification required",
                    "Verify your email to create or edit requests."
                );
            } else {
                showErrorToast("Could not save request", mapRequestErrorMessage(requestError));
            }
            if (!isEditing) requestFormEvents.createRequestFailed(requestError ?? undefined);
            return;
        }

        showSuccessToast(isEditing ? "Request updated successfully" : "Request created successfully");
        if (isEditing) {
            requestFormEvents.editRequestSuccess(saved.id);
        } else {
            requestFormEvents.createRequestSuccess(saved.id);
        }
        useRequestDraftStore.getState().clearDraft(draftKey);
        router.replace(requestDetailRoute(saved.id));
    };

    const handleSave = async () => {
        if (!validateBeforeSubmit()) return;

        if (!isEditing) {
            requestFormEvents.createRequestReviewOpened();
            setReviewVisible(true);
            return;
        }

        await executeSave();
    };

    const handlePickImages = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            showInfoToast("Permission required", "Please allow access to your photo library.");
            return;
        }

        const existingCount = request?.images?.length ?? 0;
        const remainingSlots = MAX_REQUEST_IMAGES - existingCount - selectedImages.length;

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

    const onSectionLayout =
        (key: "photos" | "category" | "location") =>
        (event: LayoutChangeEvent) => {
            sectionY.current[key] = event.nativeEvent.layout.y;
        };

    const handleRemoveImage = (indexToRemove: number) => {
        setSelectedImages((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    if (loadingRequest) {
        return (
            <ScreenView centered>
                <RequestEmptyState
                    title={isEditing ? "Loading request" : "Loading form"}
                    description="Preparing the request editor."
                />
            </ScreenView>
        );
    }

    if (isEditing && !request && requestError) {
        return (
            <ScreenView centered>
                <RequestEmptyState
                    title="Request unavailable"
                    description={requestError}
                    actionLabel="Go back"
                    onAction={handleBack}
                />
            </ScreenView>
        );
    }

    return (
        <ScreenView>
            <AppHeader
                title={isEditing ? "Edit Request" : "Create Request"}
                subtitle={
                    isEditing
                        ? "Update the request details and location."
                        : "Post a new help request for the community."
                }
                showBackButton
                backButtonProps={{
                    fallback: requestListRoute,
                    variant: "secondary",
                }}
            />

            <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
            <Card>
                <Stack gap="md">
                    <View onLayout={onSectionLayout("photos")}>
                    <RequestPhotoUploadSection
                        required
                        helperText="Add clear photos so helpers understand the job quickly."
                        loading={saving}
                        existingImages={request?.images}
                        selectedImages={selectedImages}
                        imageLimit={MAX_REQUEST_IMAGES}
                        onPickImages={handlePickImages}
                        onRemoveImage={handleRemoveImage}
                        title="Request photos"
                        description="Add or review images before you save the request."
                    />
                    </View>

                    <View
                        onLayout={onSectionLayout("category")}
                        style={[
                            styles.sectionCard,
                            {
                                borderColor: palette.border,
                                backgroundColor: palette.surfaceSecondary,
                            },
                        ]}
                    >
                        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Request details</Text>
                        <Text style={[styles.sectionDescription, { color: palette.textSecondary }]}>Write a clear title and description so helpers understand the need quickly.</Text>

                        <AppInput
                            ref={titleRef}
                            label="Title"
                            required
                            helperText="Example: Need grocery pickup this evening"
                            value={form.title}
                            error={fieldErrors.title ?? null}
                            onChangeText={(value) => {
                                clearFieldError("title");
                                updateField("title", value);
                            }}
                            editable={!saving}
                            placeholder="What do you need help with?"
                        />

                        <AppInput
                            ref={descriptionRef}
                            label="Description"
                            required
                            helperText="Include timing, exact help needed, and constraints."
                            value={form.description}
                            error={fieldErrors.description ?? null}
                            onChangeText={(value) => {
                                clearFieldError("description");
                                updateField("description", value);
                            }}
                            editable={!saving}
                            placeholder="Describe the request clearly"
                            multiline
                            numberOfLines={5}
                        />
                    </View>

                    <RequestCategoryBudgetPicker
                        label="Category and budget"
                        helperText="Pick the closest category and add a budget if relevant."
                        required
                        categories={categories}
                        selectedCategoryId={form.categoryId}
                        budget={form.budget}
                        categoryError={categoryFieldError}
                        budgetError={fieldErrors.budget ?? null}
                        budgetInputRef={budgetRef}
                        disabled={saving}
                        accessibilityLabel="Category and budget picker"
                        onCategoryChange={(categoryId) => {
                            setCategoryFieldError(null);
                            updateField("categoryId", categoryId);
                        }}
                        onBudgetChange={(value) => {
                            clearFieldError("budget");
                            updateField("budget", value);
                        }}
                    />

                        <View
                            style={[
                                styles.urgentCard,
                                {
                                    borderColor: form.isUrgent ? `${palette.danger}66` : palette.border,
                                    backgroundColor: form.isUrgent ? `${palette.danger}10` : palette.surface,
                                },
                            ]}
                        >
                            <View style={styles.urgentToggleRow}>
                                <View style={styles.urgentCopy}>
                                    <Text style={[styles.label, { color: palette.textPrimary }]}>Emergency request</Text>
                                    <Text style={[styles.urgentHint, { color: palette.textSecondary }]}>
                                        Highlight this request and prioritize it in feed and map.
                                    </Text>
                                </View>
                                <AppButton
                                    title={form.isUrgent ? "Urgent On" : "Mark Urgent"}
                                    onPress={() => updateField("isUrgent", !form.isUrgent)}
                                    variant={form.isUrgent ? "danger" : "secondary"}
                                    fullWidth={false}
                                    disabled={saving}
                                />
                            </View>

                            {form.isUrgent ? (
                                <Stack gap="xs">
                                    <Text style={[styles.label, { color: palette.textPrimary }]}>Urgent expiry</Text>
                                    <Row gap="xs" style={styles.wrapRow}>
                                        {URGENT_DURATION_OPTIONS.map((option) => (
                                            <AppButton
                                                key={option.value}
                                                title={option.label}
                                                onPress={() => updateField("urgentDurationMinutes", option.value)}
                                                variant={form.urgentDurationMinutes === option.value ? "danger" : "ghost"}
                                                fullWidth={false}
                                                disabled={saving}
                                            />
                                        ))}
                                    </Row>
                                </Stack>
                            ) : null}
                        </View>
                    <View
                        onLayout={onSectionLayout("location")}
                        style={[
                            styles.sectionCard,
                            {
                                borderColor: palette.border,
                                backgroundColor: palette.surfaceSecondary,
                            },
                        ]}
                    >
                        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Location</Text>
                        <Text style={[styles.sectionDescription, { color: palette.textSecondary }]}>Set where help is needed so nearby people can find your request.</Text>

                        <AppButton
                            title="Choose on map"
                                onPress={() => {
                                saveDraft(draftKey, {
                                    form,
                                    location: locationPicker.value,
                                    selectedImages,
                                });
                                setDraftMapLocation(
                                    locationPicker.value,
                                    locationPickerOwnerId,
                                    locationPickerReturnRoute
                                );
                                router.push({
                                    pathname: APP_ROUTES.LOCATION_PICKER,
                                    params: {
                                        returnTo: locationPickerReturnRoute,
                                        draftKey,
                                    },
                                } as any);
                            }}
                            variant="secondary"
                            fullWidth={false}
                            disabled={saving}
                        />

                        <LocationPickerField
                            label="Location"
                            helperText="Set where help is needed so nearby people can find your request."
                            required
                            disabled={saving}
                            accessibilityLabel="Request location picker"
                            value={locationPicker.value}
                            loading={locationPicker.loading}
                            error={fieldErrors.location ?? locationPicker.error}
                            onUseCurrentLocation={async () => {
                                clearFieldError("location");
                                await locationPicker.useCurrentLocation();
                            }}
                            streetQuery={locationPicker.streetQuery}
                            onStreetQueryChange={(value) => {
                                clearFieldError("location");
                                locationPicker.setStreetQuery(value);
                            }}
                            suggestions={locationPicker.suggestions}
                            suggestionsLoading={locationPicker.suggestionsLoading}
                            onSelectSuggestion={async (suggestion) => {
                                clearFieldError("location");
                                await locationPicker.selectSuggestion(suggestion);
                            }}
                        />
                    </View>

                    {validationError ? (
                        <View
                            style={[
                                styles.errorCard,
                                {
                                    borderColor: palette.danger,
                                    backgroundColor: palette.dangerSoft,
                                },
                            ]}
                        >
                            <Text style={[styles.error, { color: palette.danger }]}>{validationError}</Text>
                        </View>
                    ) : null}

                </Stack>
            </Card>
            <View style={styles.stickySpacer} />
            </ScrollView>
            <StickySubmitBar>
                <Row gap="sm" style={styles.actionsRow}>
                    <View style={styles.actionButton}>
                        <AppButton
                            title="Cancel"
                            onPress={handleBack}
                            variant="secondary"
                            fullWidth
                            disabled={saving}
                        />
                    </View>
                    <View style={styles.actionButton}>
                        <AppButton
                            title={saving ? "Saving..." : isEditing ? "Update Request" : "Create Request"}
                            onPress={handleSave}
                            loading={saving}
                            disabled={saving || (isEditing && !isFormDirty)}
                            fullWidth
                        />
                    </View>
                </Row>
            </StickySubmitBar>
            <AppModal
                visible={reviewVisible}
                title="Review request"
                onClose={() => setReviewVisible(false)}
                actions={
                    <>
                        <View style={styles.actionButton}>
                            <AppButton
                                title="Edit details"
                                variant="secondary"
                                fullWidth
                                onPress={() => setReviewVisible(false)}
                            />
                        </View>
                        <View style={styles.actionButton}>
                            <AppButton
                                title={saving ? "Creating..." : "Create request"}
                                fullWidth
                                loading={saving}
                                disabled={saving}
                                onPress={async () => {
                                    requestFormEvents.createRequestSubmitted();
                                    setReviewVisible(false);
                                    await executeSave();
                                }}
                            />
                        </View>
                    </>
                }
            >
                <Stack gap="sm">
                    <Text style={[styles.reviewLine, { color: palette.textPrimary }]}>
                        <Text style={styles.reviewLabel}>Title: </Text>
                        {form.title.trim() || "Not set"}
                    </Text>
                    <Text style={[styles.reviewLine, { color: palette.textPrimary }]}>
                        <Text style={styles.reviewLabel}>Category: </Text>
                        {categories.find((category) => category.id === form.categoryId)?.name ?? "Not selected"}
                    </Text>
                    <Text style={[styles.reviewLine, { color: palette.textPrimary }]}>
                        <Text style={styles.reviewLabel}>Location: </Text>
                        {locationPicker.value?.formattedAddress || [locationPicker.value?.city, locationPicker.value?.country].filter(Boolean).join(", ") || "Not selected"}
                    </Text>
                    <Text style={[styles.reviewLine, { color: palette.textPrimary }]}>
                        <Text style={styles.reviewLabel}>Budget: </Text>
                        {form.budget.trim() ? form.budget.trim() : "Not set"}
                    </Text>
                    <Text style={[styles.reviewLine, { color: palette.textPrimary }]}>
                        <Text style={styles.reviewLabel}>Photos: </Text>
                        {(request?.images?.length ?? 0) + selectedImages.length} attached
                    </Text>
                </Stack>
            </AppModal>
        </ScreenView>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xl,
    },
    label: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    sectionCard: {
        borderWidth: 1,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.md,
        lineHeight: theme.typography.lineHeight.md,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    sectionDescription: {
        fontSize: theme.typography.fontSize.xs,
        lineHeight: theme.typography.lineHeight.xs,
    },
    wrapRow: {
        flexWrap: "wrap",
    },
  actionsRow: {
        marginTop: theme.spacing.xxs,
  },
  urgentToggleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  urgentCard: {
    marginTop: theme.spacing.xs,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  urgentCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  urgentHint: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
  },
    actionButton: {
        flex: 1,
    },
    stickySpacer: {
        height: 110,
    },
    errorCard: {
        borderWidth: 1,
        borderRadius: theme.radius.md,
        padding: theme.spacing.sm,
    },
    error: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
        fontWeight: theme.typography.fontWeight.medium,
    },
    reviewLine: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
    },
    reviewLabel: {
        fontWeight: theme.typography.fontWeight.semibold,
    },
});

export default CreateEditRequestScreen;
