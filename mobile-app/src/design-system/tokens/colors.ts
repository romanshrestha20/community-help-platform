export const colors = {
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
} as const;

export type ColorToken = keyof typeof colors;
