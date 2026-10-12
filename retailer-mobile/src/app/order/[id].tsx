import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderDetailsScreen } from '@/features/orders/OrderDetailsScreen';
import { useOrder } from '@/features/orders/orders';
import { colors } from '@/theme';

export default function OrderDetailsRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading, error, refetch, isRefetching } = useOrder(id ?? '');

  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}><OrderDetailsScreen order={order} isLoading={isLoading} error={error} isRefreshing={isRefetching} onRetry={() => void refetch()} onRefresh={() => void refetch()} onBack={() => router.back()} /></SafeAreaView>;
}
