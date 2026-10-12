import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui';
import { formatRupees } from '@/lib/format';
import { colors, gutter, radius, spacing } from '@/theme';
export default function PaymentRoute() { const { id, total, status } = useLocalSearchParams<{ id: string; total: string; status: string }>(); const router = useRouter(); return <SafeAreaView style={styles.screen}><View style={styles.card}><AppText variant="screenTitle">Order created</AppText><AppText>Order #{id}</AppText><AppText variant="priceLg">{formatRupees(Number(total))}</AppText><AppText color="textMuted">Status: {status}</AppText><Pressable disabled style={[styles.button, styles.disabledButton]}><AppText color="textOnPrimary">Pay Now</AppText></Pressable><AppText color="textMuted">Payment gateway integration is coming next.</AppText><Pressable onPress={() => router.replace('/orders')}><AppText color="primaryText">View orders</AppText></Pressable></View></SafeAreaView>; }
const styles = StyleSheet.create({ screen: { flex: 1, justifyContent: 'center', backgroundColor: colors.canvas, padding: gutter }, card: { gap: spacing.lg, padding: spacing.xl, borderRadius: radius.lg, backgroundColor: colors.surface }, button: { alignItems: 'center', padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.primary }, disabledButton: { opacity: 0.55 } });
