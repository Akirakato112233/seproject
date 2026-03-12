import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  step1Schema,
  formatPhoneDisplay,
  type step1SchemaType,
} from '../../lib/registrationSchemas';
import { useRegistrationStore } from '../../stores/registrationStore';

/**
 * Shop Info Screen - หน้าแรกหลัง Google Sign-In
 * แสดงแบบฟอร์มข้อมูลร้านค้า + checkbox ยอมรับข้อตกลง
 * กด Continue → ไปหน้า Choose service preference
 */
export default function ShopInfoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    tempToken?: string;
    email?: string;
    displayName?: string;
  }>();
  const { formData, updateForm, setPrefill } = useRegistrationStore();

  const names = (params.displayName || '').trim().split(/\s+/);
  const defaultFirstName = names[0] || formData.owner_first_name || '';
  const defaultLastName = names.slice(1).join(' ') || formData.owner_last_name || '';

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const submittedRef = useRef(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<step1SchemaType>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      shop_name: formData.shop_name || '',
      phone: formData.phone || '',
      email: formData.email || params.email || '',
      owner_first_name: formData.owner_first_name || defaultFirstName,
      owner_last_name: formData.owner_last_name || defaultLastName,
      owner_phone: formData.owner_phone || '',
    },
  });

  const onContinue = handleSubmit((data) => {
    if (!acceptedTerms) {
      Alert.alert('กรุณายอมรับข้อตกลง', 'กรุณายอมรับข้อตกลงและเงื่อนไขการใช้งาน');
      return;
    }
    if (submittedRef.current) return;
    submittedRef.current = true;

    const phoneDigits = data.phone.replace(/\D/g, '');
    const phone = phoneDigits.length >= 10 ? `0${phoneDigits.slice(-9)}` : data.phone;
    const displayName = `${data.owner_first_name} ${data.owner_last_name}`.trim();

    const nextForm = {
      ...formData,
      shop_name: data.shop_name,
      phone,
      email: data.email,
      owner_first_name: data.owner_first_name,
      owner_last_name: data.owner_last_name,
      owner_phone: data.owner_phone || undefined,
    };
    updateForm(nextForm);
    setPrefill({
      email: data.email,
      displayName,
      phone: `+66${phone.replace(/^0/, '')}`,
    });

    router.push({
      pathname: '/signup/service-preference',
      params: {
        tempToken: params.tempToken,
        email: data.email,
        displayName,
        phone: `+66${phone.replace(/^0/, '')}`,
      },
    });
    submittedRef.current = false;
  });

  const isValid = acceptedTerms;

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace('/create-account')} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.title}>ข้อมูลร้านค้า</Text>
          <Text style={s.subtitle}>ขั้นตอนที่ 1 จาก 8</Text>

          <View style={s.form}>
            <View style={s.field}>
              <Text style={s.label}>ชื่อร้าน *</Text>
              <Controller
                control={control}
                name="shop_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, errors.shop_name && s.inputError]}
                    placeholder="ชื่อร้าน"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              {errors.shop_name && (
                <Text style={s.error}>{errors.shop_name.message}</Text>
              )}
            </View>

            <View style={s.field}>
              <Text style={s.label}>เบอร์โทรร้าน *</Text>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, errors.phone && s.inputError]}
                    placeholder="0XX-XXX-XXXX"
                    value={formatPhoneDisplay(value)}
                    onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, 10))}
                    onBlur={onBlur}
                    keyboardType="phone-pad"
                  />
                )}
              />
              {errors.phone && (
                <Text style={s.error}>{errors.phone.message}</Text>
              )}
            </View>

            <View style={s.field}>
              <Text style={s.label}>อีเมล *</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, errors.email && s.inputError]}
                    placeholder="example@email.com"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />
              {errors.email && (
                <Text style={s.error}>{errors.email.message}</Text>
              )}
            </View>

            <View style={s.row}>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={s.label}>ชื่อเจ้าของ *</Text>
                <Controller
                  control={control}
                  name="owner_first_name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[s.input, errors.owner_first_name && s.inputError]}
                      placeholder="ชื่อ"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
                {errors.owner_first_name && (
                  <Text style={s.error}>{errors.owner_first_name.message}</Text>
                )}
              </View>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={s.label}>นามสกุล *</Text>
                <Controller
                  control={control}
                  name="owner_last_name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[s.input, errors.owner_last_name && s.inputError]}
                      placeholder="นามสกุล"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
                {errors.owner_last_name && (
                  <Text style={s.error}>{errors.owner_last_name.message}</Text>
                )}
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>เบอร์โทรเจ้าของ (ถ้ามี)</Text>
              <Controller
                control={control}
                name="owner_phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, errors.owner_phone && s.inputError]}
                    placeholder="0XX-XXX-XXXX"
                    value={formatPhoneDisplay(value || '')}
                    onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, 10))}
                    onBlur={onBlur}
                    keyboardType="phone-pad"
                  />
                )}
              />
              {errors.owner_phone && (
                <Text style={s.error}>{errors.owner_phone.message}</Text>
              )}
            </View>
          </View>

          <View style={s.termsContainer}>
            <TouchableOpacity
              style={s.checkbox}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              activeOpacity={0.7}
            >
              <View style={[s.checkboxBox, acceptedTerms && s.checkboxBoxChecked]}>
                {acceptedTerms && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
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
            onPress={onContinue}
            disabled={!isValid}
          >
            <Text style={s.ctaText}>ถัดไป</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: 4 },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  form: { gap: 16 },
  field: { gap: 6 },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#333' },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
  },
  inputError: { borderColor: '#E53935' },
  error: { fontSize: 12, color: '#E53935' },
  termsContainer: { marginTop: 24, marginBottom: 24 },
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
  termsText: { fontSize: 14, color: '#444' },
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
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
