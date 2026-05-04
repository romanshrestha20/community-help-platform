import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useOverlayStore } from "@/features/ui/store/overlay.store";
import { AppHeader } from "@/components/ui/AppHeader";

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
  const insets = useSafeAreaInsets();
  const setImagePreviewVisible = useOverlayStore((state) => state.setImagePreviewVisible);
  const { width: viewportWidth } = useWindowDimensions();
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

  useEffect(() => {
    setImagePreviewVisible(visible);
    return () => {
      setImagePreviewVisible(false);
    };
  }, [setImagePreviewVisible, visible]);

  const handleImageScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / viewportWidth);
    setActiveIndex(Math.max(0, Math.min(next, images.length - 1)));
  };

  const Header = ({ imageIndex }: { imageIndex: number }) => (
      <View style={[styles.header, { paddingTop: Math.max(insets.top, theme.spacing.md) }]}>
        <AppHeader
          title={title}
          subtitle={images.length > 1 ? `${imageIndex + 1} / ${images.length}` : undefined}
          variant="compact"
          divider={false}
          titleColor="#FFFFFF"
          subtitleColor="rgba(255,255,255,0.8)"
          rightAction={{
            icon: "close",
            onPress: onClose,
            accessibilityLabel: "Close image preview",
            color: "#FFFFFF",
          }}
        />
      </View>
  );

  const Footer = ({ imageIndex }: { imageIndex: number }) => {
    const activeImage = images[imageIndex];

    return (
        <View style={[styles.footerWrap, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
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
                    <Image source={{ uri: image.uri }} style={styles.thumbnailImage}  />
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      hardwareAccelerated
      onRequestClose={onClose}
    >
      <StatusBar style="light" />
      <View style={styles.overlay}>
          <Header imageIndex={safeIndex} />

          <View style={styles.viewerContent}>
            <ScrollView
              ref={imagePagerRef}
              style={styles.pager}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleImageScrollEnd}
              contentOffset={{ x: viewportWidth * safeIndex, y: 0 }}
            >
              {images.map((image, index) => (
                <View
                  key={`${image.uri}-${index}`}
                  style={[styles.slide, { width: viewportWidth, height: "100%" }]}
                >
                  <Image source={{ uri: image.uri }} style={styles.slideImage} resizeMode="contain" />
                </View>
              ))}
            </ScrollView>
          </View>

          <Footer imageIndex={safeIndex} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
    zIndex: 3,
    elevation: 3,
  },
  viewerContent: {
    flex: 1,
    zIndex: 1,
  },
  pager: {
    flex: 1,
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
    zIndex: 3,
    elevation: 3,
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
