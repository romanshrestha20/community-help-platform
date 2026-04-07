// src/design-system/tokens/typography.ts

export const typography = {
  fontFamily: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },

  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 28,
  },

  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 34,
  },

  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  letterSpacing: {
    tighter: -0.4,
    tight: -0.3,
    normal: 0,
    wide: 0.2,
  },

  textStyle: {
    caption: {
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0,
    },
    captionMedium: {
      fontFamily: "Inter_500Medium",
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0,
    },
    bodySmall: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0,
    },
    bodySmallMedium: {
      fontFamily: "Inter_500Medium",
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0,
    },
    body: {
      fontFamily: "Inter_400Regular",
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
    },
    bodyMedium: {
      fontFamily: "Inter_500Medium",
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
    },
    label: {
      fontFamily: "Inter_500Medium",
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0,
    },
    labelStrong: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0,
    },
    title: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 20,
      lineHeight: 28,
      letterSpacing: -0.3,
    },
    heading: {
      fontFamily: "Inter_700Bold",
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: -0.4,
    },
  },
} as const;

export type TypographyToken = keyof typeof typography;
export type TextStyleToken = keyof typeof typography.textStyle;