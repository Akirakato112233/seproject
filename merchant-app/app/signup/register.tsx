import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
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
import { Ionicons } from '@expo/vector-icons';

/**
 * Register Screen - สำหรับ Merchant หลัง Google Sign-In
 * บันทึกลง collection merchant-user
 */
export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    email?: string;
    displayName?: string;
    tempToken?: string;
  }>();

  const [displayName, setDisplayName] = useState(params.displayName || '');
  const [countryCode] = useState('+66');
  const [mobileNumber, setMobileNumber] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const submittedRef = useRef(false);

  const isValid =
    displayName.trim().length >= 2 &&
    mobileNumber.replace(/\D/g, '').length >= 9 &&
    acceptedTerms;

  const handleContinue = () => {
    if (displayName.trim().length < 2) {
      Alert.alert('Error', 'Please enter a valid display name');
      return;
    }
    const digits = mobileNumber.replace(/\D/g, '');
    if (digits.length < 9) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    if (submittedRef.current) return;
    submittedRef.current = true;

    const phone = `${countryCode}${digits.replace(/^0+/, '')}`;
    router.push({
      pathname: '/signup/service-preference',
      params: {
        tempToken: params.tempToken,
        email: params.email,
        displayName: displayName.trim(),
        phone,
      },
    });
    submittedRef.current = false;
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
              <View style={s.phoneRow}>
                <View style={s.countryCodeBox}>
                  <Text style={s.flag}>🇹🇭</Text>
                  <Text style={s.countryCodeText}>{countryCode}</Text>
                </View>
                <TextInput
                  style={[s.input, s.phoneInput]}
                  placeholder="Mobile number"
                  value={mobileNumber}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/\D/g, '');
                    setMobileNumber(cleaned);
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>
          </View>

          <View style={s.termsContainer}>
            <TouchableOpacity
              style={s.checkbox}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              activeOpacity={0.7}
            >
              <View style={[s.checkboxBox, acceptedTerms && s.checkboxBoxChecked]}>
                {acceptedTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={s.termsText}>
                ยอมรับ{' '}
                <Text
                  style={s.termsLink}
                  onPress={() => router.push('/signup/terms')}
                >
                  ข้อตกลง
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.cta, !isValid && s.ctaDisabled]}
            activeOpacity={0.85}
            onPress={handleContinue}
            disabled={!isValid}
          >
            <Text style={s.ctaText}>Continue</Text>
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
  phoneRow: {
    flexDirection: 'row',
    gap: 12,
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFA',
    gap: 6,
  },
  flag: { fontSize: 20 },
  countryCodeText: { fontSize: 15, color: '#333', fontWeight: '500' },
  phoneInput: { flex: 1 },
  termsContainer: {
    marginBottom: 24,
    marginTop: 4,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxBoxChecked: {
    backgroundColor: '#0E3A78',
    borderColor: '#0E3A78',
  },
  termsText: {
    fontSize: 14,
    color: '#444',
  },
  termsLink: {
    color: '#0E3A78',
    fontWeight: '600',
    textDecorationLine: 'underline',
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
