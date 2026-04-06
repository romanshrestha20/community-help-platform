import { AvatarUploadInput } from "../types/user.types";

export const buildAvatarFormData = (file: AvatarUploadInput): FormData => {
  const formData = new FormData();

  formData.append("avatar", {
    uri: file.uri,
    name: file.name ?? `avatar-${Date.now()}.jpg`,
    type: file.type ?? "image/jpeg",
  } as any);

  return formData;
};