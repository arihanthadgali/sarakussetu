import { useRouter } from 'expo-router';

import { ProfileScreen } from '@/features/profile/ProfileScreen';

export default function ProfileRoute() {
  const router = useRouter();
  return <ProfileScreen onOpenOrders={() => router.navigate('/orders')} onOpenCart={() => router.navigate('/cart')} onSignedOut={() => router.replace('/')} onSignIn={() => router.navigate('/sign-in')} />;
}
