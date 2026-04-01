export const lightColors = {
  background: "#f6f8f4",          // softer, less yellow
  surface: "#ffffff",
  surfaceMuted: "#eef3e8",

  textPrimary: "#1e2a1e",
  textSecondary: "#5f6f5f",
  textInverse: "#ffffff",

  border: "#d8e0d2",
  borderStrong: "#a9b8a3",

  primary: "#6aa84f",             // friendlier green (less harsh)
  primaryPressed: "#5a9442",

  accent: "#2a9d8f",              // NEW → empathy / trust (teal)

  danger: "#d64545",              // softened red
  dangerSoft: "#fdecec",

  success: "#4caf50",
  warning: "#f4a261",             // warmer, less aggressive orange
};

export const darkColors = {
  background: "#181a18",          // slightly warmer than pure gray
  surface: "#242724",
  surfaceMuted: "#2f332f",

  textPrimary: "#f1f5f1",
  textSecondary: "#a6b3a6",
  textInverse: "#1a1a1a",

  border: "#3c423c",
  borderStrong: "#5c665c",

  primary: "#7cb342",             // keep your green identity
  primaryPressed: "#689f38",

  accent: "#4db6ac",              // teal pops nicely in dark mode

  danger: "#ef5350",
  dangerSoft: "#3a1f1f",

  success: "#66bb6a",
  warning: "#ffb74d",
};

export const colors = lightColors;

export type ColorToken = keyof typeof colors;
