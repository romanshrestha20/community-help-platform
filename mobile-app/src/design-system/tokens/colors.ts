export const lightColors = {
  background: "#f7f7f2",
  surface: "#ffffff",
  surfaceMuted: "#f0f2eb",
  textPrimary: "#1f2a1f",
  textSecondary: "#526052",
  textInverse: "#ffffff",
  border: "#d6ddcf",
  borderStrong: "#a8b59b",
  primary: "#5c8001",
  primaryPressed: "#4c6a01",
  danger: "#c62828",
  dangerSoft: "#fdecea",
  success: "#2e7d32",
  warning: "#ef6c00",
};

export const darkColors = {
  background: "#1a1a1a",
  surface: "#2d2d2d",
  surfaceMuted: "#3d3d3d",
  textPrimary: "#ffffff",
  textSecondary: "#b0b0b0",
  textInverse: "#1a1a1a",
  border: "#4a4a4a",
  borderStrong: "#666666",
  primary: "#7cb342",
  primaryPressed: "#689f38",
  danger: "#ef5350",
  dangerSoft: "#ffebee",
  success: "#66bb6a",
  warning: "#ffa726",
};

export const colors = lightColors;

export type ColorToken = keyof typeof colors;
