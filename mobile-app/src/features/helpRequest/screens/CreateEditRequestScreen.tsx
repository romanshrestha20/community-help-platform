import React, { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card, Row, Screen, ScreenView, Stack, theme } from "@/design-system";
import LocationPickerField from "@/features/location/components/LocationPickerField";
import { useLocationPickerScreenStore } from "@/features/location/store/locationPickerScreen.store";
import { RequestPhotoUploadSection } from "@/features/helpRequest/components/RequestPhotoUploadSection";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useCreateEditRequestScreen } from "@/features/helpRequest/hooks/useCreateEditRequestScreen";
import { useCategories } from "@/features/category/hooks/category.hook";
import { RequestEmptyState } from "@/features/helpRequest/components/RequestEmptyState";
import { RequestImageUploadInput } from "@/features/helpRequest/types/helpRequest.types";
import { showInfoToast, showSuccessToast } from "@/utils/toast";
import { APP_ROUTES } from "@/config/routes";
import { goBackOrFallback } from "@/utils/navigation";

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
    const isProfileRoute = pathname.startsWith(APP_ROUTES.PROFILE_REQUESTS);
    const activeRequestId = requestId || params.id;
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
        submitRequest,
    } = useCreateEditRequestScreen({ requestId: activeRequestId });

    useEffect(() => {
        if (form.categoryId || !categories.length) return;
        updateField("categoryId", categories[0].id);
    }, [categories, form.categoryId, updateField]);

    useEffect(() => {
        if (!confirmedMapLocation) return;

        void (async () => {
            const nextLocation = consumeConfirmedLocation(locationPickerOwnerId);
            if (!nextLocation) return;
            clearFieldError("location");
            await locationPicker.setValue(nextLocation);
        })();
    }, [clearFieldError, confirmedMapLocation, consumeConfirmedLocation, locationPicker, locationPickerOwnerId]);

    const handleBack = () => {
        goBackOrFallback({
            fallback: requestListRoute,
            replace: true,
        });
    };

    const handleSave = async () => {
        const saved = await submitRequest(selectedImages);
        if (!saved) return;

        showSuccessToast(isEditing ? "Request updated successfully" : "Request created successfully");
        router.replace(requestDetailRoute(saved.id));
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
        <Screen>
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

            <Card>
                <Stack gap="md">
                    <RequestPhotoUploadSection
                        loading={saving}
                        existingImages={request?.images}
                        selectedImages={selectedImages}
                        imageLimit={MAX_REQUEST_IMAGES}
                        onPickImages={handlePickImages}
                        onRemoveImage={handleRemoveImage}
                        title="Request photos"
                        description="Add or review images before you save the request."
                    />

                    <View
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
                            label="Title"
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
                            label="Description"
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

                    <View
                        style={[
                            styles.sectionCard,
                            {
                                borderColor: palette.border,
                                backgroundColor: palette.surfaceSecondary,
                            },
                        ]}
                    >
                        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Category and budget</Text>
                        <Text style={[styles.sectionDescription, { color: palette.textSecondary }]}>Pick the closest category and add a budget if relevant.</Text>

                        <Stack gap="xs">
                            <Text style={[styles.label, { color: palette.textPrimary }]}>Category</Text>
                            <Row gap="sm" style={styles.wrapRow}>
                                {categories.map((category) => (
                                    <AppButton
                                        key={category.id}
                                        title={category.name}
                                        onPress={() => updateField("categoryId", category.id)}
                                        variant={form.categoryId === category.id ? "primary" : "secondary"}
                                        fullWidth={false}
                                        disabled={saving}
                                    />
                                ))}
                            </Row>
                        </Stack>

                        <AppInput
                            label="Budget"
                            value={form.budget}
                            error={fieldErrors.budget ?? null}
                            onChangeText={(value) => {
                                clearFieldError("budget");
                                updateField("budget", value);
                            }}
                            editable={!saving}
                            keyboardType="decimal-pad"
                            placeholder="Optional"
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
                    </View>

                    <View
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
                                setDraftMapLocation(
                                    locationPicker.value,
                                    locationPickerOwnerId,
                                    locationPickerReturnRoute
                                );
                                router.push(APP_ROUTES.LOCATION_PICKER);
                            }}
                            variant="secondary"
                            fullWidth={false}
                            disabled={saving}
                        />

                        <LocationPickerField
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
                                fullWidth
                            />
                        </View>
                    </Row>
                </Stack>
            </Card>
        </Screen>
    );
};

const styles = StyleSheet.create({
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
});

export default CreateEditRequestScreen;
