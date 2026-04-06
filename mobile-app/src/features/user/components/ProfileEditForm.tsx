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

import { radius, spacing, typography } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { Gender, UpdateUserProfilePayload, User, UserType } from "../types/user.types";

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

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [userType, setUserType] = useState<UserType>(UserType.GENERAL);

  useEffect(() => {
    setFullName(user?.fullName ?? "");
    setBio(user?.bio ?? "");
    setDateOfBirth(user?.dateOfBirth ?? "");
    setGender(user?.gender);
    setUserType(user?.userType ?? UserType.GENERAL);
  }, [user]);

  const handleSave = async () => {
    await onSubmit({
      fullName: fullName.trim(),
      bio: bio.trim(),
      dateOfBirth: dateOfBirth.trim() || undefined,
      gender,
      userType,
    });
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <Text style={[styles.title, { color: palette.textPrimary }]}>Edit profile</Text>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="Full name">
          <TextInput
            value={fullName}
            onChangeText={setFullName}
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
        </Field>

        <Field label="Bio">
          <TextInput
            value={bio}
            onChangeText={setBio}
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
        </Field>

        <Field label="Date of birth">
          <TextInput
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="YYYY-MM-DD"
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
                  onPress={() => setGender(option)}
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
                  onPress={() => setUserType(option)}
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

        <View style={styles.actions}>
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
        </View>
      </ScrollView>
    </View>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => {
  const { palette } = useThemeContext();

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: palette.textSecondary }]}>{label}</Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  content: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  input: {
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
  },
  textArea: {
    minHeight: 110,
    paddingTop: spacing.md - 2,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs + 2,
  },
  optionChip: {
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.fill,
    borderWidth: 1,
  },
  optionText: {
    fontSize: typography.fontSize.xs + 1,
    fontWeight: typography.fontWeight.semibold,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xxs,
  },
  button: {
    flex: 1,
    minHeight: 50,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  primaryButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});