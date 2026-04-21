import React, { useEffect, useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { PhoneNumberField } from "@/components/ui/PhoneNumberField";
import { Stack, theme } from "@/design-system";
import { APP_ROUTES } from "@/config/routes";
import {
  AuthActions,
  AuthBanner,
  AuthCard,
  AuthDivider,
  AuthFooterLink,
  AuthHero,
  AuthScreen,
} from "@/features/auth/components";
import { useGoogleAuth } from "@/features/auth/google";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { useOnboardingStore, type OnboardingRole } from "@/features/auth/store/onboarding.store";
import { validateRegisterFormFields } from "@/features/auth/utils/authValidation";
import { useCategories } from "@/features/category/hooks/category.hook";
import LocationPickerField from "@/features/location/components/LocationPickerField";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";
import { LocationSuggestion } from "@/features/location/types/location.types";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import {
  combinePhoneNumber,
  getCallingCodeForCountry,
  getDefaultPhoneCountryCode,
  getPhoneRegionHint,
  resolvePhoneCountryCode,
} from "@/utils/phone";
import { useFormValidation } from "@/utils/validation/useFormValidation";

type Gender = "MALE" | "FEMALE" | "OTHER";
type RegisterStep = 1 | 2 | 3;

const TOTAL_STEPS = 3;
const genderOptions: Gender[] = ["MALE", "FEMALE", "OTHER"];
const roleOptions: Array<{
  value: OnboardingRole;
  label: string;
  description: string;
}> = [
    {
      value: "HELPER",
      label: "Helper",
      description: "Respond to requests and support people nearby.",
    },
    {
      value: "REQUESTER",
      label: "Requester",
      description: "Post requests whenever you need support.",
    },
    {
      value: "BOTH",
      label: "Both",
      description: "Request help and offer help from the same account.",
    },
  ];

const getPasswordStrength = (password: string) => {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { label: "Weak", progress: 25 };
  }
  if (score === 2) {
    return { label: "Fair", progress: 50 };
  }
  if (score === 3) {
    return { label: "Strong", progress: 75 };
  }
  return { label: "Very strong", progress: 100 };
};

const getStepCopy = (step: RegisterStep) => {
  if (step === 1) {
    return {
      eyebrow: "Step 1 of 3",
      title: "Basic info",
      subtitle:
        "Set up your account details, choose your role, and add the phone number you will verify for extra trust.",
    };
  }

  if (step === 2) {
    return {
      eyebrow: "Step 2 of 3",
      title: "Location setup",
      subtitle:
        "Use your current location or search manually, then choose the interests that should shape discovery and relevance.",
    };
  }

  return {
    eyebrow: "Step 3 of 3",
    title: "Profile photo",
    subtitle:
      "Add an optional profile photo from your camera or gallery, or skip and finish setup now.",
  };
};

export default function RegisterScreen() {
  const router = useRouter();
  const { palette } = useThemeContext();
  const {
    handleRegister,
    handleGoogleLogin,
    loadingRegister,
    loadingGoogleLogin,
    error,
  } = useAuth();
  const { isGoogleConfigured, signIn } = useGoogleAuth();
  const { categories, loading: loadingCategories } = useCategories();

  const locationPicker = useLocationPicker({
    autoUseCurrentLocationOnMount: true,
    storageKey: null,
  });

  const onboardingRole = useOnboardingStore((state) => state.role);
  const interestIds = useOnboardingStore((state) => state.interestIds);
  const setRole = useOnboardingStore((state) => state.setRole);
  const toggleInterest = useOnboardingStore((state) => state.toggleInterest);
  const setPendingAvatar = useOnboardingStore((state) => state.setPendingAvatar);
  const setOnboardingFirstName = useOnboardingStore((state) => state.setFirstName);

  const [step, setStep] = useState<RegisterStep>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState(getDefaultPhoneCountryCode());
  const [phoneCallingCode, setPhoneCallingCode] = useState("");
  const [phoneNationalNumber, setPhoneNationalNumber] = useState("");
  const [phoneCountryTouched, setPhoneCountryTouched] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender>("MALE");
  const [avatarPreviewUri, setAvatarPreviewUri] = useState<string | null>(null);
  const {
    validationError,
    setValidationError,
    fieldErrors,
    setFieldErrors,
    clearFieldError,
    clearValidationError,
  } = useFormValidation<
    | "fullName"
    | "email"
    | "phone"
    | "password"
    | "dateOfBirth"
    | "location"
    | "legal"
  >();

  const stepCopy = getStepCopy(step);
  const isBusy = loadingRegister || loadingGoogleLogin;
  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const combinedPhone = combinePhoneNumber(phoneCallingCode, phoneNationalNumber);
  const displayError = validationError || error;
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    let isCancelled = false;

    const syncPhoneCountryFromLocation = async () => {
      if (phoneCountryTouched) {
        return;
      }

      const detectedCountryCode = await resolvePhoneCountryCode(
        locationPicker.value?.countryCode,
        locationPicker.value?.country
      );

      const nextCountryCode = detectedCountryCode ?? getDefaultPhoneCountryCode();
      const nextCallingCode = await getCallingCodeForCountry(nextCountryCode);

      if (isCancelled || !nextCallingCode) {
        return;
      }

      setPhoneCountryCode(nextCountryCode);
      setPhoneCallingCode(`+${nextCallingCode}`);
    };

    void syncPhoneCountryFromLocation();

    return () => {
      isCancelled = true;
    };
  }, [locationPicker.value?.country, locationPicker.value?.countryCode, phoneCountryTouched]);

  const phoneRegionHint = getPhoneRegionHint(phoneCountryCode, phoneCallingCode);
  const phoneDetectedLabel =
    !phoneCountryTouched &&
      (locationPicker.value?.countryCode || locationPicker.value?.country)
      ? "Detected from current location"
      : null;

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    clearFieldError("location");
    void locationPicker.selectSuggestion(suggestion);
  };

  const validateStep = (targetStep: RegisterStep) => {
    const validation = validateRegisterFormFields({
      fullName,
      email,
      phone: combinedPhone,
      password,
      dateOfBirth,
      location: locationPicker.value,
    });

    const relevantKeys: Record<RegisterStep, Array<keyof typeof validation.fieldErrors>> = {
      1: ["fullName", "email", "phone", "password"],
      2: ["dateOfBirth", "location"],
      3: [],
    };

    const relevantErrors = relevantKeys[targetStep].reduce<Record<string, string>>(
      (accumulator, key) => {
        const nextError = validation.fieldErrors[key];
        if (nextError) {
          accumulator[key] = nextError;
        }
        return accumulator;
      },
      {}
    );

    if (targetStep === 1 && !acceptedLegal) {
      relevantErrors.legal = "You must agree to the Terms and Privacy Policy to continue.";
    }

    if (Object.keys(relevantErrors).length > 0) {
      setFieldErrors(relevantErrors);
      setValidationError(
        Object.values(relevantErrors)[0] ?? validation.formError ?? "Please complete this step."
      );
      return false;
    }

    setFieldErrors({});
    clearValidationError();
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      return;
    }

    setStep((current) => Math.min(current + 1, TOTAL_STEPS) as RegisterStep);
  };

  const handleBack = () => {
    clearValidationError();
    setFieldErrors({});
    setStep((current) => Math.max(current - 1, 1) as RegisterStep);
  };

  const handlePickAvatar = async (source: "camera" | "library") => {
    clearValidationError();

    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setValidationError(
        source === "camera"
          ? "Camera permission is required to take a profile photo."
          : "Photo library permission is required to choose a profile photo."
      );
      return;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        })
        : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    setAvatarPreviewUri(asset.uri);
    setPendingAvatar({
      uri: asset.uri,
      name: asset.fileName ?? `avatar-${Date.now()}.jpg`,
      type: asset.mimeType ?? "image/jpeg",
      webFile: (asset as any).file ?? undefined,
    });
  };

  const handleGooglePress = async () => {
    clearValidationError();

    if (!isGoogleConfigured) {
      setValidationError("Google Sign-In is not configured for this app build.");
      return;
    }

    const result = await signIn();
    if (!result.success) {
      if (!result.cancelled) {
        setValidationError(result.message);
      }
      return;
    }

    const authResult = await handleGoogleLogin(result.idToken);
    if (!authResult?.success) {
      return;
    }

    setOnboardingFirstName(
      authResult.data?.fullName?.split(" ")[0] ?? firstName.trim() ?? ""
    );
    router.replace(APP_ROUTES.AUTH_WELCOME);
  };

  const handleFinish = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      return;
    }

    if (!locationPicker.value) {
      return;
    }

    clearValidationError();

    try {
      const result = await handleRegister({
        fullName,
        email,
        password,
        phone: combinedPhone,
        gender,
        dateOfBirth,
        location: locationPicker.value,
      });

      if (!result?.success) {
        return;
      }

      setOnboardingFirstName(firstName.trim() || result.data?.fullName?.split(" ")[0] || "");
      router.replace(APP_ROUTES.AUTH_WELCOME);
    } catch {
      // hook-level error state handles screen messaging
    }
  };

  const avatarInitials =
    `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.trim().toUpperCase() || "MK";

  return (
    <AuthScreen key={`register-step-${step}`} contentContainerStyle={styles.screenContent}>
      <AuthHero
        icon="person-add-outline"
        eyebrow={stepCopy.eyebrow}
        title={stepCopy.title}
        subtitle={stepCopy.subtitle}
        progressLabel={`Step ${step}/${TOTAL_STEPS}`}
        progressValue={(step / TOTAL_STEPS) * 100}
      />

      <AuthCard>
        <Stack gap="lg">
          {displayError ? <AuthBanner tone="error">{displayError}</AuthBanner> : null}

          {step === 1 ? (
            <>
              <View style={styles.inlineRow}>
                <View style={styles.inlineField}>
                  <AppInput
                    label="First name"
                    placeholder="Mikael"
                    value={firstName}
                    error={fieldErrors.fullName ?? null}
                    onChangeText={(value) => {
                      clearFieldError("fullName");
                      setOnboardingFirstName(value.trim());
                      setFirstName(value);
                    }}
                    autoCapitalize="words"
                    textContentType="givenName"
                  />
                </View>

                <View style={styles.inlineField}>
                  <AppInput
                    label="Last name"
                    placeholder="Korhonen"
                    value={lastName}
                    error={fieldErrors.fullName ?? null}
                    onChangeText={(value) => {
                      clearFieldError("fullName");
                      setLastName(value);
                    }}
                    autoCapitalize="words"
                    textContentType="familyName"
                  />
                </View>
              </View>

              <AppInput
                label="Email"
                placeholder="mikael@example.com"
                value={email}
                error={fieldErrors.email ?? null}
                onChangeText={(value) => {
                  clearFieldError("email");
                  setEmail(value);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
              />

              <PhoneNumberField
                label="Phone number"
                countryCode={phoneCountryCode}
                callingCode={phoneCallingCode}
                nationalNumber={phoneNationalNumber}
                error={fieldErrors.phone ?? null}
                hint={phoneRegionHint}
                detectedLabel={phoneDetectedLabel}
                onCountryChange={({ countryCode, callingCode }, source) => {
                  clearFieldError("phone");
                  if (source === "user") {
                    setPhoneCountryTouched(true);
                  }
                  setPhoneCountryCode(countryCode);
                  setPhoneCallingCode(callingCode);
                }}
                onNationalNumberChange={(value) => {
                  clearFieldError("phone");
                  setPhoneNationalNumber(value.replace(/\D/g, ""));
                }}
              />

              <View style={styles.passwordBlock}>
                <AppInput
                  label="Password"
                  placeholder="Create a password"
                  value={password}
                  error={fieldErrors.password ?? null}
                  onChangeText={(value) => {
                    clearFieldError("password");
                    setPassword(value);
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                />

                <View style={styles.strengthWrap}>
                  <View
                    style={[
                      styles.strengthTrack,
                      { backgroundColor: palette.surfaceMuted },
                    ]}
                  >
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: `${password.length ? passwordStrength.progress : 0}%`,
                          backgroundColor:
                            passwordStrength.progress <= 25
                              ? palette.danger
                              : passwordStrength.progress <= 50
                                ? palette.warning
                                : palette.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                    Password strength: {password.length ? passwordStrength.label : "Not started"}
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                  Select your role
                </Text>
                <View style={styles.optionStack}>
                  {roleOptions.map((option) => {
                    const selected = onboardingRole === option.value;

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
                        <View style={styles.optionHeader}>
                          <Text style={[styles.optionTitle, { color: palette.textPrimary }]}>
                            {option.label}
                          </Text>
                          <View
                            style={[
                              styles.radioOuter,
                              {
                                borderColor: selected ? palette.primary : palette.borderStrong,
                              },
                            ]}
                          >
                            {selected ? (
                              <View
                                style={[
                                  styles.radioInner,
                                  { backgroundColor: palette.primary },
                                ]}
                              />
                            ) : null}
                          </View>
                        </View>
                        <Text style={[styles.optionCopy, { color: palette.textSecondary }]}>
                          {option.description}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <AuthBanner tone="info">
                Your phone number is collected here and can be verified after setup to improve trust
                when posting or bidding.
              </AuthBanner>

              <Pressable
                onPress={() => {
                  clearFieldError("legal");
                  setAcceptedLegal((current) => !current);
                }}
                style={styles.checkboxRow}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: fieldErrors.legal ? palette.danger : palette.borderStrong,
                      backgroundColor: acceptedLegal ? palette.primary : palette.surface,
                    },
                  ]}
                >
                  {acceptedLegal ? (
                    <Ionicons name="checkmark" size={16} color={palette.textInverse} />
                  ) : null}
                </View>
                <Text style={[styles.checkboxText, { color: palette.textSecondary }]}>
                  I agree to the Terms of Service and Privacy Policy.
                </Text>
              </Pressable>

              {fieldErrors.legal ? (
                <Text style={[styles.inlineError, { color: palette.danger }]}>
                  {fieldErrors.legal}
                </Text>
              ) : null}

              <AuthActions>
                <AppButton
                  title="Continue"
                  onPress={handleNext}
                  loading={isBusy}
                  disabled={isBusy}
                />
              </AuthActions>

              <AuthDivider label="or sign up with" />

              <AppButton
                title="Continue with Google"
                onPress={handleGooglePress}
                variant="secondary"
                disabled={isBusy}
                loading={loadingGoogleLogin}
                icon={<Ionicons name="logo-google" size={18} color={palette.textPrimary} />}
              />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <AuthBanner tone="info">
                Use current location for the fastest setup, or search your city manually if you
                prefer more control.
              </AuthBanner>

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
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                  Category interests
                </Text>
                <Text style={[styles.sectionHint, { color: palette.textSecondary }]}>
                  Pick a few topics so recommendations feel relevant from day one.
                </Text>

                <View style={styles.chipWrap}>
                  {loadingCategories ? (
                    <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                      Loading categories...
                    </Text>
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
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: selected ? palette.primary : palette.textPrimary,
                              },
                            ]}
                          >
                            {category.name}
                          </Text>
                        </Pressable>
                      );
                    })
                  )}
                </View>
              </View>

              <View style={styles.section}>
                <DatePickerField
                  label="Date of birth"
                  value={dateOfBirth}
                  error={fieldErrors.dateOfBirth ?? null}
                  onChangeText={(value) => {
                    clearFieldError("dateOfBirth");
                    setDateOfBirth(value);
                  }}
                  placeholder="Select date"
                />
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                  Gender
                </Text>

                <View style={styles.chipWrap}>
                  {genderOptions.map((option) => {
                    const selected = gender === option;
                    const label =
                      option === "MALE" ? "Male" : option === "FEMALE" ? "Female" : "Other";

                    return (
                      <Pressable
                        key={option}
                        onPress={() => setGender(option)}
                        style={[
                          styles.chip,
                          styles.genderChip,
                          {
                            backgroundColor: selected
                              ? palette.primarySoft ?? palette.surfaceMuted
                              : palette.surfaceSecondary,
                            borderColor: selected ? palette.primary : palette.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: selected ? palette.primary : palette.textPrimary },
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.buttonRow}>
                <View style={styles.buttonCell}>
                  <AppButton
                    title="Back"
                    onPress={handleBack}
                    variant="secondary"
                    disabled={isBusy}
                  />
                </View>
                <View style={styles.buttonCell}>
                  <AppButton
                    title="Continue"
                    onPress={handleNext}
                    loading={isBusy}
                    disabled={isBusy}
                  />
                </View>
              </View>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <View style={styles.avatarStep}>
                <View
                  style={[
                    styles.avatarFrame,
                    {
                      backgroundColor: palette.primarySoft ?? palette.surfaceMuted,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  {avatarPreviewUri ? (
                    <Image source={{ uri: avatarPreviewUri }} style={styles.avatarImage} />
                  ) : (
                    <Text style={[styles.avatarInitials, { color: palette.primary }]}>
                      {avatarInitials}
                    </Text>
                  )}
                </View>

                <Text style={[styles.avatarTitle, { color: palette.textPrimary }]}>
                  Add a profile photo
                </Text>
                <Text style={[styles.avatarCopy, { color: palette.textSecondary }]}>
                  Photos are optional, but they help people trust requests and bids faster.
                </Text>
              </View>

              <View style={styles.buttonRow}>
                <View style={styles.buttonCell}>
                  <AppButton
                    title="Camera"
                    onPress={() => void handlePickAvatar("camera")}
                    variant="secondary"
                    disabled={isBusy}
                  />
                </View>
                <View style={styles.buttonCell}>
                  <AppButton
                    title="Gallery"
                    onPress={() => void handlePickAvatar("library")}
                    variant="secondary"
                    disabled={isBusy}
                  />
                </View>
              </View>

              {avatarPreviewUri ? (
                <AppButton
                  title="Remove photo"
                  onPress={() => {
                    setAvatarPreviewUri(null);
                    setPendingAvatar(null);
                  }}
                  variant="ghost"
                  disabled={isBusy}
                />
              ) : null}

              <AuthBanner tone="info">
                You can skip this now and upload a photo later from your profile settings.
              </AuthBanner>

              <View style={styles.buttonRow}>
                <View style={styles.buttonCell}>
                  <AppButton
                    title="Back"
                    onPress={handleBack}
                    variant="secondary"
                    disabled={isBusy}
                  />
                </View>
                <View style={styles.buttonCell}>
                  <AppButton
                    title="Finish - let's go"
                    onPress={handleFinish}
                    loading={loadingRegister}
                    disabled={isBusy}
                  />
                </View>
              </View>
            </>
          ) : null}

          <AuthFooterLink
            prefix="Already have an account?"
            actionLabel="Sign in"
            onPress={() => router.replace(APP_ROUTES.AUTH_LOGIN)}
          />
        </Stack>
      </AuthCard>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  inlineRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    alignItems: "flex-start",
  },
  inlineField: {
    flex: 1,
  },
  passwordBlock: {
    gap: theme.spacing.xs,
  },
  strengthWrap: {
    gap: theme.spacing.xxs,
  },
  strengthTrack: {
    height: 8,
    borderRadius: theme.radius.fill,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: theme.radius.fill,
  },
  helperText: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  sectionHint: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.sm,
    marginTop: -theme.spacing.xxs,
  },

  optionStack: {
    gap: theme.spacing.sm,
  },
  optionCard: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  optionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  optionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  optionCopy: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
  inlineError: {
    marginTop: -theme.spacing.sm,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  genderChip: {
    minWidth: 84,
    alignItems: "center",
  },
  chipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  buttonRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  buttonCell: {
    flex: 1,
  },
  avatarStep: {
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  avatarFrame: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitials: {
    fontSize: 34,
    fontWeight: theme.typography.fontWeight.bold,
  },
  avatarTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: "center",
  },
  avatarCopy: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.md,
    textAlign: "center",
  },
});
