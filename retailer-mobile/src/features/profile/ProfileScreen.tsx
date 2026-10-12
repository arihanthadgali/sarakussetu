import Constants from 'expo-constants';
import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { ComponentProps, ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import { AppText } from '@/components/ui';
import { cartQueryKey } from '@/features/cart/cart-store';
import { formatPhoneForDisplay } from '@/features/auth/phone';
import { useSession } from '@/features/auth/session-store';
import { ordersQueryKey } from '@/features/orders/orders';
import { colors, gutter, radius, spacing } from '@/theme';

type ProfileScreenProps = {
  onOpenOrders: () => void;
  onOpenCart: () => void;
  onSignedOut: () => void;
  onSignIn: () => void;
};

export function ProfileScreen({ onOpenOrders, onOpenCart, onSignedOut, onSignIn }: ProfileScreenProps) {
  const status = useSession((state) => state.status);
  const customer = useSession((state) => state.customer);
  const bootstrap = useSession((state) => state.bootstrap);
  const signOut = useSession((state) => state.signOut);
  const queryClient = useQueryClient();
  const version = Constants.expoConfig?.version ?? Constants.nativeAppVersion;

  const logout = async () => {
    await signOut();
    queryClient.removeQueries({ queryKey: cartQueryKey });
    queryClient.removeQueries({ queryKey: ordersQueryKey });
    onSignedOut();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="screenTitle">Profile</AppText>

        {status === 'booting' ? <View style={styles.state}><AppText>Loading profile…</AppText></View> : null}
        {status === 'unreachable' ? <View style={styles.state}><AppText variant="bodyStrong">Unable to load your profile.</AppText><Pressable onPress={() => void bootstrap()}><AppText color="primaryText">Retry</AppText></Pressable></View> : null}
        {status === 'signedIn' && customer ? <>
          <Section title="Account">
            <View style={styles.accountRow}>
              <View style={styles.avatar}><Feather name="user" size={24} color={colors.primary} /></View>
              <View style={styles.accountCopy}>
                <AppText variant="title">Account</AppText>
                <AppText color="textMuted">+91 {formatPhoneForDisplay(customer.phoneNumber)}</AppText>
              </View>
            </View>
          </Section>

          <Section title="Account actions">
            <MenuRow icon="file-text" label="My Orders" onPress={onOpenOrders} />
            <MenuRow icon="shopping-cart" label="Cart" onPress={onOpenCart} />
            <MenuRow icon="log-out" label="Logout" danger onPress={() => void logout()} />
          </Section>
        </> : null}
        {status === 'signedOut' ? <Section title="Account"><View style={styles.state}><AppText color="textMuted">Sign in when you are ready to place an order.</AppText><Pressable onPress={onSignIn}><AppText color="primaryText">Sign in</AppText></Pressable></View></Section> : null}

        <View style={styles.appInfo}>
          <AppText variant="captionStrong">SarakuSetu</AppText>
          {version ? <AppText variant="caption" color="textMuted">Version {version}</AppText> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <View style={styles.section}><AppText variant="sectionTitle">{title}</AppText><View style={styles.card}>{children}</View></View>;
}

function MenuRow({ icon, label, danger = false, onPress }: { icon: ComponentProps<typeof Feather>['name']; label: string; danger?: boolean; onPress: () => void }) {
  const color = danger ? colors.dangerFg : colors.primary;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}><Feather name={icon} size={20} color={color} /><AppText variant="bodyStrong" color={danger ? 'dangerFg' : 'text'} style={styles.menuLabel}>{label}</AppText><Feather name="chevron-right" size={20} color={colors.textMuted} /></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: gutter },
  content: { paddingVertical: spacing.xl, gap: spacing.xxl },
  section: { gap: spacing.md },
  card: { overflow: 'hidden', borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg },
  avatar: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.surfaceSuccess },
  accountCopy: { gap: spacing.xxs },
  menuRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuLabel: { flex: 1 },
  pressed: { backgroundColor: colors.surfaceMuted },
  state: { gap: spacing.sm, padding: spacing.lg },
  appInfo: { alignItems: 'center', gap: spacing.xxs, paddingTop: spacing.xl },
});
