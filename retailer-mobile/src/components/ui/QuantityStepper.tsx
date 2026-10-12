import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors, radius } from '@/theme';

import { AppText } from './AppText';

type Props = {
  quantity: number;
  unit: string;
  onDecrement: () => void;
  onIncrement: () => void;
  decrementDisabled?: boolean;
  incrementDisabled?: boolean;
  productName: string;
};

/** "− 2 bag +" — the quantity always shows its unit so kg and bags are never confused. */
export function QuantityStepper({
  quantity,
  unit,
  onDecrement,
  onIncrement,
  decrementDisabled,
  incrementDisabled,
  productName,
}: Props) {
  return (
    <View style={styles.row}>
      <StepButton icon="minus" label={`Decrease ${productName}`} onPress={onDecrement} disabled={decrementDisabled} />
      <AppText variant="bodyStrong" style={styles.value} accessibilityLiveRegion="polite">
        {quantity} {unit}
      </AppText>
      <StepButton icon="plus" label={`Increase ${productName}`} onPress={onIncrement} disabled={incrementDisabled} />
    </View>
  );
}

function StepButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: 'minus' | 'plus';
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Feather name={icon} size={18} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  button: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: colors.surfaceSuccess },
  disabled: { opacity: 0.35 },
  value: { flex: 1, textAlign: 'center' },
});
