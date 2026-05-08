import React, { useMemo, useState } from "react";
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import type { HelpRequestImage } from "../types/helpRequest.types";
import { getCloudinaryVariantUrl } from "@/utils/cloudinaryImage";

type Props = {
  images: HelpRequestImage[];
  height?: number;
  onPressImage?: (index: number) => void;
};

export const RequestPhotoCarousel = ({
  images,
  height = 170,
  onPressImage,
}: Props) => {
  const { palette } = useThemeContext();
  const [activeIndex, setActiveIndex] = useState(0);
  const [width, setWidth] = useState(0);

  const usableImages = useMemo(
    () => images.filter((image) => Boolean(image?.url)),
    [images]
  );

  if (!usableImages.length) return null;

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(Math.max(0, Math.min(nextIndex, usableImages.length - 1)));
  };

  return (
    <View
      style={styles.wrap}
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        if (nextWidth && nextWidth !== width) {
          setWidth(nextWidth);
        }
      }}
    >
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
      >
        {usableImages.map((image, index) => (
          <Pressable
            key={image.id || `${image.url}-${index}`}
            onPress={(event) => {
              event.stopPropagation();
              onPressImage?.(index);
            }}
            style={[
              styles.slide,
              { width: width || 1, height },
            ]}
          >
            <Image
              source={{ uri: getCloudinaryVariantUrl(image.url, "thumbnail") }}
              style={[
                styles.image,
                { backgroundColor: palette.surfaceMuted },
              ]}
              resizeMode="cover"
            />
          </Pressable>
        ))}
      </ScrollView>

      {usableImages.length > 1 ? (
        <View style={styles.pagination}>
          {usableImages.map((image, index) => {
            const active = index === activeIndex;
            return (
              <View
                key={`${image.id || image.url}-dot`}
                style={[
                  styles.dot,
                  {
                    backgroundColor: active
                      ? "rgba(255,255,255,0.95)"
                      : "rgba(255,255,255,0.42)",
                  },
                ]}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  slide: {
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  pagination: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: theme.radius.fill,
  },
});
