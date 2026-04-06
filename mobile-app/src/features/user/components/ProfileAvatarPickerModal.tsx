import React from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { radius, spacing, typography } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useUser } from "../hooks/user.hook";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export const ProfileAvatarPickerModal = ({ visible, onClose }: Props) => {
  const { palette } = useThemeContext();
  const { user, loading, handleUploadAvatar, handleDeleteAvatar } = useUser();

  const handlePickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];

    const success = await handleUploadAvatar({
      uri: asset.uri,
      name: asset.fileName ?? `avatar-${Date.now()}.jpg`,
      type: asset.mimeType ?? "image/jpeg",
    });

    if (success) onClose();
  };

  const handleRemoveAvatar = async () => {
    Alert.alert("Remove profile photo", "Do you want to remove your current photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const success = await handleDeleteAvatar();
          if (success) onClose();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={[styles.title, { color: palette.textPrimary }]}>Profile photo</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            Choose how you want to update your profile picture.
          </Text>

          <Pressable
            style={[
              styles.actionButton,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
              },
            ]}
            onPress={handlePickFromGallery}
            disabled={loading}
          >
            <Text style={[styles.actionText, { color: palette.textPrimary }]}>
              {user?.avatarUrl ? "Change from gallery" : "Upload from gallery"}
            </Text>
          </Pressable>

          {user?.avatarUrl ? (
            <Pressable
              style={[
                styles.actionButton,
                {
                  backgroundColor: palette.dangerSoft,
                  borderColor: palette.border,
                },
              ]}
              onPress={handleRemoveAvatar}
              disabled={loading}
            >
              <Text style={[styles.actionText, { color: palette.danger }]}>
                Remove current photo
              </Text>
            </Pressable>
          ) : null}

          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={[styles.cancelText, { color: palette.textSecondary }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    marginBottom: spacing.xs,
  },
  actionButton: {
    minHeight: 52,
    borderRadius: radius.lg,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderWidth: 1,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  cancelButton: {
    marginTop: spacing.xs,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});