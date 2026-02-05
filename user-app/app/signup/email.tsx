import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignupEmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const emailValid = useMemo(() => {
    const v = email.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(v);
  }, [email]);

  const onContinue = () => {
    const v = email.trim().toLowerCase();
    if (!v) return;
    router.push({ pathname: '/signup/phone', params: { email: v } });
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.container}>
          <Text style={s.title}>What's your email?</Text>

          <TextInput
            style={s.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            returnKeyType="done"
            onSubmitEditing={onContinue}
          />

          <Text style={s.helper}>
            We’ll send a verification email to this address, where you can confirm and restore access to your account.
          </Text>

          <TouchableOpacity
            style={[s.cta, !emailValid && s.ctaDisabled]}
            activeOpacity={0.85}
            onPress={onContinue}
            disabled={!emailValid}
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
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  title: { fontSize: 16, fontWeight: '700', color: '#111', textAlign: 'center', marginBottom: 10 },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#3A66B7',
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  helper: {
    marginTop: 10,
    color: '#6C7A89',
    fontSize: 11,
    lineHeight: 16,
    textDecorationLine: 'underline',
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

