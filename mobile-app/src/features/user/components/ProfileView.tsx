import React from "react";
import { Stack } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { ProfileInfoRow } from "@/features/user/profile/components/ProfileInfoRow";

type Props = {
  form: any;
  onEdit: () => void;
  loading: boolean;
};

export const ProfileView = ({ form, onEdit, loading }: Props) => (
  <Stack>
    <ProfileInfoRow label="Full Name" value={form.fullName} />
    <ProfileInfoRow label="Bio" value={form.bio} />
    <ProfileInfoRow label="Date of Birth" value={form.dateOfBirth} />
    <ProfileInfoRow label="Gender" value={form.gender} />
    <ProfileInfoRow label="User Type" value={form.userType} />
    <AppButton title="Edit Profile" onPress={onEdit} disabled={loading} />
  </Stack>
);