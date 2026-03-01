import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useRegistrationStore } from '../../stores/registrationStore';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { API, NGROK_HEADERS } from '../../config';

const OPTIONS = [
  { value: 'full', label: 'Full Service' },
  { value: 'coin', label: 'Coin-operated' },
];

/**
 * Service Preference Screen - เลือกประเภทร้าน (full service / coin)
 * กด Continue → บันทึกลง DB แล้ว login
 */
export default function ServicePreferenceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    tempToken?: string;
    email?: string;
    displayName?: string;
    phone?: string;
  }>();

  const [selected, setSelected] = useState<'full' | 'coin' | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { setPrefill, setBusinessType, setMerchantUser, setStep, resetForm } = useRegistrationStore();

  const handleContinue = async () => {
    if (!selected) {
      Alert.alert('Error', 'Please select your service preference');
      return;
    }
    if (!params.tempToken) {
      Alert.alert('Error', 'Session expired. Please sign in again.');
      return;
    }

    setLoading(true);
    try {
      const body = {
        tempToken: params.tempToken,
        displayName: params.displayName?.trim(),
        phone: params.phone?.trim(),
        businessType: selected,
      };
      const response = await fetch(API.MERCHANTS_GOOGLE_REGISTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if ((data.success || data.next === 'APP') && data.user) {
        if (data.token) {
          await login(data.token, data.user);
        }
        setPrefill({
          email: params.email,
          displayName: params.displayName,
          phone: params.phone,
        });
        setBusinessType(selected);
        setMerchantUser(String(data.user.id || data.user._id || ''));
        resetForm();
        setStep(1);
        router.replace('/signup/onboarding/step-1');
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

  const selectedLabel = selected ? OPTIONS.find((o) => o.value === selected)?.label : null;

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
            <Text style={s.title}>Choose your service preference</Text>
            <Text style={s.subtitle}>Tell us about yourself</Text>
          </View>

          <View style={s.form}>
            <View style={s.inputGroup}>
              <Text style={s.label}>Service preference</Text>
              <TouchableOpacity
                style={s.dropdown}
                onPress={() => setDropdownOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={selectedLabel ? s.dropdownText : s.dropdownPlaceholder}>
                  {selectedLabel || 'Service preference'}
                </Text>
                <Text style={s.chevron}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[s.cta, !selected && s.ctaDisabled]}
            activeOpacity={0.85}
            onPress={handleContinue}
            disabled={!selected || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={s.ctaText}>Continue</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownOpen(false)}
        >
          <View style={s.modalContent}>
            {OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={s.option}
                onPress={() => {
                  setSelected(opt.value as 'full' | 'coin');
                  setDropdownOpen(false);
                }}
              >
                <Text style={s.optionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
  dropdown: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
  },
  dropdownText: { fontSize: 15, color: '#111' },
  dropdownPlaceholder: { fontSize: 15, color: '#999' },
  chevron: { fontSize: 10, color: '#666' },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: { fontSize: 16, color: '#111' },
});
