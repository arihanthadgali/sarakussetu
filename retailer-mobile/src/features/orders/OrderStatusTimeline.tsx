import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

const normalSteps = [
  { status: 'PENDING', label: 'Order Placed' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'PROCESSING', label: 'Processing' },
  { status: 'READY', label: 'Ready' },
  { status: 'COMPLETED', label: 'Completed' },
] as const;

export function OrderStatusTimeline({ status }: { status: string }) {
  if (status === 'CANCELLED') {
    return <View style={styles.cancelled}><Feather name="x-circle" size={20} color={colors.dangerFg} /><View style={styles.copy}><AppText variant="bodyStrong" color="dangerFg">Order cancelled</AppText><AppText color="textMuted">This order will not continue through fulfilment.</AppText></View></View>;
  }

  const currentIndex = normalSteps.findIndex((step) => step.status === status);
  if (currentIndex === -1) {
    return <View style={styles.unknown}><AppText variant="bodyStrong">Order status update</AppText><AppText color="textMuted">Current status: {status.replace(/_/g, ' ')}</AppText></View>;
  }

  const currentStep = normalSteps[currentIndex];
  if (!currentStep) return null;

  return <View accessibilityLabel={`Order timeline: ${currentStep.label}`} style={styles.timeline}>
    {normalSteps.map((step, index) => {
      const complete = index < currentIndex;
      const current = index === currentIndex;
      return <View key={step.status} style={styles.step}><View style={styles.track}><View style={[styles.marker, (complete || current) && styles.markerActive]}>{complete ? <Feather name="check" size={13} color={colors.textOnPrimary} /> : null}</View>{index < normalSteps.length - 1 ? <View style={[styles.line, complete && styles.lineActive]} /> : null}</View><View style={styles.copy}><AppText variant={current ? 'bodyStrong' : 'body'} color={current ? 'primaryText' : complete ? 'text' : 'textMuted'}>{step.label}</AppText><AppText variant="caption" color="textMuted">{current ? 'Current status' : complete ? 'Completed' : 'Upcoming'}</AppText></View></View>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  timeline: { gap: spacing.xs },
  step: { flexDirection: 'row', gap: spacing.md, minHeight: 48 },
  track: { alignItems: 'center', width: 22 },
  marker: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.borderStrong, borderRadius: radius.pill, backgroundColor: colors.surface },
  markerActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  line: { flex: 1, width: 2, marginVertical: spacing.xxs, backgroundColor: colors.border },
  lineActive: { backgroundColor: colors.primary },
  copy: { flex: 1, gap: spacing.xxs },
  cancelled: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.dangerBg },
  unknown: { gap: spacing.xs, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
});
