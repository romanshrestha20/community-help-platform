import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

const THUMB_SIZE = 64;
const THUMB_GAP = theme.spacing.sm;
const THUMB_SIDE_PADDING = theme.spacing.lg;

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
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const imagePagerRef = useRef<ScrollView | null>(null);
  const thumbnailScrollRef = useRef<ScrollView | null>(null);

  const safeIndex = useMemo(() => {
    if (!images.length) return 0;
    return Math.min(Math.max(activeIndex, 0), images.length - 1);
  }, [activeIndex, images.length]);

  useEffect(() => {
    if (!visible) return;
    setActiveIndex(initialIndex);
  }, [initialIndex, visible]);

  useEffect(() => {
    if (!visible) return;
    requestAnimationFrame(() => {
      imagePagerRef.current?.scrollTo({
        x: viewportWidth * safeIndex,
        y: 0,
        animated: false,
      });
    });
  }, [visible, safeIndex, viewportWidth]);

  useEffect(() => {
    if (!visible || images.length <= 1) return;

    const centerOffset =
      safeIndex * (THUMB_SIZE + THUMB_GAP) - viewportWidth / 2 + THUMB_SIZE / 2 + THUMB_SIDE_PADDING;

    thumbnailScrollRef.current?.scrollTo({
      x: Math.max(0, centerOffset),
      animated: true,
    });
  }, [safeIndex, viewportWidth, visible, images.length]);

  const handleImageScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / viewportWidth);
    setActiveIndex(Math.max(0, Math.min(next, images.length - 1)));
  };

  const Header = ({ imageIndex }: { imageIndex: number }) => (
    <SafeAreaView edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>{title}</Text>
          {images.length > 1 ? (
            <Text style={styles.headerMeta}>
              {imageIndex + 1} / {images.length}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close image preview"
          style={styles.iconButton}
        >
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );

  const Footer = ({ imageIndex }: { imageIndex: number }) => {
    const activeImage = images[imageIndex];

    return (
      <SafeAreaView edges={["bottom", "left", "right"]}>
        <View style={styles.footerWrap}>
          {activeImage?.label ? (
            <View style={styles.labelWrap}>
              <Text style={styles.labelText}>{activeImage.label}</Text>
            </View>
          ) : null}

          {images.length > 1 ? (
            <ScrollView
              ref={thumbnailScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailRow}
            >
              {images.map((image, index) => {
                const isActive = index === imageIndex;

                return (
                  <Pressable
                    key={`${image.uri}-${index}`}
                    onPress={() => {
                      setActiveIndex(index);
                      imagePagerRef.current?.scrollTo({
                        x: viewportWidth * index,
                        y: 0,
                        animated: true,
                      });
                    }}
                    style={[
                      styles.thumbnailButton,
                      {
                        borderColor: isActive ? palette.primary : "rgba(255,255,255,0.2)",
                        backgroundColor: "rgba(255,255,255,0.08)",
                      },
                    ]}
                  >
                    <Image source={{ uri: image.uri }} style={styles.thumbnailImage} resizeMode="cover" />
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </View>
      </SafeAreaView>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
          <Header imageIndex={safeIndex} />

          <View style={styles.viewerContent}>
            <ScrollView
              ref={imagePagerRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleImageScrollEnd}
              contentOffset={{ x: viewportWidth * safeIndex, y: 0 }}
            >
              {images.map((image, index) => (
                <View
                  key={`${image.uri}-${index}`}
                  style={[styles.slide, { width: viewportWidth, height: viewportHeight * 0.68 }]}
                >
                  <Image source={{ uri: image.uri }} style={styles.slideImage} resizeMode="contain" />
                </View>
              ))}
            </ScrollView>
          </View>

          <Footer imageIndex={safeIndex} />
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
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
    width: 42,
    height: 42,
    borderRadius: theme.radius.fill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  viewerContent: {
    flex: 1,
    justifyContent: "center",
  },
  slide: {
    alignItems: "center",
    justifyContent: "center",
  },
  slideImage: {
    width: "100%",
    height: "100%",
  },
  footerWrap: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  labelWrap: {
    alignSelf: "flex-start",
    marginLeft: theme.spacing.lg,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  labelText: {
    color: "#FFFFFF",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  thumbnailRow: {
    gap: THUMB_GAP,
    paddingHorizontal: THUMB_SIDE_PADDING,
    paddingTop: theme.spacing.xxs,
  },
  thumbnailButton: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
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
