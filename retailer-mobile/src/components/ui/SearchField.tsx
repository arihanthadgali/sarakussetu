import { StyleSheet, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors, fonts, radius, spacing } from '@/theme';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
};

export function SearchField({ value, onChangeText, placeholder = 'Search products, brands...' }: Props) {
  return (
    <View style={styles.field}>
      <Feather name="search" size={20} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        returnKeyType="search"
        accessibilityLabel="Search products"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.text, paddingVertical: spacing.sm },
});
