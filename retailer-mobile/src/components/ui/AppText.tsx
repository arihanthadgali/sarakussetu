import { Text, type TextProps } from 'react-native';

import { colors, typography, type ColorToken, type TypographyVariant } from '@/theme';

export type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: ColorToken;
};

/** The only Text component screens should use; it enforces the type scale. */
export function AppText({ variant = 'body', color = 'text', style, ...rest }: AppTextProps) {
  return <Text {...rest} style={[typography[variant], { color: colors[color] }, style]} />;
}
