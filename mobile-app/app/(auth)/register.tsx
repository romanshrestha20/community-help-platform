import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useAuth } from "@/features/auth/hooks/auth.hook";
import { Card, Stack, theme } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { FormContainer } from "@/components/ui/FormContainer";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";
import LocationPickerField from "@/features/location/components/LocationPickerField";
import { LocationSuggestion } from "@/features/location/types/location.types";
import { validateRegisterFormFields } from "@/features/auth/utils/authValidation";
import { useFormValidation } from "@/utils/validation/useFormValidation";

type Gender = "MALE" | "FEMALE" | "OTHER";

const genderOptions: Gender[] = ["MALE", "FEMALE", "OTHER"];

export default function RegisterScreen() {
  const router = useRouter();
  const { handleRegister, loadingRegister, error } = useAuth();
  const { palette } = useThemeContext();

  const locationPicker = useLocationPicker({
    autoUseCurrentLocationOnMount: true,
  });

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<Gender>("MALE");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const {
    validationError,
    setValidationError,
    fieldErrors,
    setFieldErrors,
    clearFieldError,
    clearValidationError,
  } = useFormValidation<
    "fullName" | "email" | "phone" | "password" | "dateOfBirth" | "location"
  >();

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    locationPicker.selectSuggestion(suggestion);
  };

  const onRegister = async () => {
    const validation = validateRegisterFormFields({
      fullName,
      email,
      phone,
      password,
      dateOfBirth,
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

    clearValidationError();

    const result = await handleRegister({
      email,
      phone,
      password,
      fullName,
      gender,
      dateOfBirth,
      location,
    });

    if (result?.success) {
      // redirect handled elsewhere
    }
  };

  const displayError = validationError || error;

  return (
    <FormContainer contentContainerStyle={styles.container}>
      <Stack gap="lg">
        <View style={styles.header}>
          <View
            style={[
              styles.headerIcon,
              {
                backgroundColor: palette.primarySoft ?? palette.surface,
              },
            ]}
          >
            <Ionicons name="person-add-outline" size={24} color={palette.primary} />
          </View>

          <Stack gap="xs">
            <Text style={[styles.title, { color: palette.textPrimary }]}>
              Create account
            </Text>
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
              Join the community and start requesting or offering help.
            </Text>
          </Stack>
        </View>

        <Card style={[styles.card, { backgroundColor: palette.surface }]}>
          <Stack gap="lg">
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                Account details
              </Text>

              <Stack gap="md">
                <AppInput
                  label="Full name"
                  placeholder="Your full name"
                  value={fullName}
                  error={fieldErrors.fullName ?? null}
                  onChangeText={(value) => {
                    clearFieldError("fullName");
                    setFullName(value);
                  }}
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  importantForAutofill="no"
                />

                <AppInput
                  label="Email"
                  placeholder="name@example.com"
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

                <AppInput
                  label="Phone"
                  placeholder="Phone number"
                  value={phone}
                  error={fieldErrors.phone ?? null}
                  onChangeText={(value) => {
                    clearFieldError("phone");
                    setPhone(value);
                  }}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                />

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
              </Stack>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                Personal information
              </Text>

              <Stack gap="md">
                <AppInput
                  label="Date of birth"
                  placeholder="YYYY-MM-DD"
                  value={dateOfBirth}
                  error={fieldErrors.dateOfBirth ?? null}
                  onChangeText={(value) => {
                    clearFieldError("dateOfBirth");
                    setDateOfBirth(value);
                  }}
                />

                <View style={styles.genderSection}>
                  <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>
                    Gender
                  </Text>

                  <View style={styles.genderRow}>
                    {genderOptions.map((option) => {
                      const selected = gender === option;

                      return (
                        <Pressable
                          key={option}
                          onPress={() => {
                            setGender(option);
                          }}
                          style={({ pressed }) => [
                            styles.genderChip,
                            {
                              backgroundColor: selected
                                ? palette.primary
                                : palette.background,
                              borderColor: selected
                                ? palette.primary
                                : palette.border,
                              opacity: pressed ? 0.9 : 1,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.genderChipText,
                              {
                                color: selected
                                  ? palette.textInverse
                                  : palette.textPrimary,
                              },
                            ]}
                          >
                            {option.charAt(0) + option.slice(1).toLowerCase()}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </Stack>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                Location
              </Text>

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
                  await handleSelectSuggestion(suggestion);
                }}
              />
            </View>

            {displayError ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: palette.dangerSoft ?? palette.surface,
                    borderColor: palette.danger,
                  },
                ]}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color={palette.danger}
                />
                <Text style={[styles.errorText, { color: palette.danger }]}>
                  {displayError}
                </Text>
              </View>
            ) : null}


            <Stack gap="sm">
              <AppButton
                title={loadingRegister ? "Creating account..." : "Create account"}
                onPress={onRegister}
                loading={loadingRegister}
                disabled={loadingRegister}
              />

              <Text
                style={[styles.footerText, { color: palette.textSecondary }]}
              >
                Already have an account?{" "}
                <Text
                  style={[styles.footerLink, { color: palette.primary }]}
                  onPress={() => router.push("/(auth)/login")}
                >
                  Sign in
                </Text>
              </Text>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </FormContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    gap: theme.spacing.md,
    alignItems: "center",
    paddingTop: theme.spacing.md,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
  },
  subtitle: {
    textAlign: "center",
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 22,
  },
  card: {
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  genderSection: {
    gap: theme.spacing.sm,
  },
  genderRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  genderChip: {
    flex: 1,
    minHeight: 46,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.sm,
  },
  genderChipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
  },
  footerText: {
    textAlign: "center",
    fontSize: theme.typography.fontSize.sm,
  },
  footerLink: {
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
