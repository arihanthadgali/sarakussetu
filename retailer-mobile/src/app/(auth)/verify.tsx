import { useMutation } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { requestOtp, verifyOtp } from '@/api/auth';
import { toUserMessage } from '@/api/errors';
import { AppText, Button, TextField } from '@/components/ui';
import {
  formatPhoneForDisplay,
  isValidOtp,
  isValidPhoneNumber,
  sanitizeOtpInput,
} from '@/features/auth/phone';
import { useSession } from '@/features/auth/session-store';
import { colors, gutter, spacing } from '@/theme';

const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyScreen() {
  const router = useRouter();
  const { phone, checkout } = useLocalSearchParams<{ phone?: string; checkout?: string }>();
  const signIn = useSession((state) => state.signIn);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // On success signIn() stores the token and loads /api/auth/me; the root
  // Stack.Protected guard then switches to the tabs automatically.
  const verify = useMutation({
    mutationFn: async (code: string) => {
      const result = await verifyOtp(phone ?? '', code);
      await signIn(result.accessToken);
    },
    onSuccess: () => { if (checkout === '1') router.replace('/checkout'); },
    onError: (mutationError) => {
      setError(toUserMessage(mutationError));
      setOtp('');
    },
  });

  const resend = useMutation({
    mutationFn: () => requestOtp(phone ?? ''),
    onSuccess: () => {
      setError(null);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    },
    onError: (mutationError) => setError(toUserMessage(mutationError)),
  });

  if (!phone || !isValidPhoneNumber(phone)) return <Redirect href="/sign-in" />;

  const submit = (code = otp) => {
    if (!isValidOtp(code)) {
      setError('Enter the 6-digit code.');
      return;
    }
    setError(null);
    verify.mutate(code);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.copy}>
            <AppText variant="screenTitle" accessibilityRole="header">
              Enter the code
            </AppText>
            <AppText color="textMuted">Sent to +91 {formatPhoneForDisplay(phone)}. It expires in 5 minutes.</AppText>
          </View>

          <TextField
            label="6-digit code"
            value={otp}
            onChangeText={(value) => {
              const next = sanitizeOtpInput(value);
              setOtp(next);
              if (error) setError(null);
              if (next.length === 6 && !verify.isPending) submit(next);
            }}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={6}
            editable={!verify.isPending}
            error={error}
            hint={__DEV__ ? 'Development: the code is printed in the backend console.' : undefined}
            autoFocus
          />

          <Button label="Verify and continue" size="lg" loading={verify.isPending} onPress={() => submit()} />

          <View style={styles.secondary}>
            <Button
              variant="ghost"
              label={cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
              disabled={cooldown > 0}
              loading={resend.isPending}
              onPress={() => resend.mutate()}
            />
            <Button variant="ghost" label="Change number" onPress={() => router.back()} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  content: { padding: gutter, paddingTop: spacing.xxxl, gap: spacing.xxl },
  copy: { gap: spacing.sm },
  secondary: { gap: spacing.xs },
});
