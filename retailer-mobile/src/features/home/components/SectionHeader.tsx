import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';

type Props = { title: string; actionLabel?: string; actionIcon?: boolean; onAction?: () => void };

export function SectionHeader({ title, actionLabel, actionIcon = false, onAction }: Props) {
  return (
    <View style={styles.row}>
      <AppText variant="sectionTitle" accessibilityRole="header">
        {title}
      </AppText>
      {actionLabel ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={10} style={styles.action}>
          <AppText variant="bodyStrong" color="primaryText">
            {actionLabel}
          </AppText>
          {actionIcon ? <Feather name="arrow-right" size={18} color={colors.primary} /> : null}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  action: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
