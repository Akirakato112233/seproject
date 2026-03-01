import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { API, NGROK_HEADERS } from '../../config';

/**
 * Register Screen - สำหรับ Merchant หลัง Google Sign-In
 * รูปแบบเหมือน user app (displayName, phone)
 * demo=1: ไม่บันทึกลง DB แค่แสดง flow แล้ว login ด้วย demo user
 */
export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    email?: string;
    displayName?: string;
    tempToken?: string;
    demo?: string;
  }>();

  const [displayName, setDisplayName] = useState(params.displayName || '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const submittedRef = useRef(false);
  const { login } = useAuth();

  const isDemo = params.demo === '1';
  const isValid =
    displayName.trim().length >= 2 &&
    phone.trim().length >= 9 &&
    phone[0] === '0';

  const handleRegister = async () => {
    if (displayName.trim().length < 2) {
      Alert.alert('Error', 'Please enter a valid display name');
      return;
    }
    if (phone.length > 0 && phone[0] !== '0') {
      Alert.alert('Error', 'Phone number must start with 0');
      return;
    }
    if (phone.trim().length < 9) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    if (submittedRef.current) return;
    submittedRef.current = true;

    setLoading(true);

    try {
      if (isDemo) {
        // Demo mode: ไม่บันทึกลง DB แค่ login ด้วย demo user
        await login('demo_merchant_token', {
          _id: 'demo-merchant',
          email: params.email || 'demo@merchant.local',
          displayName: displayName.trim(),
          phone: phone.trim(),
        } as any);
        router.replace('/(tabs)');
        return;
      }

      const body = params.tempToken
        ? {
            tempToken: params.tempToken,
            displayName: displayName.trim(),
            phone: phone.trim(),
            role: 'merchant',
          }
        : {
            email: params.email,
            displayName: displayName.trim(),
            phone: phone.trim(),
          };
      const apiUrl = API.GOOGLE_REGISTER;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if ((data.success || data.next === 'APP') && data.user) {
        if (data.token) {
          await login(data.token, data.user);
        }
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', data.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      Alert.alert('Error', error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.header}>
            <Text style={s.title}>Complete Your Profile</Text>
            <Text style={s.subtitle}>
              Just a few more details to get you started
            </Text>
          </View>

          <View style={s.form}>
            <View style={s.inputGroup}>
              <Text style={s.label}>Email</Text>
              <View style={[s.input, s.inputDisabled]}>
                <Text style={s.inputText}>{params.email || '-'}</Text>
              </View>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>Display Name *</Text>
              <TextInput
                style={s.input}
                placeholder="Enter your name"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>Phone Number *</Text>
              <TextInput
                style={s.input}
                placeholder="เบอร์โทรศัพท์สำหรับติดต่อ"
                value={phone}
                onChangeText={(text) => {
                  const cleaned = text.replace(/\D/g, '');
                  setPhone(cleaned);
                }}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </View>

          {isDemo && (
            <Text style={s.demoHint}>Demo mode: ข้อมูลจะไม่ถูกบันทึกลงระบบ</Text>
          )}

          <TouchableOpacity
            style={[s.cta, !isValid && s.ctaDisabled]}
            activeOpacity={0.85}
            onPress={handleRegister}
            disabled={!isValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={s.ctaText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  form: {
    gap: 20,
    marginBottom: 20,
  },
  inputGroup: { gap: 8 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
  },
  inputDisabled: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
  },
  inputText: { fontSize: 15, color: '#666' },
  demoHint: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
  },
  cta: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0E3A78',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0E3A78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
