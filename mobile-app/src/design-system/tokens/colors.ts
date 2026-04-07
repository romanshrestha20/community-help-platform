// src/design-system/tokens/colors.ts

export const lightColors = {
  // Backgrounds
  background: "#F6F8F4",
  surface: "#FFFFFF",
  surfaceSecondary: "#F7FAF5",
  surfaceMuted: "#EEF3E8",

  // Text
  textPrimary: "#1E2A1E",
  textSecondary: "#5F6F5F",
  textMuted: "#8A978A",
  textInverse: "#FFFFFF",

  // Borders
  border: "#D8E0D2",
  borderStrong: "#A9B8A3",

  // Brand
  primary: "#6AA84F",
  primaryPressed: "#5A9442",
  secondary: "#2A9D8F",
  secondaryPressed: "#21867A",
  accent: "#F4A261",

  // Semantic
  success: "#4CAF50",
  warning: "#F4A261",
  danger: "#D64545",
  dangerSoft: "#FDECEC",
  error: "#D64545",

  // Soft UI states
  primarySoft: "rgba(106, 168, 79, 0.12)",
  secondarySoft: "rgba(42, 157, 143, 0.12)",
  accentSoft: "rgba(244, 162, 97, 0.14)",
  successSoft: "rgba(76, 175, 80, 0.12)",
  warningSoft: "rgba(244, 162, 97, 0.14)",
  dangerSoftFill: "rgba(214, 69, 69, 0.10)",

  // Utility
  overlay: "rgba(30, 42, 30, 0.08)",
  shadow: "rgba(30, 42, 30, 0.08)",
};

export const darkColors = {
  // Backgrounds
  background: "#181A18",
  surface: "#242724",
  surfaceSecondary: "#2A2E2A",
  surfaceMuted: "#2F332F",

  // Text
  textPrimary: "#F1F5F1",
  textSecondary: "#A6B3A6",
  textMuted: "#7F8B7F",
  textInverse: "#1A1A1A",

  // Borders
  border: "#3C423C",
  borderStrong: "#5C665C",

  // Brand
  primary: "#7CB342",
  primaryPressed: "#689F38",
  secondary: "#4DB6AC",
  secondaryPressed: "#3AA397",
  accent: "#FFB74D",

  // Semantic
  success: "#66BB6A",
  warning: "#FFB74D",
  danger: "#EF5350",
  dangerSoft: "#3A1F1F",
  error: "#EF5350",

  // Soft UI states
  primarySoft: "rgba(124, 179, 66, 0.18)",
  secondarySoft: "rgba(77, 182, 172, 0.18)",
  accentSoft: "rgba(255, 183, 77, 0.18)",
  successSoft: "rgba(102, 187, 106, 0.18)",
  warningSoft: "rgba(255, 183, 77, 0.18)",
  dangerSoftFill: "rgba(239, 83, 80, 0.16)",

  // Utility
  overlay: "rgba(0, 0, 0, 0.28)",
  shadow: "rgba(0, 0, 0, 0.24)",
};

// Backward-compatible export for modules importing { colors } directly.
export const colors = lightColors;

export type ColorPalette = typeof lightColors;
export type ColorToken = keyof typeof colors;