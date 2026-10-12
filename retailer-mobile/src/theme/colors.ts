/**
 * Colour tokens taken from the approved Home design reference
 * (deep green + turmeric CTA + terracotta alert on cream).
 * Use semantic names in components, never raw hex values.
 */
const palette = {
  green900: '#123322',
  green800: '#1B4A2E', // brand / primary
  green600: '#2E6B45',
  green500: '#4F7A3C',
  green100: '#E7F0E3',
  green50: '#EEF4EA',
  turmeric500: '#E7A93D', // primary CTA
  turmeric700: '#B67F1E',
  turmeric100: '#FBEBCC',
  terracotta500: '#C1552D', // alerts, notification badge
  terracotta700: '#8F3A1C',
  terracotta100: '#F3DCCB',
  cream50: '#FFFDF8',
  cream100: '#FBF8F0',
  cream200: '#F7F2E7',
  cream300: '#EFE7D2',
  sand400: '#E2D8BC',
  sand500: '#D3C6A0',
  ink900: '#241F18',
  ink600: '#655F4E',
  ink400: '#8E8772',
  white: '#FFFFFF',
} as const;

export const colors = {
  // surfaces
  canvas: palette.cream200, // scrolling body
  chrome: palette.cream100, // header + tab bar
  surface: palette.cream50, // cards
  surfaceMuted: palette.cream300, // search field, product image well, avatar
  surfaceSuccess: palette.green50, // "in cart" pills, icon wells

  // borders
  border: palette.sand400,
  borderStrong: palette.sand500,

  // text
  text: palette.ink900,
  textMuted: palette.ink600,
  textSubtle: palette.ink400,
  textOnPrimary: palette.white,
  textOnCta: '#3A2703',

  // brand + intent
  primary: palette.green800,
  primaryPressed: palette.green900,
  primaryText: palette.green800,
  cta: palette.turmeric500,
  ctaPressed: palette.turmeric700,
  accent: palette.turmeric500, // active category underline
  danger: palette.terracotta500,

  // status badge pairs (background / foreground)
  successBg: palette.green100,
  successFg: palette.green600,
  warningBg: palette.turmeric100,
  warningFg: palette.turmeric700,
  dangerBg: palette.terracotta100,
  dangerFg: palette.terracotta700,
  neutralBg: palette.cream300,
  neutralFg: palette.ink600,

  white: palette.white,
} as const;

export type ColorToken = keyof typeof colors;
export { palette };
