/** 4-pt spacing scale. */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Horizontal page gutter used by every screen. */
export const gutter = spacing.lg;

export const radius = {
  sm: 8,
  md: 12, // buttons, inputs, pills
  lg: 16, // cards
  xl: 20,
  pill: 999,
} as const;

/** Minimum touch target (Android guideline). */
export const touchTarget = 44;
