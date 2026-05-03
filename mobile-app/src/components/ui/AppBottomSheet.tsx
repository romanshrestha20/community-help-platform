import React, { useEffect, useMemo, useRef } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type AppBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: Array<string | number>;
  initialSnapIndex?: number;
  detached?: boolean;
  bottomInset?: number;
  enablePanDownToClose?: boolean;
  style?: StyleProp<ViewStyle>;
  backgroundStyle?: StyleProp<ViewStyle>;
  handleIndicatorStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export const AppBottomSheet = ({
  visible,
  onClose,
  children,
  snapPoints = ["50%"],
  initialSnapIndex = 0,
  detached = true,
  bottomInset = 0,
  enablePanDownToClose = true,
  style,
  backgroundStyle,
  handleIndicatorStyle,
  contentContainerStyle,
}: AppBottomSheetProps) => {
  const { palette } = useThemeContext();
  const sheetRef = useRef<BottomSheet | null>(null);
  const normalizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.snapToIndex(initialSnapIndex);
      return;
    }
    sheetRef.current?.close();
  }, [initialSnapIndex, visible]);

  if (!visible) {
    return null;
  }

  return (
    <BottomSheet
      ref={sheetRef}
      index={initialSnapIndex}
      snapPoints={normalizedSnapPoints}
      detached={detached}
      bottomInset={bottomInset}
      enablePanDownToClose={enablePanDownToClose}
      onClose={onClose}
      style={[styles.sheet, style]}
      backgroundStyle={[
        styles.background,
        {
          backgroundColor: palette.surface,
          borderColor: palette.borderStrong,
        },
        backgroundStyle,
      ]}
      handleIndicatorStyle={[
        styles.handle,
        { backgroundColor: palette.borderStrong },
        handleIndicatorStyle,
      ]}
    >
      <BottomSheetView style={contentContainerStyle}>{children}</BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheet: {
    marginHorizontal: theme.spacing.sm,
  },
  background: {
    borderWidth: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: theme.radius.fill,
  },
});

