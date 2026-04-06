import React from "react";
import { StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { AppHeader } from "@/components/ui/AppHeader";
import { ScreenView, Card, Row, Stack, theme } from "@/design-system";
import LocationPickerField from "@/features/location/components/LocationPickerField";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useCreateEditRequestScreen } from "@/features/helpRequest/hooks/useCreateEditRequestScreen";
import { RequestEmptyState } from "@/features/helpRequest/components/RequestEmptyState";
import { showToast } from "@/utils/toast";

const CATEGORY_OPTIONS = ["FOOD", "MEDICAL", "EDUCATION", "OTHER"] as const;

type Props = {
    requestId?: string;
};

export const CreateEditRequestScreen = ({ requestId }: Props) => {
    const params = useLocalSearchParams<{ id?: string }>();
    const router = useRouter();
    const { palette } = useThemeContext();

    const activeRequestId = requestId || params.id;
    const {
        request,
        isEditing,
        form,
        loadingRequest,
        saving,
        validationError,
        requestError,
        locationPicker,
        updateField,
        submitRequest,
    } = useCreateEditRequestScreen({ requestId: activeRequestId });

    const handleSave = async () => {
        const saved = await submitRequest();
        if (!saved) return;

        showToast(isEditing ? "Request updated" : "Request created");
        router.replace(`/home/requests/${saved.id}`);
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
                    onAction={() => router.back()}
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
            />

            <Card>
                <Stack gap="md">
                    <AppInput
                        label="Title"
                        value={form.title}
                        onChangeText={(value) => updateField("title", value)}
                        editable={!saving}
                        placeholder="What do you need help with?"
                    />

                    <AppInput
                        label="Description"
                        value={form.description}
                        onChangeText={(value) => updateField("description", value)}
                        editable={!saving}
                        placeholder="Describe the request clearly"
                        multiline
                        numberOfLines={5}
                    />

                    <Stack gap="xs">
                        <Text style={[styles.label, { color: palette.textPrimary }]}>Category</Text>
                        <Row gap="sm" style={styles.wrapRow}>
                            {CATEGORY_OPTIONS.map((category) => (
                                <AppButton
                                    key={category}
                                    title={category}
                                    onPress={() => updateField("category", category)}
                                    variant={form.category === category ? "primary" : "secondary"}
                                    fullWidth={false}
                                    disabled={saving}
                                />
                            ))}
                        </Row>
                    </Stack>

                    <AppInput
                        label="Budget"
                        value={form.budget}
                        onChangeText={(value) => updateField("budget", value)}
                        editable={!saving}
                        keyboardType="decimal-pad"
                        placeholder="Optional"
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

                    {validationError ? (
                        <Text style={[styles.error, { color: palette.danger }]}>{validationError}</Text>
                    ) : null}

                    <Row gap="sm">
                        <AppButton
                            title="Cancel"
                            onPress={() => router.back()}
                            variant="secondary"
                            fullWidth={false}
                            disabled={saving}
                        />
                        <AppButton
                            title={saving ? "Saving..." : isEditing ? "Update Request" : "Create Request"}
                            onPress={handleSave}
                            loading={saving}
                            fullWidth={false}
                        />
                    </Row>
                </Stack>
            </Card>
        </ScreenView>
    );
};

const styles = StyleSheet.create({
    label: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    wrapRow: {
        flexWrap: "wrap",
    },
    error: {
        fontSize: theme.typography.fontSize.sm,
    },
});

export default CreateEditRequestScreen;
