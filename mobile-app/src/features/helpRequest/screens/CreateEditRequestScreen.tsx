import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppInput } from "@/components/ui/AppInput";
import { AppButton } from "@/components/ui/AppButton";
import { BottomSheetSurface } from "@/components/ui/BottomSheetSurface";
import { APP_ROUTES } from "@/config/routes";
import { Row, ScreenView, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useCreateEditRequestScreen } from "@/features/helpRequest/hooks/useCreateEditRequestScreen";
import { validateRequestForm } from "@/features/helpRequest/validation/request.validation";
import { useCategories } from "@/features/category/hooks/category.hook";
import { RequestCategoryBudgetPicker } from "@/features/helpRequest/components/RequestCategoryBudgetPicker";
import LocationPickerField from "@/features/location/components/LocationPickerField";
import { RequestPhotoUploadSection } from "@/features/helpRequest/components/RequestPhotoUploadSection";
import { RequestEmptyState } from "@/features/helpRequest/components/RequestEmptyState";
import { RequestImageUploadInput } from "@/features/helpRequest/types/helpRequest.types";
import { mapRequestErrorMessage } from "@/features/helpRequest/utils/requestErrorMessage";
import { formatUrgentDurationLabel } from "@/features/helpRequest/utils/urgent";
import { showErrorToast, showSuccessToast, showInfoToast } from "@/utils/toast";
import { goBackOrFallback } from "@/utils/navigation";
import { optimizePickedImage } from "@/utils/imageUpload";

const MAX_REQUEST_IMAGES = 5;
const URGENT_DURATION_OPTIONS = [30, 60, 120, 240] as const;

type SectionKey = "title" | "description" | "photos" | "category" | "location";

type Props = {
  requestId?: string;
};

export const NewPostComposerScreen = ({ requestId }: Props) => {
  const params = useLocalSearchParams<{ id?: string }>();
  const activeRequestId = useMemo(() => {
    if (typeof requestId === "string" && requestId.trim()) {
      return requestId.trim();
    }

    const routeId = params.id;
    if (Array.isArray(routeId)) {
      return routeId[0]?.trim() || undefined;
    }

    if (typeof routeId === "string" && routeId.trim()) {
      return routeId.trim();
    }

    return undefined;
  }, [params.id, requestId]);

  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { palette } = useThemeContext();
  const { categories } = useCategories();

  const [selectedImages, setSelectedImages] = useState<RequestImageUploadInput[]>([]);
  const [categoryFieldError, setCategoryFieldError] = useState<string | null>(null);

  const budgetRef = useRef<any>(null);
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<SectionKey, number>>({
    title: 0,
    description: 0,
    photos: 0,
    category: 0,
    location: 0,
  });

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

  const requestListRoute = APP_ROUTES.HOME_REQUESTS;
  const isProfileEditRoute = pathname.startsWith(APP_ROUTES.PROFILE_REQUESTS);
  const requestDetailRoute = (id: string) =>
    isProfileEditRoute
      ? APP_ROUTES.PROFILE_REQUEST_DETAILS(id)
      : APP_ROUTES.HOME_REQUEST_DETAILS(id);

  const hasUnsavedChanges = useMemo(() => {
    if (!isEditing || !request) {
      return Boolean(
        form.title?.trim() ||
          form.description?.trim() ||
          form.categoryId ||
          form.budget ||
          form.isUrgent ||
          form.urgentDurationMinutes !== 120 ||
          locationPicker.value ||
          selectedImages.length
      );
    }

    const normalizedOriginalBudget =
      typeof request.budget === "number" ? String(request.budget) : "";
    const normalizedOriginalCategoryId =
      request.categoryId || request.category?.id || "";

    const currentLocation = locationPicker.value;
    const originalLocation = request.location;
    const locationChanged = Boolean(
      (currentLocation?.latitude ?? null) !== (originalLocation?.latitude ?? null) ||
        (currentLocation?.longitude ?? null) !== (originalLocation?.longitude ?? null) ||
        (currentLocation?.formattedAddress ?? null) !==
          (originalLocation?.formattedAddress ?? null) ||
        (currentLocation?.city ?? null) !== (originalLocation?.city ?? null) ||
        (currentLocation?.country ?? null) !== (originalLocation?.country ?? null)
    );

    return Boolean(
      form.title.trim() !== request.title.trim() ||
        form.description.trim() !== request.description.trim() ||
        form.categoryId !== normalizedOriginalCategoryId ||
        form.budget.trim() !== normalizedOriginalBudget ||
        form.isUrgent !== Boolean(request.isUrgent) ||
        locationChanged ||
        selectedImages.length
    );
  }, [
    form.budget,
    form.categoryId,
    form.description,
    form.isUrgent,
    form.title,
    form.urgentDurationMinutes,
    isEditing,
    locationPicker.value,
    request,
    selectedImages.length,
  ]);

  const closeScreen = () => {
    goBackOrFallback({
      fallback: requestListRoute,
      replace: true,
    });
  };

  const handleClose = () => {
    if (saving) return;

    if (!hasUnsavedChanges) {
      closeScreen();
      return;
    }

    Alert.alert(
      "Discard request?",
      "Your current request details will be lost.",
      [
        { text: "Keep editing", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: closeScreen,
        },
      ]
    );
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
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
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

  const onSectionLayout =
    (key: SectionKey) =>
    (event: LayoutChangeEvent) => {
      sectionY.current[key] = event.nativeEvent.layout.y;
    };

  const focusInvalid = (field?: string) => {
    const keyMap: Record<string, SectionKey> = {
      title: "title",
      description: "description",
      images: "photos",
      categoryId: "category",
      budget: "category",
      location: "location",
    };

    const key = field ? keyMap[field] : undefined;
    if (!key) return;

    scrollRef.current?.scrollTo({
      y: Math.max(sectionY.current[key] - theme.spacing.lg, 0),
      animated: true,
    });
  };

  const handleSubmit = async () => {
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
      focusInvalid(Object.keys(validation.fieldErrors)[0]);
      return;
    }

    const saved = await submitRequest(selectedImages);

    if (!saved) {
      showErrorToast("Could not save request", mapRequestErrorMessage(requestError));
      return;
    }

    showSuccessToast(
      isEditing ? "Request updated successfully" : "Request created successfully"
    );

    const targetRequestId =
      typeof saved.id === "string" && saved.id.trim()
        ? saved.id
        : activeRequestId;

    if (targetRequestId) {
      router.replace(requestDetailRoute(targetRequestId));
      return;
    }

    goBackOrFallback({
      fallback: requestListRoute,
      replace: true,
    });
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
          onAction={closeScreen}
        />
      </ScreenView>
    );
  }

  return (
    <View style={[styles.modalRoot, { backgroundColor: palette.overlay }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <BottomSheetSurface
          style={[
            styles.sheet,
            {
              backgroundColor: palette.background,
              paddingBottom: insets.bottom,
            },
          ]}
          showGrabber
          grabberColor={palette.borderStrong}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: palette.textPrimary }]}>
                {isEditing ? "Edit Request" : "Create Request"}
              </Text>
              <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
                {isEditing
                  ? "Update details and location."
                  : "Post a new help request for nearby helpers."}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close request composer"
              onPress={handleClose}
              hitSlop={10}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  borderColor: palette.border,
                  backgroundColor: palette.surface,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons name="close" size={24} color={palette.textPrimary} />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 120 + insets.bottom },
            ]}
          >
            <Stack gap="lg">
              <View onLayout={onSectionLayout("title")}>
                <ComposerSection
                  title="Request title"
                  required
                  palette={palette}
                >
                  <AppInput
                    value={form.title}
                    error={fieldErrors.title ?? null}
                    onChangeText={(value) => {
                      clearFieldError("title");
                      updateField("title", value);
                    }}
                    placeholder="What do you need help with?"
                  />
                </ComposerSection>
              </View>

              <View onLayout={onSectionLayout("description")}>
                <ComposerSection title="Description" palette={palette}>
                  <TextInput
                    value={form.description}
                    onChangeText={(value) => {
                      clearFieldError("description");
                      updateField("description", value);
                    }}
                    multiline
                    textAlignVertical="top"
                    placeholder="Describe the request clearly, timeline, and constraints"
                    placeholderTextColor={palette.textSecondary}
                    style={[
                      styles.composerInput,
                      {
                        color: palette.textPrimary,
                        borderColor: fieldErrors.description
                          ? palette.danger
                          : palette.border,
                        backgroundColor: palette.surface,
                      },
                    ]}
                    selectionColor={palette.primary}
                  />

                  {fieldErrors.description ? (
                    <Text style={[styles.errorText, { color: palette.danger }]}>
                      {fieldErrors.description}
                    </Text>
                  ) : null}
                </ComposerSection>
              </View>

              <View onLayout={onSectionLayout("category")}>
                <RequestCategoryBudgetPicker
                  categories={categories}
                  selectedCategoryId={form.categoryId}
                  budget={form.budget}
                  categoryError={categoryFieldError}
                  budgetError={fieldErrors.budget ?? null}
                  budgetInputRef={budgetRef}
                  disabled={saving}
                  onCategoryChange={(categoryId) => {
                    setCategoryFieldError(null);
                    updateField("categoryId", categoryId);
                  }}
                  onBudgetChange={(value) => {
                    clearFieldError("budget");
                    updateField("budget", value);
                  }}
                />
              </View>

              <ComposerSection title="Priority" palette={palette}>
                <View style={styles.urgentHeader}>
                  <Text style={[styles.urgentTitle, { color: palette.textPrimary }]}>
                    Emergency request
                  </Text>
                  <Text style={[styles.urgentMeta, { color: palette.textSecondary }]}>
                    Prioritized nearby
                  </Text>
                </View>

                <View style={styles.urgentButtonRow}>
                  <AppButton
                    title={form.isUrgent ? "Urgent on" : "Mark urgent"}
                    variant={form.isUrgent ? "danger" : "secondary"}
                    fullWidth={false}
                    disabled={saving}
                    onPress={() => updateField("isUrgent", !form.isUrgent)}
                  />
                </View>

                {form.isUrgent ? (
                  <View style={styles.urgentButtonRow}>
                    {URGENT_DURATION_OPTIONS.map((minutes) => (
                      <AppButton
                        key={minutes}
                        title={formatUrgentDurationLabel(minutes)}
                        onPress={() => updateField("urgentDurationMinutes", minutes)}
                        variant={form.urgentDurationMinutes === minutes ? "danger" : "ghost"}
                        fullWidth={false}
                        disabled={saving}
                      />
                    ))}
                  </View>
                ) : null}
              </ComposerSection>

              <View onLayout={onSectionLayout("location")}>
                <LocationPickerField
                  label="Location"
                  helperText="Set where help is needed so nearby people can find your request."
                  required
                  disabled={saving}
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

              <View onLayout={onSectionLayout("photos")}>
                <RequestPhotoUploadSection
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

              {validationError ? (
                <View
                  style={[
                    styles.validationCard,
                    {
                      borderColor: palette.danger,
                      backgroundColor: palette.dangerSoft,
                    },
                  ]}
                >
                  <Ionicons name="alert-circle-outline" size={18} color={palette.danger} />
                  <Text style={[styles.errorText, { color: palette.danger }]}>
                    {validationError}
                  </Text>
                </View>
              ) : null}
            </Stack>
          </ScrollView>

          <View
            style={[
              styles.footer,
              {
                borderTopColor: palette.border,
                backgroundColor: palette.background,
                paddingBottom: Math.max(insets.bottom, theme.spacing.md),
              },
            ]}
          >
            <Row gap="sm">
              <View style={styles.actionButton}>
                <AppButton
                  title="Cancel"
                  onPress={handleClose}
                  variant="secondary"
                  fullWidth
                  disabled={saving}
                />
              </View>

              <View style={styles.actionButton}>
                <AppButton
                  title={saving ? "Saving..." : isEditing ? "Update Request" : "Create Request"}
                  onPress={() => {
                    void handleSubmit();
                  }}
                  loading={saving}
                  disabled={saving}
                  fullWidth
                />
              </View>
            </Row>
          </View>
        </BottomSheetSurface>
      </KeyboardAvoidingView>
    </View>
  );
};

type ComposerSectionProps = {
  title: string;
  required?: boolean;
  children: React.ReactNode;
  palette: ReturnType<typeof useThemeContext>["palette"];
};

const ComposerSection = ({
  title,
  required,
  children,
  palette,
}: ComposerSectionProps) => {
  return (
    <View
      style={[
        styles.sectionCard,
        {
          borderColor: palette.border,
          backgroundColor: palette.surfaceSecondary,
        },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
        {title}
        {required ? <Text style={{ color: palette.danger }}> *</Text> : null}
      </Text>

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },

  keyboardView: {
    flex: 1,
    justifyContent: "flex-end",
  },

  sheet: {
    height: "92%",
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
  },

  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: -0.6,
  },

  subtitle: {
    marginTop: theme.spacing.xs,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: theme.typography.fontWeight.medium,
  },

  closeButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.sm,
  },

  scrollContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
  },

  sectionCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },

  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: -0.2,
  },

  composerInput: {
    minHeight: 150,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: theme.typography.fontWeight.medium,
  },

  validationCard: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },

  errorText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.medium,
    flexShrink: 1,
  },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },

  actionButton: {
    flex: 1,
  },

  urgentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  urgentTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },

  urgentMeta: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  urgentButtonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
});

export default NewPostComposerScreen;
