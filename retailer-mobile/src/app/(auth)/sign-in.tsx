import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { requestOtp } from '@/api/auth';
import { toUserMessage } from '@/api/errors';
import { AppText, Button, TextField } from '@/components/ui';
import { isValidPhoneNumber, sanitizePhoneInput } from '@/features/auth/phone';
import { colors, gutter, radius, spacing } from '@/theme';

export default function SignInScreen() {
  const router = useRouter();
  const { checkout } = useLocalSearchParams<{ checkout?: string }>();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sendOtp = useMutation({
    mutationFn: (phoneNumber: string) => requestOtp(phoneNumber),
    onSuccess: (_data, phoneNumber) => router.push({ pathname: '/verify', params: { phone: phoneNumber, checkout } }),
    onError: (mutationError) => setError(toUserMessage(mutationError)),
  });

  const submit = () => {
    if (!isValidPhoneNumber(phone)) {
      setError('Enter your 10-digit mobile number.');
      return;
    }
    setError(null);
    // Sent exactly as typed: 10 bare digits, matching the retailer web app.
    sendOtp.mutate(phone);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <AppText variant="brand" color="textOnPrimary">
                S
              </AppText>
            </View>
            <View>
              <AppText variant="brand">SarakuSetu</AppText>
              <AppText variant="caption" color="textMuted">
                Wholesale stock for your shop
              </AppText>
            </View>
          </View>

          <View style={styles.copy}>
            <AppText variant="screenTitle" accessibilityRole="header">
              Sign in to order stock
            </AppText>
            <AppText color="textMuted">We’ll send a 6-digit code to your registered mobile number.</AppText>
          </View>

          <TextField
            label="Mobile number"
            // Display-only prefix; it is never sent to the backend.
            prefix="+91"
            value={phone}
            onChangeText={(value) => {
              setPhone(sanitizePhoneInput(value));
              if (error) setError(null);
            }}
            placeholder="10-digit mobile number"
            keyboardType="number-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            // No maxLength: it would cut a pasted "+91 …" before sanitizePhoneInput can clean it.
            returnKeyType="done"
            onSubmitEditing={submit}
            error={error}
            editable={!sendOtp.isPending}
            autoFocus
          />

          <Button label="Send code" size="lg" loading={sendOtp.isPending} onPress={submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  content: { padding: gutter, paddingTop: spacing.xxxl, gap: spacing.xxl },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  brandMark: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { gap: spacing.sm },
});
