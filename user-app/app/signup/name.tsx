import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API } from '../../config';

export default function SignupNameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; phone?: string; verificationId?: string }>();
  const email = String(params.email ?? '');
  const phone = String(params.phone ?? '');
  const verificationId = String(params.verificationId ?? '');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  const canContinue = useMemo(() => {
    return (
      email.length > 0 &&
      phone.length > 0 &&
      verificationId.length > 0 &&
      firstName.trim().length > 0 &&
      lastName.trim().length > 0
    );
  }, [email, phone, verificationId, firstName, lastName]);

  const onContinue = async () => {
    try {
      setLoading(true);
      const res = await fetch(API.SIGNUP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone,
          verificationId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? 'Signup failed');

      router.replace('/sign-in');
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      alert(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.container}>
          <Text style={s.title}>What's your name?</Text>
          <Text style={s.subtitle}>Please enter your name as it appears on your ID or passport</Text>

          <TextInput style={s.input} placeholder="First name" value={firstName} onChangeText={setFirstName} />
          <TextInput style={s.input} placeholder="Last name" value={lastName} onChangeText={setLastName} />

          <TouchableOpacity
            style={[s.cta, (!canContinue || loading) && s.ctaDisabled]}
            activeOpacity={0.85}
            onPress={onContinue}
            disabled={!canContinue || loading}
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

