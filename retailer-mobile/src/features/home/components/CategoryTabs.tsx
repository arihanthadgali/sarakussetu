import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, gutter, spacing } from '@/theme';

type CategoryTab<Key extends string> = { key: Key; label: string };

type Props<Key extends string> = {
  categories: readonly CategoryTab<Key>[];
  selected: Key;
  onSelect: (key: Key) => void;
};

export function CategoryTabs<Key extends string>({ categories, selected, onSelect }: Props<Key>) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        accessibilityRole="tablist"
      >
        {categories.map((category) => {
          const active = category.key === selected;
          return (
            <Pressable
              key={category.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(category.key)}
              style={styles.tab}
            >
              <AppText variant={active ? 'tabActive' : 'tab'} color={active ? 'primaryText' : 'textMuted'}>
                {category.label}
              </AppText>
              <View style={[styles.indicator, active && styles.indicatorActive]} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderBottomWidth: 1, borderBottomColor: colors.border },
  content: { paddingHorizontal: gutter - spacing.md, gap: spacing.xs },
  tab: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  indicator: { height: 4, marginTop: spacing.md, borderRadius: 2, backgroundColor: 'transparent' },
  indicatorActive: { backgroundColor: colors.accent },
});
