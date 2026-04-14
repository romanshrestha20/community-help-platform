import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

export type PreviewImageItem = {
  uri: string;
  label?: string;
};

type Props = {
  visible: boolean;
  images: PreviewImageItem[];
  initialIndex?: number;
  title?: string;
  onClose: () => void;
};

export const ImagePreviewModal = ({
  visible,
  images,
  initialIndex = 0,
  title = "Image preview",
  onClose,
}: Props) => {
  const { palette } = useThemeContext();
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (!visible) return;
    setActiveIndex(initialIndex);
  }, [initialIndex, visible]);

  const safeIndex = useMemo(() => {
    if (!images.length) return 0;
    return Math.min(Math.max(activeIndex, 0), images.length - 1);
  }, [activeIndex, images.length]);

  const activeImage = images[safeIndex];

  const handlePrevious = () => {
    if (safeIndex <= 0) return;
    setActiveIndex((current) => current - 1);
  };

  const handleNext = () => {
    if (safeIndex >= images.length - 1) return;
    setActiveIndex((current) => current + 1);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === "android"}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea} edges={["top", "right", "bottom", "left"]}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>{title}</Text>
              {images.length > 1 ? (
                <Text style={styles.headerMeta}>
                  {safeIndex + 1} / {images.length}
                </Text>
              ) : null}
            </View>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close image preview"
              style={[styles.iconButton, { backgroundColor: "rgba(255,255,255,0.12)" }]}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.content}>
            {activeImage ? (
              <>
                <Image
                  source={{ uri: activeImage.uri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />

                {activeImage.label ? (
                  <View
                    style={[
                      styles.imageLabel,
                      { backgroundColor: "rgba(255,255,255,0.12)" },
                    ]}
                  >
                    <Text style={styles.imageLabelText}>{activeImage.label}</Text>
                  </View>
                ) : null}
              </>
            ) : null}

            {images.length > 1 ? (
              <>
                <Pressable
                  onPress={handlePrevious}
                  disabled={safeIndex === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Previous image"
                  style={[
                    styles.navButton,
                    styles.navButtonLeft,
                    safeIndex === 0 && styles.navButtonDisabled,
                  ]}
                >
                  <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                </Pressable>

                <Pressable
                  onPress={handleNext}
                  disabled={safeIndex === images.length - 1}
                  accessibilityRole="button"
                  accessibilityLabel="Next image"
                  style={[
                    styles.navButton,
                    styles.navButtonRight,
                    safeIndex === images.length - 1 && styles.navButtonDisabled,
                  ]}
                >
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </Pressable>
              </>
            ) : null}
          </View>

          {images.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailRow}
            >
              {images.map((image, index) => {
                const isActive = index === safeIndex;

                return (
                  <Pressable
                    key={`${image.uri}-${index}`}
                    onPress={() => setActiveIndex(index)}
                    style={[
                      styles.thumbnailButton,
                      {
                        borderColor: isActive ? palette.primary : "rgba(255,255,255,0.18)",
                        backgroundColor: "rgba(255,255,255,0.06)",
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: image.uri }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  headerMeta: {
    color: "rgba(255,255,255,0.72)",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.fill,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    maxHeight: 520,
  },
  imageLabel: {
    position: "absolute",
    left: theme.spacing.lg,
    bottom: theme.spacing.lg,
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  imageLabelText: {
    color: "#FFFFFF",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  navButton: {
    position: "absolute",
    top: "50%",
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: theme.radius.fill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  navButtonLeft: {
    left: theme.spacing.md,
  },
  navButtonRight: {
    right: theme.spacing.md,
  },
  navButtonDisabled: {
    opacity: 0.35,
  },
  thumbnailRow: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  thumbnailButton: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    overflow: "hidden",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
});

export default ImagePreviewModal;
