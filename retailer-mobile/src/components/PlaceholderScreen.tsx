import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { colors, gutter, spacing } from '@/theme';

type Props = { title: string; description: string; children?: ReactNode };

/** Phase 1 stand-in for screens that are built in later phases. */
export function PlaceholderScreen({ title, description, children }: Props) {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.body}>
        <AppText variant="screenTitle" accessibilityRole="header">
          {title}
        </AppText>
        <AppText color="textMuted">{description}</AppText>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  body: { padding: gutter, paddingTop: spacing.xxl, gap: spacing.md },
});
