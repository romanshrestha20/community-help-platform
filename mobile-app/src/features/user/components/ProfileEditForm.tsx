import React from "react";
import { Stack } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { ProfileTextField } from "@/features/user/profile/components/ProfileTextField";
import { ProfileDateField } from "@/features/user/profile/components/ProfileDateField";
import { ProfilePickerField } from "@/features/user/profile/components/ProfilePickerField";
import { Gender, UserType } from "../types/user.types";


type Props = {
  formHook: any;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
};

export const ProfileEditForm = ({ formHook, onSave, onCancel, loading }: Props) => (
  <Stack>
    <ProfileTextField label="Full Name" value={formHook.form.fullName} onChangeText={formHook.setFullName} />
    <ProfileTextField label="Bio" value={formHook.form.bio} onChangeText={formHook.setBio} />
    <ProfileDateField value={formHook.form.dateOfBirth} showDatePicker={formHook.showDatePicker} onPress={() => formHook.setShowDatePicker(true)} onChange={formHook.handleDateChange} />
    <ProfilePickerField label="Gender" selectedValue={formHook.form.gender} options={Object.values(Gender)} onValueChange={formHook.setGender} />
    <ProfilePickerField label="User Type" selectedValue={formHook.form.userType} options={Object.values(UserType)} onValueChange={formHook.setUserType} />

    <AppButton title={loading ? "Updating..." : "Save Profile"} onPress={onSave} loading={loading} disabled={loading} />
    <AppButton title="Cancel" onPress={onCancel} disabled={loading} />
  </Stack>
);