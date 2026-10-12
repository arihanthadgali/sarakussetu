import { useRouter } from 'expo-router';

import { ShopScreen } from '@/features/shop/ShopScreen';

export default function ShopRoute() {
  const router = useRouter();
  return <ShopScreen onViewCart={() => router.navigate('/cart')} />;
}
