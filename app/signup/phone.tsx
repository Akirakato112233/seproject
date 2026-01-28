import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignupPhoneScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = String(params.email ?? '');

  const [countryCode] = useState('+66');
  const [mobile, setMobile] = useState('');

  const phoneE164 = useMemo(() => `${countryCode}${mobile.trim()}`, [countryCode, mobile]);
  const canContinue = useMemo(() => email.length > 0 && mobile.trim().length >= 8, [email, mobile]);

  const onContinue = () => {
    // Phone is only collected/stored; OTP is sent to EMAIL on the next screen.
    router.push({ pathname: '/signup/otp', params: { email, phone: phoneE164 } });
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.container}>
          <Text style={s.title}>What's your mobile number?</Text>
          <Text style={s.subtitle}>We’ll store this number for your account.</Text>

          <View style={s.phoneRow}>
            <View style={s.countryBox}>
              <Text style={s.flag}>🇹🇭</Text>
              <Text style={s.countryCode}>{countryCode}</Text>
            </View>
            <TextInput
              style={[s.input, s.phoneInput]}
              placeholder="Mobile number"
              keyboardType="phone-pad"
              value={mobile}
              onChangeText={setMobile}
            />
          </View>

          <TouchableOpacity
            style={[s.cta, !canContinue && s.ctaDisabled]}
            activeOpacity={0.85}
            onPress={onContinue}
            disabled={!canContinue}
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
  subtitle: { fontSize: 11, color: '#8A97A6', textAlign: 'center', marginBottom: 14 },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#3A66B7',
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  phoneRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  countryBox: {
    height: 44,
    borderWidth: 1,
    borderColor: '#3A66B7',
    borderRadius: 4,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flag: { fontSize: 16 },
  countryCode: { fontSize: 13, fontWeight: '700', color: '#111' },
  phoneInput: { flex: 1, marginBottom: 0 },
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

