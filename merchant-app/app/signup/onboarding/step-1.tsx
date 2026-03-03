import { useRouter } from 'expo-router';
import { useEffect } from 'react';
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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { step1Schema, formatPhoneDisplay, type step1SchemaType } from '../../../lib/registrationSchemas';
import { StepNav } from '../../../components/registration/StepNav';
import { useRegistrationStore } from '../../../stores/registrationStore';
import { saveRegistration } from '../../../lib/registrationApi';

export default function Step1Screen() {
  const router = useRouter();
  const { formData, updateForm, setStep, prefillEmail, prefillDisplayName, prefillPhone, merchantUserId } =
    useRegistrationStore();

  const names = (prefillDisplayName || '').trim().split(/\s+/);
  const defaultFirstName = names[0] || formData.owner_first_name || '';
  const defaultLastName = names.slice(1).join(' ') || formData.owner_last_name || '';

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<step1SchemaType>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      shop_name: formData.shop_name || '',
      phone: formData.phone || prefillPhone?.replace(/^\+66/, '0') || '',
      email: formData.email || prefillEmail || '',
      owner_first_name: formData.owner_first_name || defaultFirstName,
      owner_last_name: formData.owner_last_name || defaultLastName,
      owner_phone: formData.owner_phone || '',
    },
  });

  useEffect(() => {
    setStep(1);
  }, []);

  const onNext = handleSubmit(async (data) => {
    const phoneDigits = data.phone.replace(/\D/g, '');
    const nextForm = {
      ...formData,
      shop_name: data.shop_name,
      phone: phoneDigits.length >= 10 ? `0${phoneDigits.slice(-9)}` : data.phone,
      email: data.email,
      owner_first_name: data.owner_first_name,
      owner_last_name: data.owner_last_name,
      owner_phone: data.owner_phone || undefined,
    };
    updateForm(nextForm);
    if (merchantUserId) {
      const ok = await saveRegistration(nextForm, merchantUserId, { convertImages: false });
      if (!ok.success) {
        Alert.alert('Error', ok.message || 'ไม่สามารถบันทึกได้');
        return;
      }
    }
    setStep(2);
    router.push('/signup/onboarding/step-2');
  });

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
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
          <Text style={s.subtitle}>ขั้นตอนที่ 1 จาก 9</Text>

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
        </ScrollView>

        <StepNav
          step={1}
          total={9}
          onBack={() => router.back()}
          onNext={onNext}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
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
});
