export const spacing = {
  xs: 4,
  sm: 8,
  md: 15,
  lg: 15,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  small: 6,
  medium: 12,
  large: 20,
  full: 9999,
  input: 8,
  card: 12,
} as const;

export const screenPadding = {
  horizontal: 16,
  vertical: 24,
} as const;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
