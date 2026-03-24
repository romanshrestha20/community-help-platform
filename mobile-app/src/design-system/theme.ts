import { colors } from "./tokens/colors";
import { spacing } from "./tokens/spacing";
import { typography } from "./tokens/typography";
import { radius } from "./tokens/radius";

export const theme = {
  colors,
  spacing,
  typography,
  radius,
} as const;

export type Theme = typeof theme;
