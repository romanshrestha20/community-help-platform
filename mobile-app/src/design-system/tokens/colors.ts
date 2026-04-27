// src/design-system/tokens/colors.ts

export const lightColors = {
  // ─── Backgrounds ───────────────────────────────────────────────────────────
  background: "#F6F5F0",          // warm paper base
  surface: "#FFFDFC",             // softened card surface
  surfaceSecondary: "#F1EEE6",    // lifted neutral surface
  surfaceMuted: "#E8E4D9",        // muted controls / chips

  // ─── Text ──────────────────────────────────────────────────────────────────
  textPrimary: "#161511",         // warm charcoal
  textSecondary: "#59554D",       // softened body text
  textMuted: "#8A857C",           // captions, placeholders
  textInverse: "#FFFFFF",         // text on dark/brand backgrounds

  // ─── Borders ───────────────────────────────────────────────────────────────
  border: "rgba(22, 21, 17, 0.10)",
  borderStrong: "rgba(22, 21, 17, 0.18)",

  // ─── Brand – Forest Green ──────────────────────────────────────────────────
  primary: "#2F6B58",
  primaryPressed: "#275747",
  primaryLight: "#DFECE5",
  primaryMid: "#4B8A72",
  primaryDark: "#1F4739",

  // ─── Secondary – Amber ─────────────────────────────────────────────────────
  secondary: "#B57A22",
  secondaryPressed: "#96631B",
  secondaryLight: "#F6E8D0",

  // ─── Accent – Rust ─────────────────────────────────────────────────────────
  accent: "#B95238",
  accentPressed: "#99432E",
  accentLight: "#F6E6E0",

  // ─── Iris – Completed/Info state ───────────────────────────────────────────
  info: "#546C9F",
  infoLight: "#E8EDF6",

  // ─── Pine – Garden / category ──────────────────────────────────────────────
  pine: "#3F6B4B",
  pineLight: "#E3ECE3",

  // ─── Semantic ──────────────────────────────────────────────────────────────
  success: "#2B6651",             // reuse brand green — success = done
  successSurface: "#E4F0EB",
  successSoft: "rgba(43, 102, 81, 0.10)",

  warning: "#C17E1A",             // reuse amber — warning = in-progress
  warningSurface: "#FBF0DC",
  warningSoft: "rgba(193, 126, 26, 0.12)",

  danger: "#C4472A",              // --rust
  dangerSurface: "#FAEAE6",
  dangerSoft: "#FAEAE6",          // kept for backward compat (card bg)
  dangerSoftFill: "rgba(196, 71, 42, 0.10)",

  error: "#C4472A",               // alias — same as danger

  infoSurface: "#EEEDF9",
  infoSoft: "rgba(74, 71, 163, 0.10)",

  // ─── Soft fills (icon backgrounds, tinted cards) ───────────────────────────
  primarySoft: "rgba(43, 102, 81, 0.10)",
  secondarySoft: "rgba(193, 126, 26, 0.12)",
  accentSoft: "rgba(196, 71, 42, 0.10)",

  // ─── Rating ────────────────────────────────────────────────────────────────
  star: "#CB8C24",

  // ─── Utility ───────────────────────────────────────────────────────────────
  overlay: "rgba(16, 16, 14, 0.42)",
  shadow: "rgba(18, 22, 18, 0.12)",
  scrim: "rgba(22, 21, 17, 0.08)",

  // ─── Trust / Verification ──────────────────────────────────────────────────
  trust: "#CBA258",
  trustPressed: "#A9843F",
  trustLight: "#F8EFD8",
  trustSoft: "rgba(203, 162, 88, 0.14)",
};

export const darkColors: typeof lightColors = {
  // ─── Backgrounds ───────────────────────────────────────────────────────────
  background: "#131614",
  surface: "#1A1F1C",
  surfaceSecondary: "#212823",
  surfaceMuted: "#283029",

  // ─── Text ──────────────────────────────────────────────────────────────────
  textPrimary: "#F2EEE6",
  textSecondary: "#B3ADA3",
  textMuted: "#7A746B",
  textInverse: "#0F0E0C",         // text on light/brand-light surfaces

  // ─── Borders ───────────────────────────────────────────────────────────────
  border: "rgba(240, 237, 232, 0.08)",
  borderStrong: "rgba(240, 237, 232, 0.16)",

  // ─── Brand – Forest Green ──────────────────────────────────────────────────
  primary: "#5F9F85",
  primaryPressed: "#4B8A72",
  primaryLight: "#183127",
  primaryMid: "#38715D",
  primaryDark: "#B9DDCF",

  // ─── Secondary – Amber ─────────────────────────────────────────────────────
  secondary: "#D29A44",
  secondaryPressed: "#B88333",
  secondaryLight: "#392A14",

  // ─── Accent – Rust ─────────────────────────────────────────────────────────
  accent: "#D6755C",
  accentPressed: "#B85E48",
  accentLight: "#371B16",

  // ─── Iris ──────────────────────────────────────────────────────────────────
  info: "#89A2D7",
  infoLight: "#1B2334",

  // ─── Pine ──────────────────────────────────────────────────────────────────
  pine: "#6D9A74",
  pineLight: "#18231A",

  // ─── Semantic ──────────────────────────────────────────────────────────────
  success: "#3D8B6E",
  successSurface: "#183326",
  successSoft: "rgba(61, 139, 110, 0.15)",

  warning: "#E09A30",
  warningSurface: "#3A2A0E",
  warningSoft: "rgba(224, 154, 48, 0.15)",

  danger: "#E06040",
  dangerSurface: "#3A1A10",
  dangerSoft: "#3A1A10",
  dangerSoftFill: "rgba(224, 96, 64, 0.15)",

  error: "#E06040",

  infoSurface: "#1E1C3A",
  infoSoft: "rgba(127, 119, 221, 0.15)",

  // ─── Soft fills ────────────────────────────────────────────────────────────
  primarySoft: "rgba(61, 139, 110, 0.15)",
  secondarySoft: "rgba(224, 154, 48, 0.15)",
  accentSoft: "rgba(224, 96, 64, 0.15)",

  // ─── Rating ────────────────────────────────────────────────────────────────
  star: "#DDA04D",

  // ─── Utility ───────────────────────────────────────────────────────────────
  overlay: "rgba(0, 0, 0, 0.58)",
  shadow: "rgba(0, 0, 0, 0.34)",
  scrim: "rgba(0, 0, 0, 0.22)",

  // ─── Trust / Verification ──────────────────────────────────────────────────
  trust: "#DDB76D",
  trustPressed: "#C79F52",
  trustLight: "#3A2D16",
  trustSoft: "rgba(221, 183, 109, 0.16)",
};

// Backward-compatible export for modules importing { colors } directly.
export const colors = lightColors;

export type ColorPalette = typeof lightColors;
export type ColorToken = keyof typeof lightColors;
