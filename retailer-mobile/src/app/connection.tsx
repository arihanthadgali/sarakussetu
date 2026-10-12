import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { AppText, Button } from '@/components/ui';
import { useSession } from '@/features/auth/session-store';
import { colors, gutter, spacing } from '@/theme';

/** Shown when a saved session exists but the backend could not be reached at startup. */
export default function ConnectionScreen() {
  const bootstrap = useSession((state) => state.bootstrap);
  const signOut = useSession((state) => state.signOut);
  const [retrying, setRetrying] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Feather name="wifi-off" size={40} color={colors.textMuted} />
        <AppText variant="screenTitle" accessibilityRole="header">
          Can’t reach SarakuSetu
        </AppText>
        <AppText color="textMuted">
          Your shop is still signed in. Check your internet connection, then try again.
        </AppText>
        <Button
          label="Try again"
          size="lg"
          loading={retrying}
          onPress={async () => {
            setRetrying(true);
            await bootstrap();
            setRetrying(false);
          }}
        />
        <Button label="Sign out" variant="ghost" onPress={() => void signOut()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  body: { flex: 1, justifyContent: 'center', padding: gutter, gap: spacing.lg },
});
