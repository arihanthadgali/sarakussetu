import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors, radius, spacing, touchTarget } from '@/theme';

import { AppText } from './AppText';

type Variant = 'primary' | 'cta' | 'outline' | 'ghost';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: ComponentProps<typeof Feather>['name'];
  iconPosition?: 'start' | 'end';
  loading?: boolean;
  disabled?: boolean;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  children?: ReactNode;
};

const variantStyles: Record<Variant, { bg: string; bgPressed: string; fg: string; border?: string }> = {
  primary: { bg: colors.primary, bgPressed: colors.primaryPressed, fg: colors.textOnPrimary },
  cta: { bg: colors.cta, bgPressed: colors.ctaPressed, fg: colors.textOnCta },
  outline: { bg: colors.surface, bgPressed: colors.surfaceSuccess, fg: colors.primaryText, border: colors.primary },
  ghost: { bg: 'transparent', bgPressed: colors.surfaceSuccess, fg: colors.primaryText },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconPosition = 'end',
  loading = false,
  disabled = false,
  size = 'md',
  style,
  accessibilityLabel,
}: ButtonProps) {
  const tone = variantStyles[variant];
  const inactive = disabled || loading;
  const iconNode = icon ? <Feather name={icon} size={18} color={tone.fg} /> : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' && styles.large,
        {
          backgroundColor: pressed ? tone.bgPressed : tone.bg,
          borderColor: tone.border ?? 'transparent',
          opacity: inactive && !loading ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone.fg} />
      ) : (
        <View style={styles.content}>
          {iconPosition === 'start' && iconNode}
          <AppText variant="bodyStrong" style={{ color: tone.fg }}>
            {label}
          </AppText>
          {iconPosition === 'end' && iconNode}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: { minHeight: 52, paddingHorizontal: spacing.xl },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
