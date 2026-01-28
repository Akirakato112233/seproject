import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const router = useRouter();

  const goToApp = () => router.replace('/(tabs)');

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Sign In</Text>
          <Text style={s.subtitle}>
            Save time by linking your social account. We will never share any personal data.
          </Text>
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={[s.btn, s.btnEmail]} activeOpacity={0.85} onPress={goToApp}>
            <Text style={[s.btnText, s.btnTextEmail]}>Continue with email</Text>
          </TouchableOpacity>

          <View style={s.orRow}>
            <View style={s.orLine} />
            <Text style={s.orText}>OR</Text>
            <View style={s.orLine} />
          </View>

          <TouchableOpacity style={s.googleCircle} activeOpacity={0.85} onPress={goToApp}>
            <Ionicons name="logo-google" size={18} color="#EA4335" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    color: '#777',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  actions: {
    gap: 14,
    alignItems: 'center',
  },
  btn: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnEmail: {
    backgroundColor: '#EDEDED',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  btnTextEmail: { color: '#111' },
  orRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E6E6E6',
  },
  orText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
  },
  googleCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: 2,
  },
});

