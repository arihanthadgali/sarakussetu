import { Platform, type ViewStyle } from 'react-native';

/**
 * The design is flat and border-led; shadows are reserved for elements that
 * float above content (the sticky cart bar).
 */
export const shadows = {
  none: {} as ViewStyle,
  floating: Platform.select<ViewStyle>({
    android: { elevation: 8 },
    default: {
      shadowColor: '#123322',
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: -2 },
    },
  }),
} as const;
