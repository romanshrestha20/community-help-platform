import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import { Card, Row, Stack, theme } from "@/design-system";
import { AppInput } from "@/components/ui/AppInput";
import { AppModal } from "@/components/ui/AppModal";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { PhoneNumberField } from "@/components/ui/PhoneNumberField";
import { StickySubmitBar } from "@/components/ui/StickySubmitBar";
import { FormSection } from "@/components/ui/FormSection";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useFormValidation } from "@/utils/validation/useFormValidation";
import { showErrorToast, showInfoToast, showSuccessToast } from "@/utils/toast";
import {
  combinePhoneNumber,
  getCallingCodeForCountry,
  getPhoneRegionHint,
  normalizePhoneInput,
  resolvePhoneCountryCode,
  splitPhoneNumber,
} from "@/utils/phone";
import { fetchAvailableSkills } from "../services/user.service";
import { useUser } from "../hooks/user.hook";
import {
  CertificationStatus,
  ExperienceLevel,
  Gender,
  Skill,
  UpdateUserProfilePayload,
  UpdateUserSkillInput,
  User,
  UserCertification,
  UserType,
} from "../types/user.types";
import { validateProfileUpdateFormFields } from "../utils/userValidation";
import { buildProfileDraftKey, useProfileEditDraftStore } from "../store/profileEditDraft.store";

type Props = {
  user: User | null;
  loading?: boolean;
  onSubmit: (
    payload: Partial<UpdateUserProfilePayload>
  ) => Promise<{ success: boolean; message?: string | null }>;
  onCancel?: () => void;
};

const genderOptions: Gender[] = [Gender.MALE, Gender.FEMALE, Gender.OTHER];
const userTypeOptions: UserType[] = [UserType.GENERAL, UserType.ELDERLY, UserType.DISABLED];
const experienceLevels: ExperienceLevel[] = [
  ExperienceLevel.BEGINNER,
  ExperienceLevel.INTERMEDIATE,
  ExperienceLevel.ADVANCED,
  ExperienceLevel.EXPERT,
];
const MAX_SKILLS = 15;
const MAX_PRIMARY_SKILLS = 3;

const formatEnumLabel = (value?: string | null) => {
  if (!value) return "Not set";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getStatusTone = (status: CertificationStatus, palette: ReturnType<typeof useThemeContext>["palette"]) => {
  if (status === CertificationStatus.APPROVED) {
    return {
      backgroundColor: palette.successSurface,
      textColor: palette.success,
    };
  }

  if (status === CertificationStatus.REJECTED) {
    return {
      backgroundColor: palette.dangerSoft,
      textColor: palette.danger,
    };
  }

  return {
    backgroundColor: palette.warningSoft ?? palette.surfaceMuted,
    textColor: palette.warning ?? palette.textPrimary,
  };
};

const skillsEqual = (left: UpdateUserSkillInput[], right: UpdateUserSkillInput[]) => {
  if (left.length !== right.length) {
    return false;
  }

  const normalize = (items: UpdateUserSkillInput[]) =>
    [...items]
      .sort((a, b) => a.skillId.localeCompare(b.skillId))
      .map((item) => ({
        skillId: item.skillId,
        experienceLevel: item.experienceLevel,
        yearsExperience: item.yearsExperience ?? null,
        isPrimary: item.isPrimary,
      }));

  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
};

const mapProfileErrorToHumanMessage = (message?: string | null) => {
  const normalized = (message ?? "").trim().toLowerCase();
  if (!normalized) return "Please review your details and try again.";
  if (normalized.includes("internal server error")) {
    return "Profile update is temporarily unavailable. Please try again.";
  }
  if (normalized.includes("network error") || normalized.includes("could not reach the server")) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  if (normalized.includes("duplicate") || normalized.includes("already")) {
    return "Some profile details are already in use. Please update and retry.";
  }
  return message ?? "Please review your details and try again.";
};

const trackProfileFormEvent = (name: string, payload?: Record<string, unknown>) => {
  if (__DEV__) {
    console.log(`[profile-form] ${name}`, payload ?? {});
  }
};

export const ProfileEditForm = ({ user, loading = false, onSubmit, onCancel }: Props) => {
  const { palette } = useThemeContext();
  const { handleReplaceUserSkills, handleUploadCertification, handleDeleteCertification } = useUser();
  const locationPicker = useLocationPicker({
    initialValue: user?.address ?? null,
    autoUseCurrentLocationOnMount: !user?.address,
    storageKey: null,
  });
  const {
    validationError,
    setValidationError,
    fieldErrors,
    setFieldErrors,
    clearFieldError,
    clearValidationError,
  } = useFormValidation<"fullName" | "phone" | "dateOfBirth" | "bio">();
  const draftKey = buildProfileDraftKey(user?.id);
  const saveDraft = useProfileEditDraftStore((state) => state.saveDraft);
  const getDraft = useProfileEditDraftStore((state) => state.getDraft);
  const clearDraft = useProfileEditDraftStore((state) => state.clearDraft);
  const scrollViewRef = useRef<ScrollView>(null);
  const fullNameRef = useRef<TextInput>(null);
  const bioRef = useRef<TextInput>(null);

  const [fullName, setFullName] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("NP");
  const [phoneCallingCode, setPhoneCallingCode] = useState("");
  const [phoneNationalNumber, setPhoneNationalNumber] = useState("");
  const [phoneCountryTouched, setPhoneCountryTouched] = useState(false);
  const [phoneCountryDetected, setPhoneCountryDetected] = useState(false);
  const [bio, setBio] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [userType, setUserType] = useState<UserType>(UserType.GENERAL);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<UpdateUserSkillInput[]>([]);
  const [skillsModalVisible, setSkillsModalVisible] = useState(false);
  const [certificationsModalVisible, setCertificationsModalVisible] = useState(false);
  const [savingSkills, setSavingSkills] = useState(false);
  const [certificationBusyId, setCertificationBusyId] = useState<string | null>(null);
  const [uploadingCertification, setUploadingCertification] = useState(false);
  const [certificationName, setCertificationName] = useState("");
  const [certificationIssuer, setCertificationIssuer] = useState("");
  const [certificationCredentialId, setCertificationCredentialId] = useState("");
  const [certificationIssuedAt, setCertificationIssuedAt] = useState("");
  const [certificationExpiresAt, setCertificationExpiresAt] = useState("");

  const currentCertifications = user?.certifications ?? [];
  const primarySkillsCount = selectedSkills.filter((skill) => skill.isPrimary).length;
  const previewSkills = useMemo(() => {
    const prioritizedSkills = selectedSkills
      .map((selectedSkill) => {
        const skillMeta = availableSkills.find((item) => item.id === selectedSkill.skillId);

        return {
          ...selectedSkill,
          skillName: skillMeta?.name || "Selected skill",
        };
      })
      .sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary));

    return prioritizedSkills.slice(0, 4);
  }, [availableSkills, selectedSkills]);
  const currentSkills = useMemo<UpdateUserSkillInput[]>(
    () =>
      (user?.skills ?? []).map((skill) => ({
        skillId: skill.skillId,
        experienceLevel: skill.experienceLevel,
        yearsExperience: skill.yearsExperience ?? null,
        isPrimary: skill.isPrimary,
      })),
    [user?.skills]
  );
  const currentPhone = useMemo(
    () => combinePhoneNumber(phoneCallingCode, phoneNationalNumber),
    [phoneCallingCode, phoneNationalNumber]
  );

  useEffect(() => {
    let isCancelled = false;

    const loadSkills = async () => {
      const nextSkills = await fetchAvailableSkills();

      if (!isCancelled) {
        setAvailableSkills(nextSkills);
      }
    };

    void loadSkills();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const syncPhoneState = async () => {
      const parsedPhone = await splitPhoneNumber(user?.phone);
      const fallbackCountryCode = await resolvePhoneCountryCode(
        user?.address?.countryCode ?? null,
        user?.address?.country ?? null
      );
      const shouldUseFallbackCountry =
        Boolean(user?.phone?.trim()) &&
        parsedPhone.countryCode === "NP" &&
        fallbackCountryCode &&
        fallbackCountryCode !== parsedPhone.countryCode;

      const nextCountryCode = shouldUseFallbackCountry
        ? fallbackCountryCode
        : parsedPhone.countryCode;
      const nextCallingCode = shouldUseFallbackCountry
        ? await getCallingCodeForCountry(fallbackCountryCode)
        : parsedPhone.callingCode;

      if (isCancelled) {
        return;
      }

      setPhoneCountryCode(nextCountryCode);
      setPhoneCallingCode(`+${(nextCallingCode ?? "").replace(/^\+/, "")}`);
      setPhoneNationalNumber(parsedPhone.nationalNumber);
      setPhoneCountryTouched(false);
      setPhoneCountryDetected(false);
    };

    const draft = getDraft(draftKey);

    setFullName(draft?.fullName ?? user?.fullName ?? "");
    setBio(draft?.bio ?? user?.bio ?? "");
    setDateOfBirth(draft?.dateOfBirth ?? user?.dateOfBirth ?? "");
    setGender(draft?.gender ?? user?.gender);
    setUserType(draft?.userType ?? user?.userType ?? UserType.GENERAL);
    setSelectedSkills(draft?.selectedSkills ?? currentSkills);
    setCertificationName(draft?.certificationName ?? "");
    setCertificationIssuer(draft?.certificationIssuer ?? "");
    setCertificationCredentialId(draft?.certificationCredentialId ?? "");
    setCertificationIssuedAt(draft?.certificationIssuedAt ?? "");
    setCertificationExpiresAt(draft?.certificationExpiresAt ?? "");
    const draftPhone = draft?.phoneCountryCode
      ? combinePhoneNumber(draft.phoneCallingCode, draft.phoneNationalNumber)
      : "";
    const savedPhone = normalizePhoneInput(user?.phone ?? "");
    const shouldUseDraftPhone =
      Boolean(draft?.phoneCountryCode) &&
      (!savedPhone || normalizePhoneInput(draftPhone) === savedPhone);

    if (shouldUseDraftPhone && draft?.phoneCountryCode) {
      setPhoneCountryCode(draft.phoneCountryCode);
      setPhoneCallingCode(draft.phoneCallingCode);
      setPhoneNationalNumber(draft.phoneNationalNumber);
      setPhoneCountryTouched(false);
      setPhoneCountryDetected(false);
    }
    clearValidationError();
    if (!shouldUseDraftPhone) {
      void syncPhoneState();
    }

    return () => {
      isCancelled = true;
    };
  }, [
    clearValidationError,
    currentSkills,
    draftKey,
    getDraft,
    user?.bio,
    user?.dateOfBirth,
    user?.fullName,
    user?.gender,
    user?.phone,
    user?.userType,
  ]);

  useEffect(() => {
    saveDraft(draftKey, {
      fullName,
      phoneCountryCode,
      phoneCallingCode,
      phoneNationalNumber,
      bio,
      dateOfBirth,
      gender,
      userType,
      selectedSkills,
      certificationName,
      certificationIssuer,
      certificationCredentialId,
      certificationIssuedAt,
      certificationExpiresAt,
    });
  }, [
    bio,
    certificationCredentialId,
    certificationExpiresAt,
    certificationIssuedAt,
    certificationIssuer,
    certificationName,
    dateOfBirth,
    draftKey,
    fullName,
    gender,
    phoneCallingCode,
    phoneCountryCode,
    phoneNationalNumber,
    saveDraft,
    selectedSkills,
    userType,
  ]);

  useEffect(() => {
    let isCancelled = false;

    const syncPhoneCountryFromLocation = async () => {
      if (phoneCountryTouched || user?.phone) {
        return;
      }

      const detectedCountryCode = await resolvePhoneCountryCode(
        locationPicker.value?.countryCode ?? user?.address?.countryCode ?? null,
        locationPicker.value?.country ?? user?.address?.country ?? null
      );

      if (!detectedCountryCode) {
        return;
      }

      const resolvedCallingCode = await getCallingCodeForCountry(detectedCountryCode);

      if (isCancelled || !resolvedCallingCode) {
        return;
      }

      setPhoneCountryCode(detectedCountryCode);
      setPhoneCallingCode(`+${resolvedCallingCode}`);
      setPhoneCountryDetected(true);
    };

    void syncPhoneCountryFromLocation();

    return () => {
      isCancelled = true;
    };
  }, [
    locationPicker.value?.country,
    locationPicker.value?.countryCode,
    phoneCountryTouched,
    user?.address?.country,
    user?.address?.countryCode,
    user?.phone,
  ]);

  const baselineProfileState = useMemo(
    () => ({
      fullName: (user?.fullName ?? "").trim(),
      phone: (user?.phone ?? "").trim(),
      bio: (user?.bio ?? "").trim(),
      dateOfBirth: (user?.dateOfBirth ?? "").trim(),
      gender: user?.gender ?? null,
      userType: user?.userType ?? UserType.GENERAL,
      selectedSkills: currentSkills,
    }),
    [currentSkills, user?.bio, user?.dateOfBirth, user?.fullName, user?.gender, user?.phone, user?.userType]
  );

  const draftProfileState = useMemo(
    () => ({
      fullName: fullName.trim(),
      phone: currentPhone.trim(),
      bio: bio.trim(),
      dateOfBirth: dateOfBirth.trim(),
      gender: gender ?? null,
      userType,
      selectedSkills,
    }),
    [bio, currentPhone, dateOfBirth, fullName, gender, selectedSkills, userType]
  );

  const isDirty =
    JSON.stringify({
      ...draftProfileState,
      selectedSkills: [...draftProfileState.selectedSkills].sort((a, b) => a.skillId.localeCompare(b.skillId)),
    }) !==
    JSON.stringify({
      ...baselineProfileState,
      selectedSkills: [...baselineProfileState.selectedSkills].sort((a, b) => a.skillId.localeCompare(b.skillId)),
    });

  useUnsavedChangesGuard({
    enabled: isDirty && !loading && !savingSkills && !uploadingCertification,
  });

  const handleToggleSkill = (skill: Skill) => {
    setSelectedSkills((current) => {
      const existing = current.find((item) => item.skillId === skill.id);

      if (existing) {
        return current.filter((item) => item.skillId !== skill.id);
      }

      if (current.length >= MAX_SKILLS) {
        showInfoToast("Skill limit reached", `You can add up to ${MAX_SKILLS} skills.`);
        return current;
      }

      return [
        ...current,
        {
          skillId: skill.id,
          experienceLevel: ExperienceLevel.INTERMEDIATE,
          yearsExperience: null,
          isPrimary: false,
        },
      ];
    });
  };

  const updateSelectedSkill = (
    skillId: string,
    updater: (current: UpdateUserSkillInput) => UpdateUserSkillInput
  ) => {
    setSelectedSkills((current) =>
      current.map((item) => (item.skillId === skillId ? updater(item) : item))
    );
  };

  const handleTogglePrimarySkill = (skillId: string) => {
    setSelectedSkills((current) => {
      const target = current.find((item) => item.skillId === skillId);
      if (!target) {
        return current;
      }

      const nextValue = !target.isPrimary;
      const primaryCount = current.filter((item) => item.isPrimary).length;

      if (nextValue && primaryCount >= MAX_PRIMARY_SKILLS) {
        showInfoToast(
          "Primary skill limit reached",
          `You can mark up to ${MAX_PRIMARY_SKILLS} primary skills.`
        );
        return current;
      }

      return current.map((item) =>
        item.skillId === skillId ? { ...item, isPrimary: nextValue } : item
      );
    });
  };

  const handleUploadCertificationProof = async () => {
    if (!certificationName.trim() || !certificationIssuer.trim()) {
      showErrorToast("Missing details", "Certification name and issuer are required.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showInfoToast("Permission required", "Please allow access to your photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];

    setUploadingCertification(true);
    try {
      const response = await handleUploadCertification({
        uri: asset.uri,
        name: asset.fileName ?? `certification-${Date.now()}.jpg`,
        type: asset.mimeType ?? "image/jpeg",
        webFile: (asset as any).file ?? undefined,
        certificationName,
        issuer: certificationIssuer,
        credentialId: certificationCredentialId || undefined,
        issuedAt: certificationIssuedAt || undefined,
        expiresAt: certificationExpiresAt || undefined,
      });

      if (response.success) {
        setCertificationName("");
        setCertificationIssuer("");
        setCertificationCredentialId("");
        setCertificationIssuedAt("");
        setCertificationExpiresAt("");
        showSuccessToast("Certification uploaded");
      } else {
        showErrorToast("Upload failed", response.message || "Could not upload certification.");
      }
    } finally {
      setUploadingCertification(false);
    }
  };

  const handleDeleteCertificationItem = async (certification: UserCertification) => {
    Alert.alert(
      "Delete certification",
      `Remove "${certification.name}" from your profile?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setCertificationBusyId(certification.id);
            try {
              const response = await handleDeleteCertification(certification.id);
              if (!response.success) {
                showErrorToast(
                  "Delete failed",
                  response.message || "Could not remove certification."
                );
              }
            } finally {
              setCertificationBusyId(null);
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    const phone = currentPhone;

    const validation = validateProfileUpdateFormFields({
      fullName,
      phone,
      dateOfBirth,
      bio,
    });

    if (!validation.isValid) {
      setValidationError(validation.formError);
      setFieldErrors(validation.fieldErrors);
      const firstInvalidField = Object.keys(validation.fieldErrors)[0] as
        | "fullName"
        | "phone"
        | "dateOfBirth"
        | "bio"
        | undefined;
      if (firstInvalidField === "fullName") {
        fullNameRef.current?.focus();
      } else if (firstInvalidField === "bio") {
        bioRef.current?.focus();
      } else {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
      showErrorToast(
        "Invalid profile details",
        validation.formError || "Please fix the highlighted fields."
      );
      trackProfileFormEvent("validation_failed", {
        firstInvalidField: Object.keys(validation.fieldErrors)[0] ?? null,
      });
      return;
    }

    clearValidationError();
    setFieldErrors({});

    const result = await onSubmit({
      fullName: fullName.trim(),
      phone: phone || undefined,
      bio: bio.trim(),
      dateOfBirth: dateOfBirth.trim() || undefined,
      gender,
      userType,
    });

    if (!result.success) {
      const message = mapProfileErrorToHumanMessage(result.message);
      setValidationError(message);
      showErrorToast("Could not update profile", message);
      trackProfileFormEvent("save_failed", { reason: message });
      return;
    }

    if (!skillsEqual(selectedSkills, currentSkills)) {
      setSavingSkills(true);
      try {
        const skillResult = await handleReplaceUserSkills(selectedSkills);

        if (!skillResult.success) {
          showErrorToast(
            "Could not update skills",
            skillResult.message || "Please try again."
          );
          return;
        }
      } finally {
        setSavingSkills(false);
      }
    }

    clearDraft(draftKey);
    trackProfileFormEvent("save_success", { hasSkills: selectedSkills.length > 0 });
    showSuccessToast("Profile updated");
  };

  const profileCompletionItems = [
    Boolean(fullName.trim()),
    Boolean(currentPhone.trim()),
    Boolean(dateOfBirth.trim()),
    Boolean(gender),
    Boolean(bio.trim()),
  ];
  const profileCompletionPercent = Math.round(
    (profileCompletionItems.filter(Boolean).length / profileCompletionItems.length) * 100
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
      style={styles.flex}
    >
      <Card padded={false} style={styles.formCard}>
        <Stack gap="md">
        <View style={styles.headerBlock}>
          <Text style={[styles.title, { color: palette.textPrimary }]}>Edit profile</Text>
          <Text style={[styles.formSubtitle, { color: palette.textSecondary }]}>
            Update your personal details separately from the qualifications requesters see.
          </Text>
          <Text style={[styles.completionText, { color: palette.textSecondary }]}>
            Profile completion: {profileCompletionPercent}%
          </Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <FormSection
            title="Profile details"
            subtitle="Basic information used across your account and conversations."
          >
            <AppInput
                label="Full name"
                required
                value={fullName}
                onChangeText={(value) => {
                  clearFieldError("fullName");
                  setFullName(value);
                }}
                helperText="Example: Alex Johnson"
                placeholder="Enter your full name"
                error={fieldErrors.fullName ?? null}
                returnKeyType="next"
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="name"
                ref={fullNameRef}
              />

            <PhoneNumberField
              label="Phone number"
              countryCode={phoneCountryCode}
              callingCode={phoneCallingCode}
              nationalNumber={phoneNationalNumber}
              error={fieldErrors.phone ?? null}
              hint={getPhoneRegionHint(phoneCountryCode, phoneCallingCode)}
              detectedLabel={
                !phoneCountryTouched && phoneCountryDetected
                  ? "Detected from current location"
                  : null
              }
              onCountryChange={({ countryCode, callingCode }, source) => {
                clearFieldError("phone");
                if (source === "user") {
                  setPhoneCountryTouched(true);
                  setPhoneCountryDetected(false);
                }
                setPhoneCountryCode(countryCode);
                setPhoneCallingCode(callingCode);
              }}
              onNationalNumberChange={(value) => {
                clearFieldError("phone");
                setPhoneNationalNumber(value.replace(/\D/g, ""));
              }}
            />

            <AppInput
                label="Bio"
                value={bio}
                onChangeText={(value) => {
                  clearFieldError("bio");
                  setBio(value);
                }}
                helperText="Short intro shown on your profile."
                placeholder="Tell something about yourself"
                error={fieldErrors.bio ?? null}
                multiline
                numberOfLines={4}
                returnKeyType="done"
                ref={bioRef}
              />

            <DatePickerField
              label="Date of birth"
              value={dateOfBirth}
              onChangeText={(value) => {
                clearFieldError("dateOfBirth");
                setDateOfBirth(value);
              }}
              error={fieldErrors.dateOfBirth ?? null}
            />

            <Field label="Gender">
              <Row gap="xs" style={styles.wrapRow}>
                {genderOptions.map((option) => {
                  const selected = gender === option;

                  return (
                    <SelectablePill
                      key={option}
                      selected={selected}
                      label={formatEnumLabel(option)}
                      onPress={() => setGender(selected ? undefined : option)}
                      accessibilityLabel={`Select gender ${formatEnumLabel(option)}`}
                    />
                  );
                })}
              </Row>
            </Field>

            <Field label="User type">
              <Row gap="xs" style={styles.wrapRow}>
                {userTypeOptions.map((option) => (
                  <SelectablePill
                    key={option}
                    selected={userType === option}
                    label={formatEnumLabel(option)}
                    onPress={() => setUserType(option)}
                    accessibilityLabel={`Select user type ${formatEnumLabel(option)}`}
                  />
                ))}
              </Row>
            </Field>
          </FormSection>

          <FormSection
            title="Qualifications"
            subtitle="Skills and certifications that help requesters trust your profile."
          >
            <Pressable
              style={[
                styles.summaryCard,
                {
                  backgroundColor: palette.surfaceMuted,
                  borderColor: palette.border,
                },
              ]}
              onPress={() => setSkillsModalVisible(true)}
            >
              <Row justify="space-between" align="flex-start" gap="md">
                <View style={styles.summaryCopy}>
                  <Text style={[styles.summaryLabel, { color: palette.textSecondary }]}>
                    Skills
                  </Text>
                  <Text style={[styles.summaryTitle, { color: palette.textPrimary }]}>
                    {selectedSkills.length === 0
                      ? "Add skills to improve trust and conversion."
                      : `${selectedSkills.length} selected, ${primarySkillsCount} primary`}
                  </Text>
                  <View style={styles.summaryPreviewWrap}>
                    {previewSkills.map((skill) => (
                      <View
                        key={skill.skillId}
                        style={[
                          styles.previewChip,
                          {
                            backgroundColor: skill.isPrimary
                              ? palette.primarySoft
                              : palette.surface,
                            borderColor: skill.isPrimary ? palette.primary : palette.border,
                          },
                        ]}
                      >
                        <Text style={[styles.previewChipTitle, { color: palette.textPrimary }]}>
                          {skill.skillName}
                        </Text>
                        <Text style={[styles.previewChipMeta, { color: palette.textSecondary }]}>
                          {formatEnumLabel(skill.experienceLevel)}
                        </Text>
                      </View>
                    ))}
                    {selectedSkills.length === 0 ? (
                      <Text style={[styles.emptyQualificationText, { color: palette.textSecondary }]}>
                        Open skills to choose the services you can confidently help with.
                      </Text>
                    ) : null}
                  </View>
                </View>

                <Text style={[styles.summaryActionText, { color: palette.primary }]}>
                  Manage
                </Text>
              </Row>
            </Pressable>

            <Pressable
              style={[
                styles.summaryCard,
                {
                  backgroundColor: palette.surfaceMuted,
                  borderColor: palette.border,
                },
              ]}
              onPress={() => setCertificationsModalVisible(true)}
            >
              <Row justify="space-between" align="flex-start" gap="md">
                <View style={styles.summaryCopy}>
                  <Text style={[styles.summaryLabel, { color: palette.textSecondary }]}>
                    Certifications
                  </Text>
                  <Text style={[styles.summaryTitle, { color: palette.textPrimary }]}>
                    {currentCertifications.length === 0
                      ? "No certifications uploaded yet."
                      : `${currentCertifications.length} certification${currentCertifications.length === 1 ? "" : "s"} on file`}
                  </Text>
                  <Stack gap="sm" style={styles.summaryRows}>
                    {currentCertifications.slice(0, 2).map((certification) => (
                      <View
                        key={certification.id}
                        style={[
                          styles.summaryRow,
                          {
                            backgroundColor: palette.surface,
                            borderColor: palette.border,
                          },
                        ]}
                      >
                        <Text style={[styles.summaryRowTitle, { color: palette.textPrimary }]}>
                          {certification.name}
                        </Text>
                        <Text style={[styles.summaryRowMeta, { color: palette.textSecondary }]}>
                          {certification.issuer}
                        </Text>
                      </View>
                    ))}
                    {currentCertifications.length === 0 ? (
                      <Text style={[styles.emptyQualificationText, { color: palette.textSecondary }]}>
                        Upload proof documents so approved certifications can appear on your public profile.
                      </Text>
                    ) : null}
                  </Stack>
                </View>

                <Text style={[styles.summaryActionText, { color: palette.primary }]}>
                  Manage
                </Text>
              </Row>
            </Pressable>
          </FormSection>

          {validationError ? (
            <Text style={[styles.errorText, { color: palette.danger }]}>{validationError}</Text>
          ) : null}

          <View style={styles.stickySpacer} />
        </ScrollView>
      </Stack>

      <AppModal
        visible={skillsModalVisible}
        title="Skills & experience"
        onClose={() => setSkillsModalVisible(false)}
        showCloseButton
        scrollable
      >
        <Text style={[styles.modalDescription, { color: palette.textSecondary }]}>
          Add up to 15 skills and mark up to 3 as primary.
        </Text>

        {availableSkills.length === 0 ? (
          <ModalEmptyState
            title="No skills available right now"
            description="Try again shortly. Available skills are loaded from the server before you can select them."
          />
        ) : null}

        <View style={styles.skillWrap}>
          {availableSkills.map((skill) => {
            const selected = selectedSkills.some((item) => item.skillId === skill.id);

            return (
              <SelectablePill
                key={skill.id}
                selected={selected}
                label={skill.name}
                onPress={() => handleToggleSkill(skill)}
              />
            );
          })}
        </View>

        {selectedSkills.length === 0 ? (
          <ModalEmptyState
            title="No skills selected"
            description="Pick a few skills above, then set experience level and mark the ones you want highlighted as primary."
          />
        ) : (
          selectedSkills.map((selectedSkill) => {
            const skillMeta = availableSkills.find((item) => item.id === selectedSkill.skillId);

            return (
              <View
                key={selectedSkill.skillId}
                style={[
                  styles.skillCard,
                  {
                    backgroundColor: palette.surfaceMuted,
                    borderColor: palette.border,
                  },
                ]}
              >
                <Row justify="space-between" align="center" gap="sm">
                  <Text style={[styles.skillTitle, { color: palette.textPrimary }]}>
                    {skillMeta?.name || "Selected skill"}
                  </Text>

                  <Pressable onPress={() => handleTogglePrimarySkill(selectedSkill.skillId)}>
                    <Text
                      style={[
                        styles.primaryToggle,
                        {
                          color: selectedSkill.isPrimary ? palette.primary : palette.textSecondary,
                        },
                      ]}
                    >
                      {selectedSkill.isPrimary ? "Primary" : "Mark primary"}
                    </Text>
                  </Pressable>
                </Row>

                <Row gap="xs" style={styles.wrapRow}>
                  {experienceLevels.map((level) => (
                    <SelectablePill
                      key={level}
                      selected={selectedSkill.experienceLevel === level}
                      label={formatEnumLabel(level)}
                      onPress={() =>
                        updateSelectedSkill(selectedSkill.skillId, (current) => ({
                          ...current,
                          experienceLevel: level,
                        }))
                      }
                    />
                  ))}
                </Row>

                <TextInput
                  value={
                    typeof selectedSkill.yearsExperience === "number"
                      ? String(selectedSkill.yearsExperience)
                      : ""
                  }
                  onChangeText={(value) =>
                    updateSelectedSkill(selectedSkill.skillId, (current) => ({
                      ...current,
                      yearsExperience: value.trim() ? Number(value.replace(/\D/g, "")) : null,
                    }))
                  }
                  keyboardType="number-pad"
                  placeholder="Years of experience"
                  style={[
                    styles.input,
                    styles.compactInput,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.border,
                      color: palette.textPrimary,
                    },
                  ]}
                  placeholderTextColor={palette.textSecondary}
                />
              </View>
            );
          })
        )}
      </AppModal>

      <AppModal
        visible={certificationsModalVisible}
        title="Certifications"
        onClose={() => setCertificationsModalVisible(false)}
        showCloseButton
        scrollable
      >
        <Text style={[styles.modalDescription, { color: palette.textSecondary }]}>
          Upload proof images and track the review state for each certification.
        </Text>

        <Field label="Certification name">
          <TextInput
            value={certificationName}
            onChangeText={setCertificationName}
            placeholder="Example: First Aid Basics"
            style={[
              styles.input,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
                color: palette.textPrimary,
              },
            ]}
            placeholderTextColor={palette.textSecondary}
          />
        </Field>

        <Field label="Issuer">
          <TextInput
            value={certificationIssuer}
            onChangeText={setCertificationIssuer}
            placeholder="Organization or institution"
            style={[
              styles.input,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
                color: palette.textPrimary,
              },
            ]}
            placeholderTextColor={palette.textSecondary}
          />
        </Field>

        <Field label="Credential ID">
          <TextInput
            value={certificationCredentialId}
            onChangeText={setCertificationCredentialId}
            placeholder="Optional credential number"
            style={[
              styles.input,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
                color: palette.textPrimary,
              },
            ]}
            placeholderTextColor={palette.textSecondary}
          />
        </Field>

        <DatePickerField
          label="Issued at"
          value={certificationIssuedAt}
          onChangeText={setCertificationIssuedAt}
        />

        <DatePickerField
          label="Expires at"
          value={certificationExpiresAt}
          onChangeText={setCertificationExpiresAt}
        />

        <Pressable
          style={[
            styles.uploadButton,
            {
              backgroundColor: palette.primarySoft,
              borderColor: palette.primary,
              opacity: uploadingCertification ? 0.7 : 1,
            },
          ]}
          onPress={() => void handleUploadCertificationProof()}
          disabled={uploadingCertification}
        >
          {uploadingCertification ? (
            <ActivityIndicator color={palette.primary} />
          ) : (
            <Text style={[styles.uploadButtonText, { color: palette.primary }]}>
              Upload proof image
            </Text>
          )}
        </Pressable>

        {currentCertifications.length === 0 ? (
          <ModalEmptyState
            title="No certifications uploaded"
            description="Add a certification name, issuer, and proof image to start the review process."
          />
        ) : null}

        <Stack gap="sm">
          {currentCertifications.map((certification) => {
            const tone = getStatusTone(certification.status, palette);
            const busy = certificationBusyId === certification.id;

            return (
              <View
                key={certification.id}
                style={[
                  styles.certificationCard,
                  {
                    backgroundColor: palette.surfaceMuted,
                    borderColor: palette.border,
                  },
                ]}
              >
                <Row justify="space-between" align="center" gap="sm">
                  <View style={styles.certificationCopy}>
                    <Text style={[styles.certificationTitle, { color: palette.textPrimary }]}>
                      {certification.name}
                    </Text>
                    <Text style={[styles.certificationMeta, { color: palette.textSecondary }]}>
                      {certification.issuer}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: tone.backgroundColor },
                    ]}
                  >
                    <Text style={[styles.statusBadgeText, { color: tone.textColor }]}>
                      {formatEnumLabel(certification.status)}
                    </Text>
                  </View>
                </Row>

                {certification.credentialId ? (
                  <Text style={[styles.certificationMeta, { color: palette.textSecondary }]}>
                    Credential ID: {certification.credentialId}
                  </Text>
                ) : null}

                {certification.rejectionReason ? (
                  <Text style={[styles.certificationNote, { color: palette.danger }]}>
                    Rejection note: {certification.rejectionReason}
                  </Text>
                ) : null}

                {certification.reviewNote ? (
                  <Text style={[styles.certificationMeta, { color: palette.textSecondary }]}>
                    Review note: {certification.reviewNote}
                  </Text>
                ) : null}

                <Row justify="space-between" align="center">
                  <Text style={[styles.certificationMeta, { color: palette.textSecondary }]}>
                    {certification.proofUrl ? "Proof uploaded" : "No proof URL"}
                  </Text>

                  <Pressable
                    onPress={() => void handleDeleteCertificationItem(certification)}
                    disabled={busy}
                  >
                    {busy ? (
                      <ActivityIndicator color={palette.danger} />
                    ) : (
                      <Text style={[styles.deleteText, { color: palette.danger }]}>Delete</Text>
                    )}
                  </Pressable>
                </Row>
              </View>
            );
          })}
        </Stack>
      </AppModal>
      <StickySubmitBar>
        <Row gap="sm">
          {onCancel ? (
            <Pressable
              style={[
                styles.secondaryAction,
                {
                  borderColor: palette.border,
                  backgroundColor: palette.surfaceMuted,
                },
              ]}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel profile changes"
            >
              <Text style={[styles.secondaryActionText, { color: palette.textPrimary }]}>
                Cancel
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            style={[
              styles.primaryAction,
              {
                backgroundColor: palette.primary,
                opacity: loading || savingSkills || !isDirty ? 0.7 : 1,
              },
            ]}
            onPress={() => void handleSave()}
            disabled={loading || savingSkills || !isDirty}
            accessibilityRole="button"
            accessibilityLabel="Save profile"
          >
            {loading || savingSkills ? (
              <ActivityIndicator color={palette.surface} />
            ) : (
              <Text style={[styles.primaryActionText, { color: palette.surface }]}>
                Save profile
              </Text>
            )}
          </Pressable>
        </Row>
      </StickySubmitBar>
    </Card>
    </KeyboardAvoidingView>
  );
};

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => {
  const { palette } = useThemeContext();

  return (
    <Stack gap="xs">
      <Text style={[styles.label, { color: palette.textSecondary }]}>{label}</Text>
      {children}
    </Stack>
  );
};

const SectionTitle = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => {
  const { palette } = useThemeContext();

  return (
    <Stack gap="xxs" style={styles.sectionTitleWrap}>
      <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>{title}</Text>
      <Text style={[styles.sectionSubtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
    </Stack>
  );
};

const SectionCard = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <SectionTitle title={title} subtitle={subtitle} />
      <Stack gap="md" style={styles.sectionCardBody}>
        {children}
      </Stack>
    </View>
  );
};

const ModalEmptyState = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.modalEmptyState,
        {
          backgroundColor: palette.surfaceMuted,
          borderColor: palette.border,
        },
      ]}
    >
      <Text style={[styles.modalEmptyTitle, { color: palette.textPrimary }]}>{title}</Text>
      <Text style={[styles.modalEmptyText, { color: palette.textSecondary }]}>{description}</Text>
    </View>
  );
};

const SelectablePill = ({
  selected,
  label,
  onPress,
  accessibilityLabel,
}: {
  selected: boolean;
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}) => {
  const { palette } = useThemeContext();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        styles.pill,
        {
          backgroundColor: selected ? palette.primarySoft : palette.surfaceMuted,
          borderColor: selected ? palette.primary : palette.border,
        },
      ]}
    >
      <Text
        numberOfLines={2}
        style={[
          styles.pillText,
          { color: selected ? palette.primary : palette.textPrimary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};



const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  formCard: {
    borderRadius: theme.radius.xl,
    overflow: "hidden",
  },
  headerBlock: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.xxs,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  formSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  completionText: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  content: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  stickySpacer: {
    height: 96,
  },
  label: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSize.sm,
  },
  compactInput: {
    minHeight: 46,
  },
  textArea: {
    minHeight: 110,
    paddingTop: theme.spacing.md,
  },
  sectionTitleWrap: {
    gap: theme.spacing.xxs,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
  },
  sectionCardBody: {
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.xs + 1,
    lineHeight: theme.typography.lineHeight.xs + 3,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  summaryCopy: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  summaryTitle: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  summaryText: {
    fontSize: theme.typography.fontSize.xs + 1,
    lineHeight: theme.typography.lineHeight.xs + 3,
  },
  summaryActionText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  summaryPreviewWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  previewChip: {
    width: "48%",
    maxWidth: 164,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xxs,
  },
  previewChipTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  previewChipMeta: {
    fontSize: theme.typography.fontSize.xs + 1,
    lineHeight: theme.typography.lineHeight.xs + 3,
  },
  summaryRows: {
    marginTop: theme.spacing.xxs,
  },
  summaryRow: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.xxs,
  },
  summaryRowTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  summaryRowMeta: {
    fontSize: theme.typography.fontSize.xs + 1,
    lineHeight: theme.typography.lineHeight.xs + 3,
  },
  modalDescription: {
    fontSize: theme.typography.fontSize.xs + 1,
    lineHeight: theme.typography.lineHeight.xs + 3,
  },
  modalEmptyState: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.xxs,
  },
  modalEmptyTitle: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  modalEmptyText: {
    fontSize: theme.typography.fontSize.xs + 1,
    lineHeight: theme.typography.lineHeight.xs + 3,
  },
  skillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  wrapRow: {
    flexWrap: "wrap",
    columnGap: theme.spacing.sm,
    rowGap: theme.spacing.sm,
  },
  pill: {
    maxWidth: 168,
    minHeight: 38,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    justifyContent: "center",
  },
  pillText: {
    fontSize: theme.typography.fontSize.xs + 1,
    lineHeight: theme.typography.lineHeight.xs + 2,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: "center",
  },
  skillCard: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  skillTitle: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  primaryToggle: {
    fontSize: theme.typography.fontSize.xs + 1,
    lineHeight: theme.typography.lineHeight.xs + 2,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  uploadButton: {
    minHeight: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
  },
  uploadButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  certificationCard: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  certificationCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  certificationTitle: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  certificationMeta: {
    fontSize: theme.typography.fontSize.xs + 1,
    lineHeight: theme.typography.lineHeight.xs + 3,
  },
  emptyQualificationText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  certificationNote: {
    fontSize: theme.typography.fontSize.xs + 1,
    lineHeight: theme.typography.lineHeight.xs + 3,
    fontWeight: theme.typography.fontWeight.medium,
  },
  statusBadge: {
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  statusBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  deleteText: {
    fontSize: theme.typography.fontSize.xs + 1,
    lineHeight: theme.typography.lineHeight.xs + 2,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs + 2,
  },
  primaryAction: {
    flex: 1,
    minHeight: 52,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  secondaryAction: {
    minWidth: 108,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
  },
  secondaryActionText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
