import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { AppText } from '@/components/ui';
import { colors, fonts, radius, spacing } from '@/theme';

type Props = {
  identityLabel: string;
  onPressAvatar?: () => void;
};

export function HomeHeader({ identityLabel, onPressAvatar }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.brandMark} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <AppText variant="brand" color="textOnPrimary">
          S
        </AppText>
      </View>

      <View style={styles.brandCopy}>
        <AppText variant="brand" accessibilityRole="header">
          SarakuSetu
        </AppText>
        <AppText variant="caption" color="textMuted" numberOfLines={1} style={styles.shopLine}>
          {identityLabel}
        </AppText>
      </View>

      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel="Notifications unavailable"
        style={styles.bell}
      >
        <Feather name="bell" size={26} color={colors.text} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Profile"
        onPress={onPressAvatar}
        style={styles.avatar}
      >
        <Feather name="user" size={24} color={colors.primaryText} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  brandMark: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCopy: { flex: 1 },
  shopLine: { fontFamily: fonts.medium, fontSize: 14 },
  bell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
