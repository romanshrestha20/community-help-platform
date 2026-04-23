// src/design-system/tokens/colors.ts

export const lightColors = {
  // ─── Backgrounds ───────────────────────────────────────────────────────────
  background: "#FAFAF8",          // --page: warm off-white page base
  surface: "#FFFFFF",             // --card: pure white card surface
  surfaceSecondary: "#F4F3EF",    // --lift: subtle elevated surface
  surfaceMuted: "#ECEAE4",        // --groove: muted/disabled surface

  // ─── Text ──────────────────────────────────────────────────────────────────
  textPrimary: "#0F0E0C",         // --ink: near-black, warm undertone
  textSecondary: "#4A4845",       // --ink2: body / secondary text
  textMuted: "#9A9894",           // --ink3: placeholders, captions, hints
  textInverse: "#FFFFFF",         // text on dark/brand backgrounds

  // ─── Borders ───────────────────────────────────────────────────────────────
  border: "rgba(15, 14, 12, 0.08)",       // --line: default hairline border
  borderStrong: "rgba(15, 14, 12, 0.16)", // --line stronger: hover/focus rings

  // ─── Brand – Forest Green ──────────────────────────────────────────────────
  primary: "#2B6651",             // --sage: core brand green
  primaryPressed: "#245847",      // pressed/active state — slightly darker
  primaryLight: "#E4F0EB",        // --sage-l: tinted background / chips
  primaryMid: "#3D8B6E",          // --sage-m: avatars, mid-tone fills
  primaryDark: "#174032",         // --sage-d: text on sage-l, hero bg

  // ─── Secondary – Amber ─────────────────────────────────────────────────────
  secondary: "#C17E1A",           // --gold: bids, assigned state, warnings
  secondaryPressed: "#A86C14",
  secondaryLight: "#FBF0DC",      // --gold-l: amber tinted surfaces

  // ─── Accent – Rust ─────────────────────────────────────────────────────────
  accent: "#C4472A",              // --rust: destructive, unread dots, danger
  accentPressed: "#A83A20",
  accentLight: "#FAEAE6",         // --rust-l: destructive soft backgrounds

  // ─── Iris – Completed/Info state ───────────────────────────────────────────
  info: "#4A47A3",                // --iris: completed status, info actions
  infoLight: "#EEEDF9",           // --iris-l: info tinted surface

  // ─── Pine – Garden / category ──────────────────────────────────────────────
  pine: "#2D5A3D",
  pineLight: "#E6F0E9",

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
  star: "#D4860A",                // star fill — warmer than amber brand

  // ─── Utility ───────────────────────────────────────────────────────────────
  overlay: "rgba(15, 14, 12, 0.50)",   // modal scrim
  shadow: "rgba(15, 14, 12, 0.08)",    // card shadow (if used)
  scrim: "rgba(15, 14, 12, 0.08)",     // hover states, pressed overlays
};

export const darkColors: typeof lightColors = {
  // ─── Backgrounds ───────────────────────────────────────────────────────────
  background: "#111210",          // deep warm-black page
  surface: "#1C1E1C",             // card surface
  surfaceSecondary: "#242724",    // lifted surface
  surfaceMuted: "#2C302C",        // muted/disabled

  // ─── Text ──────────────────────────────────────────────────────────────────
  textPrimary: "#F0EDE8",         // warm white — mirrors --ink inverted
  textSecondary: "#A8A4A0",       // muted body text
  textMuted: "#6A6764",           // captions, hints
  textInverse: "#0F0E0C",         // text on light/brand-light surfaces

  // ─── Borders ───────────────────────────────────────────────────────────────
  border: "rgba(240, 237, 232, 0.08)",
  borderStrong: "rgba(240, 237, 232, 0.16)",

  // ─── Brand – Forest Green ──────────────────────────────────────────────────
  primary: "#3D8B6E",             // lightened for dark bg contrast
  primaryPressed: "#339060",
  primaryLight: "#183326",        // dark tinted green surface
  primaryMid: "#2B6651",          // mid stays as base
  primaryDark: "#A8D4C2",         // text on primaryLight in dark mode

  // ─── Secondary – Amber ─────────────────────────────────────────────────────
  secondary: "#E09A30",           // brightened amber
  secondaryPressed: "#C88420",
  secondaryLight: "#3A2A0E",      // dark amber tinted surface

  // ─── Accent – Rust ─────────────────────────────────────────────────────────
  accent: "#E06040",              // brightened rust
  accentPressed: "#C84E30",
  accentLight: "#3A1A10",         // dark rust surface

  // ─── Iris ──────────────────────────────────────────────────────────────────
  info: "#7F77DD",                // lighter iris for dark bg
  infoLight: "#1E1C3A",           // dark iris surface

  // ─── Pine ──────────────────────────────────────────────────────────────────
  pine: "#4A8A5A",
  pineLight: "#162418",

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
  star: "#E8A020",

  // ─── Utility ───────────────────────────────────────────────────────────────
  overlay: "rgba(0, 0, 0, 0.60)",
  shadow: "rgba(0, 0, 0, 0.30)",
  scrim: "rgba(0, 0, 0, 0.20)",
};

// Backward-compatible export for modules importing { colors } directly.
export const colors = lightColors;

export type ColorPalette = typeof lightColors;
export type ColorToken = keyof typeof lightColors;