import { useRouter } from 'expo-router';

import { HomeScreen } from '@/features/home/HomeScreen';

export default function HomeRoute() {
  const router = useRouter();
  return (
    <HomeScreen
      onViewCart={() => router.navigate('/cart')}
      onTrackOrder={() => router.navigate('/orders')}
      onOpenProfile={() => router.navigate('/profile')}
      onOpenShop={() => router.navigate('/shop')}
    />
  );
}
