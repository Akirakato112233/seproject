import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API } from '../../config';

export default function SignupOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; phone?: string }>();
  const email = String(params.email ?? '');
  const phone = String(params.phone ?? '');

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const codeValid = useMemo(() => code.replace(/\D/g, '').length === 6, [code]);

  const requestEmailOtp = async () => {
    const res = await fetch(API.REQUEST_OTP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? 'Request OTP failed');
  };

  useEffect(() => {
    // Auto-send OTP to email when entering this screen
    if (!email) return;
    requestEmailOtp().catch((e) => Alert.alert('Send OTP failed', String(e?.message ?? e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const onVerify = async () => {
    try {
      setLoading(true);
      const res = await fetch(API.VERIFY_OTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.replace(/\D/g, '') }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert('OTP invalid', data?.message ?? 'Please try again.');
        return;
      }
      router.push({ pathname: '/signup/name', params: { email, phone, verificationId: String(data?.verificationId ?? '') } });
    } catch (e: any) {
      Alert.alert('Network error', String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    try {
      setLoading(true);
      await requestEmailOtp();
    } catch (e: any) {
      Alert.alert('Resend failed', String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.container}>
          <Text style={s.title}>Verify account with OTP</Text>
          <Text style={s.subtitle}>We’ve sent verification code to {email} by email</Text>

          <TextInput
            style={s.otp}
            keyboardType="number-pad"
            placeholder="••••••"
            value={code}
            onChangeText={setCode}
            maxLength={6}
            textAlign="center"
          />

          <TouchableOpacity style={s.resend} activeOpacity={0.85} onPress={onResend} disabled={loading}>
            <Text style={s.resendText}>Didn't get a code? Resend</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.cta, (!codeValid || loading) && s.ctaDisabled]}
            activeOpacity={0.85}
            onPress={onVerify}
            disabled={!codeValid || loading}
          >
            <Text style={s.ctaText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 50 },
  title: { fontSize: 16, fontWeight: '800', color: '#111', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 11, color: '#8A97A6', textAlign: 'center', marginBottom: 18 },
  otp: {
    height: 44,
    borderWidth: 1,
    borderColor: '#3A66B7',
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 18,
    letterSpacing: 10,
    backgroundColor: '#fff',
  },
  resend: { marginTop: 10, alignItems: 'center' },
  resendText: { fontSize: 11, color: '#6C7A89' },
  cta: {
    marginTop: 'auto',
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0E3A78',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});

