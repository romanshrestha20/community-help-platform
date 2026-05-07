import React from "react";
import { StyleSheet, View } from "react-native";

import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  topNav: React.ReactNode;
  sidebar: React.ReactNode;
  rightPanel?: React.ReactNode;
  children: React.ReactNode;
  rightPanelWidth?: number;
  mainPadding?: number;
};

export const WebAppShell = ({
  topNav,
  sidebar,
  rightPanel,
  children,
  rightPanelWidth = 400,
  mainPadding = 18,
}: Props) => {
  const { palette } = useThemeContext();

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      {topNav}
      <View style={styles.contentRow}>
        {sidebar}
        <View style={[styles.main, { padding: mainPadding }]}>{children}</View>
        {rightPanel ? (
          <View style={[styles.rightPanel, { borderColor: palette.border, width: rightPanelWidth }]}>
            {rightPanel}
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  contentRow: {
    flex: 1,
    flexDirection: "row",
    minHeight: 0,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  rightPanel: {
    borderLeftWidth: 1,
    padding: 14,
  },
});
