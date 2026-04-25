import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Card, Row, Stack, theme } from "@/design-system";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { PhoneNumberField } from "@/components/ui/PhoneNumberField";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useFormValidation } from "@/utils/validation/useFormValidation";
import {
  combinePhoneNumber,
  getCallingCodeForCountry,
  getPhoneRegionHint,
  resolvePhoneCountryCode,
  splitPhoneNumber,
} from "@/utils/phone";
import { Gender, UpdateUserProfilePayload, User, UserType } from "../types/user.types";
import { validateProfileUpdateFormFields } from "../utils/userValidation";

type Props = {
  user: User | null;
  loading?: boolean;
  onSubmit: (payload: Partial<UpdateUserProfilePayload>) => Promise<boolean>;
  onCancel?: () => void;
};

const genderOptions: Gender[] = [Gender.MALE, Gender.FEMALE, Gender.OTHER];
const userTypeOptions: UserType[] = [UserType.GENERAL, UserType.ELDERLY, UserType.DISABLED];

export const ProfileEditForm = ({ user, loading = false, onSubmit, onCancel }: Props) => {
  const { palette } = useThemeContext();
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

  useEffect(() => {
    let isCancelled = false;

    const syncPhoneState = async () => {
      const parsedPhone = await splitPhoneNumber(user?.phone);

      if (isCancelled) {
        return;
      }

      setPhoneCountryCode(parsedPhone.countryCode);
      setPhoneCallingCode(`+${parsedPhone.callingCode.replace(/^\+/, "")}`);
      setPhoneNationalNumber(parsedPhone.nationalNumber);
      setPhoneCountryDetected(false);
    };

    setFullName(user?.fullName ?? "");
    setBio(user?.bio ?? "");
    setDateOfBirth(user?.dateOfBirth ?? "");
    setGender(user?.gender);
    setUserType(user?.userType ?? UserType.GENERAL);
    clearValidationError();
    void syncPhoneState();

    return () => {
      isCancelled = true;
    };
  }, [
    clearValidationError,
    user?.bio,
    user?.dateOfBirth,
    user?.fullName,
    user?.gender,
    user?.phone,
    user?.userType,
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

  const handleSave = async () => {
    const phone = combinePhoneNumber(phoneCallingCode, phoneNationalNumber);

    const validation = validateProfileUpdateFormFields({
      fullName,
      phone,
      dateOfBirth,
      bio,
    });

    if (!validation.isValid) {
      setValidationError(validation.formError);
      setFieldErrors(validation.fieldErrors);
      return;
    }

    clearValidationError();

    await onSubmit({
      fullName: fullName.trim(),
      phone: phone || undefined,
      bio: bio.trim(),
      dateOfBirth: dateOfBirth.trim() || undefined,
      gender,
      userType,
    });
  };

  return (
    <Card>
      <Stack gap="md">
        <Text style={[styles.title, { color: palette.textPrimary }]}>Edit profile</Text>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Field label="Full name">
            <TextInput
              value={fullName}
              onChangeText={(value) => {
                clearFieldError("fullName");
                setFullName(value);
              }}
              placeholder="Enter full name"
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
            {fieldErrors.fullName ? (
              <Text style={[styles.errorText, { color: palette.danger }]}>{fieldErrors.fullName}</Text>
            ) : null}
          </Field>

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

          <Field label="Bio">
            <TextInput
              value={bio}
              onChangeText={(value) => {
                clearFieldError("bio");
                setBio(value);
              }}
              placeholder="Tell something about yourself"
              multiline
              textAlignVertical="top"
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: palette.surfaceMuted,
                  borderColor: palette.border,
                  color: palette.textPrimary,
                },
              ]}
              placeholderTextColor={palette.textSecondary}
            />
            {fieldErrors.bio ? (
              <Text style={[styles.errorText, { color: palette.danger }]}>{fieldErrors.bio}</Text>
            ) : null}
          </Field>

          <Field label="Date of birth">
            <DatePickerField
              value={dateOfBirth}
              error={fieldErrors.dateOfBirth ?? null}
              onChangeText={(value) => {
                clearFieldError("dateOfBirth");
                setDateOfBirth(value);
              }}
            />
          </Field>

          <Field label="Gender">
            <View style={styles.optionRow}>
              {genderOptions.map((option) => {
                const active = gender === option;
                return (
                  <Pressable
                    key={option}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: active ? palette.primary : palette.surfaceMuted,
                        borderColor: active ? palette.primary : palette.border,
                      },
                    ]}
                    onPress={() => {
                      clearValidationError();
                      setGender(option);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: active ? palette.textInverse : palette.textPrimary,
                        },
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Field label="User type">
            <View style={styles.optionRow}>
              {userTypeOptions.map((option) => {
                const active = userType === option;
                return (
                  <Pressable
                    key={option}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: active ? palette.accent : palette.surfaceMuted,
                        borderColor: active ? palette.accent : palette.border,
                      },
                    ]}
                    onPress={() => {
                      clearValidationError();
                      setUserType(option);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: active ? palette.textInverse : palette.textPrimary,
                        },
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          {validationError ? (
            <Text style={[styles.errorText, { color: palette.danger }]}>{validationError}</Text>
          ) : null}

          <Row gap="sm" style={styles.actions}>
            {onCancel ? (
              <Pressable
                style={[
                  styles.button,
                  {
                    backgroundColor: palette.surfaceMuted,
                    borderColor: palette.border,
                  },
                ]}
                onPress={onCancel}
              >
                <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>
                  Cancel
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              style={[
                styles.button,
                {
                  backgroundColor: palette.primary,
                  borderColor: palette.primary,
                },
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={palette.textInverse} />
              ) : (
                <Text style={[styles.primaryButtonText, { color: palette.textInverse }]}>
                  Save changes
                </Text>
              )}
            </Pressable>
          </Row>
        </ScrollView>
      </Stack>
    </Card>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => {
  const { palette } = useThemeContext();

  return (
    <Stack gap="xs">
      <Text style={[styles.label, { color: palette.textSecondary }]}>{label}</Text>
      {children}
    </Stack>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  content: {
    gap: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  input: {
    minHeight: 52,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSize.sm,
  },
  textArea: {
    minHeight: 110,
    paddingTop: theme.spacing.sm,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  optionChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.radius.fill,
    borderWidth: 1,
  },
  optionText: {
    fontSize: theme.typography.fontSize.xs + 1,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  actions: {
    marginTop: theme.spacing.xxs,
  },
  button: {
    flex: 1,
    minHeight: 50,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  primaryButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  secondaryButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
  },
});
