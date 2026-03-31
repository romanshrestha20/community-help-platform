export const radius = {
  sm: 8,
  md: 10,
  lg: 14,
  fill: 999,
} as const;

export type RadiusToken = keyof typeof radius;
