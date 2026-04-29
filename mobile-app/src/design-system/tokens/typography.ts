// src/design-system/tokens/typography.ts

/**
 * Typography System — Neighbr
 *
 * Font Stack:
 * - Headings: Syne (weights 600, 700, 800)
 * - Body/UI: Inter (weights 300, 400, 500, 600)
 */

export const fontFamily = {
  heading: "Syne_700Bold",
  headingLight: "Syne_600SemiBold",
  headingHeavy: "Syne_800ExtraBold",
  body: "Inter_400Regular",
  bodyLight: "Inter_300Light",
  bodyMedium: "Inter_500Medium",
  bodySemibold: "Inter_600SemiBold",
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Syne_700Bold",
} as const;

export const fontSize = {
  "3xl": 32,
  "2xl": 28,
  xl: 24,
  lg: 18,
  md: 16,
  sm: 14,
  base: 15,
  xs: 13,
  "2xs": 12,
  "3xs": 11,
  "4xs": 10,
} as const;

export const lineHeight = {
  "3xl": 38,
  "2xl": 34,
  xl: 30,
  lg: 24,
  md: 22,
  sm: 20,
  base: 24,
  xs: 20,
  "2xs": 18,
  "3xs": 16,
  "4xs": 14,
} as const;

export const fontWeight = {
  light: "300" as const,
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
} as const;

export const letterSpacing = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
} as const;

export const textStyles = {
  displayLarge: {
    fontFamily: fontFamily.headingHeavy,
    fontSize: fontSize["3xl"],
    lineHeight: lineHeight["3xl"],
    letterSpacing: letterSpacing.tighter,
  },
  displayMedium: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize["2xl"],
    lineHeight: lineHeight["2xl"],
    letterSpacing: letterSpacing.tight,
  },
  displaySmall: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
    letterSpacing: letterSpacing.tight,
  },
  h1: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.normal,
  },
  h2: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.normal,
  },
  h3: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.normal,
  },
  bodyLarge: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    fontWeight: fontWeight.regular,
  },
  bodyMedium: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.regular,
  },
  bodySmall: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontWeight: fontWeight.regular,
  },
  bodyLargeBold: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    fontWeight: fontWeight.semibold,
  },
  bodyMediumBold: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.semibold,
  },
  bodySmallBold: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontWeight: fontWeight.semibold,
  },
  buttonLarge: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.normal,
  },
  buttonMedium: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.normal,
  },
  buttonSmall: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize["2xs"],
    lineHeight: lineHeight["2xs"],
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.normal,
  },
  label: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize["2xs"],
    lineHeight: lineHeight["2xs"],
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.normal,
  },
  labelUppercase: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: fontSize["3xs"],
    lineHeight: lineHeight["3xs"],
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.wide,
    textTransform: "uppercase" as const,
  },
  badge: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: fontSize["3xs"],
    lineHeight: lineHeight["3xs"],
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.normal,
  },
  caption: {
    fontFamily: fontFamily.body,
    fontSize: fontSize["2xs"],
    lineHeight: lineHeight["2xs"],
    fontWeight: fontWeight.regular,
  },
  captionBold: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize["2xs"],
    lineHeight: lineHeight["2xs"],
    fontWeight: fontWeight.medium,
  },
  overline: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: fontSize["4xs"],
    lineHeight: lineHeight["4xs"],
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.wider,
    textTransform: "uppercase" as const,
  },
  number: {
    fontFamily: fontFamily.headingHeavy,
    fontSize: fontSize["2xl"],
    lineHeight: lineHeight["2xl"],
    fontWeight: fontWeight.extrabold,
    letterSpacing: letterSpacing.tight,
  },
  price: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.normal,
  },
  input: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    fontWeight: fontWeight.regular,
  },
} as const;

export const typography = {
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing,
  textStyle: {
    caption: textStyles.caption,
    captionMedium: textStyles.captionBold,
    bodySmall: textStyles.bodySmall,
    bodySmallMedium: textStyles.bodySmallBold,
    body: textStyles.bodyLarge,
    bodyMedium: textStyles.bodyMedium,
    label: textStyles.label,
    labelStrong: textStyles.bodyMediumBold,
    title: textStyles.h1,
    heading: textStyles.displayMedium,
  },
} as const;

export type FontFamily = typeof fontFamily;
export type FontSize = typeof fontSize;
export type LineHeight = typeof lineHeight;
export type FontWeight = typeof fontWeight;
export type LetterSpacing = typeof letterSpacing;
export type TextStyle = keyof typeof textStyles;
export type TypographyToken = keyof typeof typography;
export type TextStyleToken = keyof typeof typography.textStyle;
