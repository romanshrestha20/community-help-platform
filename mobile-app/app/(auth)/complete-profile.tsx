import React, { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { PhoneNumberField } from "@/components/ui/PhoneNumberField";
import { Stack, theme } from "@/design-system";
import {
  AuthActions,
  AuthBanner,
  AuthCard,
  AuthHero,
  AuthScreen,
} from "@/features/auth/components";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useOnboardingStore, type OnboardingRole } from "@/features/auth/store/onboarding.store";
import { useCategories } from "@/features/category/hooks/category.hook";
import LocationPickerField from "@/features/location/components/LocationPickerField";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";
import { LocationSuggestion } from "@/features/location/types/location.types";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useUser } from "@/features/user/hooks/user.hook";
import { Gender, UserType } from "@/features/user/types/user.types";
import {
  combinePhoneNumber,
  getCallingCodeForCountry,
  getDefaultPhoneCountryCode,
  getPhoneRegionHint,
  resolvePhoneCountryCode,
  splitPhoneNumber,
} from "@/utils/phone";
import { optimizePickedImage } from "@/utils/imageUpload";
import { useFormValidation } from "@/utils/validation/useFormValidation";

const TOTAL_STEPS = 3;
const radiusOptions = [5000, 10000, 25000, 50000];

const roleOptions: { value: OnboardingRole; label: string; description: string }[] = [
  { value: "HELPER", label: "Helper", description: "Respond to requests and support others." },
  { value: "REQUESTER", label: "Requester", description: "Post requests when you need support." },
  { value: "BOTH", label: "Both", description: "Ask for and offer help from one account." },
];

const genderOptions: Gender[] = [Gender.MALE, Gender.FEMALE, Gender.OTHER];

const getStepCopy = (step: number) => {
  if (step === 1) {
    return {
      eyebrow: "Step 1 of 3",
      title: "Basic Profile",
      subtitle: "Add your name and role.",
    };
  }
  if (step === 2) {
    return {
      eyebrow: "Step 2 of 3",
      title: "Location & Preferences",
      subtitle: "Set your location, interests, and discovery radius.",
    };
  }
  return {
    eyebrow: "Step 3 of 3",
    title: "Trust & Profile",
    subtitle: "Add optional trust details and finish onboarding.",
  };
};

const mapRoleToUserType = (role: OnboardingRole): UserType => {
  if (role === "REQUESTER") return UserType.GENERAL;
  if (role === "HELPER") return UserType.GENERAL;
  return UserType.GENERAL;
};

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { palette } = useThemeContext();
  const authUser = useAuthStore((state) => state.user);
  const { handleUpdateProfile, handleUploadAvatar, loading, error } = useUser();
  const { categories, loading: loadingCategories } = useCategories();

  const role = useOnboardingStore((state) => state.role);
  const setRole = useOnboardingStore((state) => state.setRole);
  const interestIds = useOnboardingStore((state) => state.interestIds);
  const toggleInterest = useOnboardingStore((state) => state.toggleInterest);
  const resetOnboarding = useOnboardingStore((state) => state.reset);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState(getDefaultPhoneCountryCode());
  const [phoneCallingCode, setPhoneCallingCode] = useState("");
  const [phoneNationalNumber, setPhoneNationalNumber] = useState("");
  const [phoneCountryTouched, setPhoneCountryTouched] = useState(false);
  const [searchRadiusMeters, setSearchRadiusMeters] = useState<number>(10000);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender>(Gender.OTHER);
  const [avatar, setAvatar] = useState<{ uri: string; name?: string; type?: string; webFile?: File | Blob } | null>(null);

  const {
    validationError,
    setValidationError,
    fieldErrors,
    setFieldErrors,
    clearFieldError,
    clearValidationError,
  } = useFormValidation<"firstName" | "lastName" | "location">();

  const locationPicker = useLocationPicker({ autoUseCurrentLocationOnMount: true, storageKey: null });

  const stepCopy = getStepCopy(step);
  const phoneRegionHint = getPhoneRegionHint(phoneCountryCode, phoneCallingCode);
  const displayError = validationError || error;

  useEffect(() => {
    const fullName = authUser?.fullName || authUser?.profile?.fullName || "";
    const [first = "", ...rest] = fullName.trim().split(/\s+/);
    setFirstName(first);
    setLastName(rest.join(" "));

    if (authUser?.profile?.dateOfBirth) {
      const raw = authUser.profile.dateOfBirth;
      setDateOfBirth(raw.includes("T") ? raw.split("T")[0] : raw);
    }

    if (authUser?.profile?.gender && Object.values(Gender).includes(authUser.profile.gender as Gender)) {
      setGender(authUser.profile.gender as Gender);
    }

    if (authUser?.profile?.searchRadiusMeters) {
      setSearchRadiusMeters(authUser.profile.searchRadiusMeters);
    }

    if (authUser?.phone) {
      void splitPhoneNumber(authUser.phone).then((parts) => {
        setPhoneCountryCode(parts.countryCode);
        setPhoneCallingCode(parts.callingCode ? `+${parts.callingCode}` : "");
        setPhoneNationalNumber(parts.nationalNumber);
      });
    }
  }, [authUser]);

  useEffect(() => {
    let isCancelled = false;

    const syncPhoneCountryFromLocation = async () => {
      if (phoneCountryTouched) return;

      const detectedCountryCode = await resolvePhoneCountryCode(
        locationPicker.value?.countryCode,
        locationPicker.value?.country
      );
      const nextCountryCode = detectedCountryCode ?? getDefaultPhoneCountryCode();
      const nextCallingCode = await getCallingCodeForCountry(nextCountryCode);

      if (isCancelled || !nextCallingCode) return;

      setPhoneCountryCode(nextCountryCode);
      setPhoneCallingCode(`+${nextCallingCode}`);
    };

    void syncPhoneCountryFromLocation();

    return () => {
      isCancelled = true;
    };
  }, [locationPicker.value?.country, locationPicker.value?.countryCode, phoneCountryTouched]);

  const validateCurrentStep = () => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!firstName.trim()) errors.firstName = "First name is required.";
      if (!lastName.trim()) errors.lastName = "Last name is required.";
    }

    if (step === 2) {
      if (!locationPicker.value) {
        errors.location = "Please select your location.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setValidationError(Object.values(errors)[0] || "Please complete this step.");
      return false;
    }

    setFieldErrors({});
    clearValidationError();
    return true;
  };

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    clearFieldError("location");
    void locationPicker.selectSuggestion(suggestion);
  };

  const handlePickAvatar = async () => {
    clearValidationError();

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setValidationError("Photo library permission is required to choose a profile photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const optimized = await optimizePickedImage(asset, `avatar-${Date.now()}.jpg`);
    setAvatar(optimized);
  };

  const handleFinish = async () => {
    if (!validateCurrentStep()) return;

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const phone = combinePhoneNumber(phoneCallingCode, phoneNationalNumber);

    const result = await handleUpdateProfile({
      fullName,
      phone: phone || undefined,
      dateOfBirth: dateOfBirth.trim() || undefined,
      gender,
      userType: mapRoleToUserType(role),
      address: locationPicker.value ?? undefined,
      searchRadiusMeters,
    });

    if (!result.success) {
      return;
    }

    if (avatar) {
      await handleUploadAvatar(avatar);
    }

    resetOnboarding();
    router.replace("/(tabs)/home");
  };

  return (
    <AuthScreen>
      <AuthHero
        icon="person-circle-outline"
        eyebrow={stepCopy.eyebrow}
        title={stepCopy.title}
        subtitle={stepCopy.subtitle}
        progressLabel={`Step ${step}/${TOTAL_STEPS}`}
        progressValue={(step / TOTAL_STEPS) * 100}
      />

      <AuthCard>
        <Stack gap="md">
          {displayError ? <AuthBanner tone="error">{displayError}</AuthBanner> : null}

          {step === 1 ? (
            <>
              <View style={styles.inlineRow}>
                <View style={styles.inlineField}>
                  <AppInput
                    label="First name"
                    placeholder="Alex"
                    value={firstName}
                    error={fieldErrors.firstName ?? null}
                    onChangeText={(value) => {
                      clearFieldError("firstName");
                      setFirstName(value);
                    }}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inlineField}>
                  <AppInput
                    label="Last name"
                    placeholder="Taylor"
                    value={lastName}
                    error={fieldErrors.lastName ?? null}
                    onChangeText={(value) => {
                      clearFieldError("lastName");
                      setLastName(value);
                    }}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <PhoneNumberField
                label="Phone number"
                countryCode={phoneCountryCode}
                callingCode={phoneCallingCode}
                nationalNumber={phoneNationalNumber}
                error={null}
                hint={phoneRegionHint}
                detectedLabel={!phoneCountryTouched ? "Detected from current location" : null}
                onCountryChange={({ countryCode, callingCode }, source) => {
                  if (source === "user") setPhoneCountryTouched(true);
                  setPhoneCountryCode(countryCode);
                  setPhoneCallingCode(callingCode);
                }}
                onNationalNumberChange={(value) => {
                  setPhoneNationalNumber(value.replace(/\D/g, ""));
                }}
              />

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Role</Text>
                <View style={styles.optionStack}>
                  {roleOptions.map((option) => {
                    const selected = role === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setRole(option.value)}
                        style={[
                          styles.optionCard,
                          {
                            backgroundColor: selected
                              ? palette.primarySoft ?? palette.surfaceMuted
                              : palette.surfaceSecondary,
                            borderColor: selected ? palette.primary : palette.border,
                          },
                        ]}
                      >
                        <Text style={[styles.optionTitle, { color: palette.textPrimary }]}>{option.label}</Text>
                        <Text style={[styles.optionCopy, { color: palette.textSecondary }]}>{option.description}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          ) : null}

          {step === 2 ? (
            <>
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
                onSelectSuggestion={handleSelectSuggestion}
              />

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Category interests</Text>
                <View style={styles.chipWrap}>
                  {loadingCategories ? (
                    <Text style={[styles.helperText, { color: palette.textSecondary }]}>Loading categories...</Text>
                  ) : (
                    categories.map((category) => {
                      const selected = interestIds.includes(category.id);
                      return (
                        <Pressable
                          key={category.id}
                          onPress={() => toggleInterest(category.id)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: selected
                                ? palette.primarySoft ?? palette.surfaceMuted
                                : palette.surfaceSecondary,
                              borderColor: selected ? palette.primary : palette.border,
                            },
                          ]}
                        >
                          <Text style={[styles.chipText, { color: selected ? palette.primary : palette.textPrimary }]}>
                            {category.name}
                          </Text>
                        </Pressable>
                      );
                    })
                  )}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Search/help radius</Text>
                <View style={styles.chipWrap}>
                  {radiusOptions.map((radius) => {
                    const selected = searchRadiusMeters === radius;
                    return (
                      <Pressable
                        key={radius}
                        onPress={() => setSearchRadiusMeters(radius)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected
                              ? palette.primarySoft ?? palette.surfaceMuted
                              : palette.surfaceSecondary,
                            borderColor: selected ? palette.primary : palette.border,
                          },
                        ]}
                      >
                        <Text style={[styles.chipText, { color: selected ? palette.primary : palette.textPrimary }]}>
                          {radius / 1000} km
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <DatePickerField
                label="Date of birth (optional)"
                value={dateOfBirth}
                error={null}
                onChangeText={(value) => {
                  setDateOfBirth(value);
                }}
                placeholder="Select date"
              />

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Gender</Text>
                <View style={styles.chipWrap}>
                  {genderOptions.map((option) => {
                    const selected = gender === option;
                    const label = option === Gender.MALE ? "Male" : option === Gender.FEMALE ? "Female" : "Other";
                    return (
                      <Pressable
                        key={option}
                        onPress={() => setGender(option)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected
                              ? palette.primarySoft ?? palette.surfaceMuted
                              : palette.surfaceSecondary,
                            borderColor: selected ? palette.primary : palette.border,
                          },
                        ]}
                      >
                        <Text style={[styles.chipText, { color: selected ? palette.primary : palette.textPrimary }]}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Profile photo</Text>
                <Pressable
                  onPress={handlePickAvatar}
                  style={[styles.photoPicker, { borderColor: palette.border, backgroundColor: palette.surfaceSecondary }]}
                >
                  {avatar?.uri ? (
                    <Image source={{ uri: avatar.uri }} style={styles.photoPreview} />
                  ) : (
                    <Ionicons name="camera-outline" size={22} color={palette.textSecondary} />
                  )}
                  <Text style={[styles.photoPickerText, { color: palette.textPrimary }]}>Choose photo</Text>
                </Pressable>
              </View>
            </>
          ) : null}

          <AuthActions>
            {step > 1 ? (
              <AppButton
                title="Back"
                variant="secondary"
                onPress={() => {
                  clearValidationError();
                  setFieldErrors({});
                  setStep((current) => (Math.max(1, current - 1) as 1 | 2 | 3));
                }}
                disabled={loading}
              />
            ) : null}

            {step < 3 ? (
              <AppButton
                title="Continue"
                onPress={() => {
                  if (!validateCurrentStep()) return;
                  setStep((current) => (Math.min(3, current + 1) as 1 | 2 | 3));
                }}
                disabled={loading}
              />
            ) : (
              <>
                <AppButton
                  title={loading ? "Saving..." : "Save and finish"}
                  loading={loading}
                  onPress={handleFinish}
                  disabled={loading}
                />
                <AppButton
                  title="Skip optional details"
                  variant="ghost"
                  onPress={handleFinish}
                  disabled={loading}
                />
              </>
            )}
          </AuthActions>
        </Stack>
      </AuthCard>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  inlineRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  inlineField: {
    flex: 1,
  },
  section: {
    gap: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  optionStack: {
    gap: theme.spacing.xs,
  },
  optionCard: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.xxs,
  },
  optionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  optionCopy: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 18,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  chipText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  helperText: {
    fontSize: theme.typography.fontSize.xs,
  },
  photoPicker: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  photoPreview: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.fill,
  },
  photoPickerText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
  },
  inlineError: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
