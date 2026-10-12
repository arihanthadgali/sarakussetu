import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral';

const tones: Record<BadgeTone, { bg: string; fg: string }> = {
  success: { bg: colors.successBg, fg: colors.successFg },
  warning: { bg: colors.warningBg, fg: colors.warningFg },
  danger: { bg: colors.dangerBg, fg: colors.dangerFg },
  neutral: { bg: colors.neutralBg, fg: colors.neutralFg },
};

/** Stock and order-status pill. Tone carries meaning; the label always says it in words. */
export function StatusBadge({ label, tone }: { label: string; tone: BadgeTone }) {
  const { bg, fg } = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: fg }]} />
      <AppText variant="captionStrong" style={{ color: fg }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
