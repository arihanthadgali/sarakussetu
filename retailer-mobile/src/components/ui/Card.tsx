import { View, type ViewProps } from 'react-native';

import { colors, radius } from '@/theme';

/** Bordered surface used by order, buy-again and product cards. */
export function Card({ style, ...rest }: ViewProps) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.lg,
          overflow: 'hidden',
        },
        style,
      ]}
    />
  );
}
