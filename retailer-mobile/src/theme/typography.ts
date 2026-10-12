import type { TextStyle } from 'react-native';

/**
 * Font families loaded in src/app/_layout.tsx.
 * On Android a custom font must be selected by family per weight; do not rely
 * on fontWeight with these families.
 */
export const fonts = {
  display: 'FjallaOne_400Regular',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

/**
 * Type scale from the Home design. Fjalla One carries brand, section titles and
 * prices; Inter carries everything a retailer reads quickly.
 */
export const typography = {
  brand: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34 },
  screenTitle: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36 },
  priceLg: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30 },
  priceMd: { fontFamily: fonts.display, fontSize: 18, lineHeight: 22 },

  title: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  label: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 18 },
  tab: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 20 },
  tabActive: { fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 20 },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 17 },
  captionStrong: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 17 },
  micro: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
