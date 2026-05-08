import React from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { radius, spacing, typography } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useUser } from "../hooks/user.hook";
import { showInfoToast, showSuccessToast } from "@/utils/toast";
import { optimizePickedImage } from "@/utils/imageUpload";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export const ProfileAvatarPickerModal = ({ visible, onClose }: Props) => {
  const { palette } = useThemeContext();
  const { user, loading, handleUploadAvatar, handleDeleteAvatar } = useUser();

  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showInfoToast("Permission required", "Please allow access to your photo library.");
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

      const success = await handleUploadAvatar(optimized);

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error("Pick avatar error:", error);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const success = await handleDeleteAvatar();

      if (success) {
        showSuccessToast("Photo removed");
        onClose();
      }
    } catch (error) {
      console.error("Remove avatar error:", error);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: palette.surface,
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
              },
            ]}
            onPress={handlePickFromGallery}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={palette.textPrimary} />
            ) : (
              <Text style={[styles.actionText, { color: palette.textPrimary }]}>
                {user?.avatarUrl ? "Change from gallery" : "Upload from gallery"}
              </Text>
            )}
          </Pressable>

          {user?.avatarUrl ? (
            <Pressable
              style={[
                styles.actionButton,
                {
                  backgroundColor: palette.dangerSoft,
                },
              ]}
              onPress={handleRemoveAvatar}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={palette.danger} />
              ) : (
                <Text style={[styles.actionText, { color: palette.danger }]}>
                  Remove current photo
                </Text>
              )}
            </Pressable>
          ) : null}

          <Pressable style={styles.cancelButton} onPress={onClose} disabled={loading}>
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
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  actionButton: {
    minHeight: 52,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  actionText: {
    fontSize: 15,
    fontWeight: typography.fontWeight.semibold,
  },
  cancelButton: {
    marginTop: spacing.xxs,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: typography.fontWeight.semibold,
  },
});
