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
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ImagePickerField } from '../../../components/registration/ImagePickerField';
import { StepNav } from '../../../components/registration/StepNav';
import { step4Schema } from '../../../lib/registrationSchemas';
import { useRegistrationStore } from '../../../stores/registrationStore';
import { saveRegistration } from '../../../lib/registrationApi';
import { z } from 'zod';

type Step4Form = z.infer<typeof step4Schema>;

const BANKS = [
  { id: 'KBANK', name: 'กสิกรไทย' },
  { id: 'KTB', name: 'กรุงไทย' },
  { id: 'SCB', name: 'ไทยพาณิชย์' },
  { id: 'BAY', name: 'กรุงศรี' },
  { id: 'BBL', name: 'กรุงเทพ' },
  { id: 'TTB', name: 'ทหารไทย' },
  { id: 'GSB', name: 'ออมสิน' },
  { id: 'BAAC', name: 'ธ.ก.ส.' },
];

export default function Step4Screen() {
  const router = useRouter();
  const { formData, updateForm, setStep, merchantUserId } = useRegistrationStore();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Step4Form>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      bank_name: formData.bank_name || '',
      account_number: formData.account_number || '',
      account_name: formData.account_name || '',
      account_type: formData.account_type,
      bank_book_image: formData.bank_book_image || '',
    },
  });

  const bankName = watch('bank_name');

  useEffect(() => {
    setStep(4);
  }, []);

  const onNext = handleSubmit(async (data) => {
    const nextForm = {
      ...formData,
      bank_name: data.bank_name,
      account_number: data.account_number.replace(/\D/g, ''),
      account_name: data.account_name,
      account_type: data.account_type,
      bank_book_image: data.bank_book_image,
    };
    updateForm(nextForm);
    if (merchantUserId) {
      const ok = await saveRegistration(nextForm, merchantUserId, { convertImages: true });
      if (!ok.success) {
        Alert.alert('Error', ok.message || 'ไม่สามารถบันทึกได้');
        return;
      }
    }
    setStep(5);
    router.push('/signup/onboarding/step-5');
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
          <Text style={s.title}>บัญชีธนาคาร</Text>
          <Text style={s.subtitle}>ขั้นตอนที่ 4 จาก 9</Text>

          <View style={s.infoBox}>
            <Text style={s.infoText}>
              เงินจะโอนเข้าบัญชีนี้ทุกรอบ 7 วัน หลังหักค่าคอมมิชชั่น
            </Text>
          </View>

          <View style={s.form}>
            <View style={s.field}>
              <Text style={s.label}>ธนาคาร *</Text>
              <View style={s.bankGrid}>
                {BANKS.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[s.bankBtn, bankName === b.id && s.bankBtnActive]}
                    onPress={() => setValue('bank_name', b.id)}
                  >
                    <Text style={[s.bankText, bankName === b.id && s.bankTextActive]}>
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.bank_name && (
                <Text style={s.error}>{errors.bank_name.message}</Text>
              )}
            </View>

            <View style={s.field}>
              <Text style={s.label}>เลขบัญชี *</Text>
              <Controller
                control={control}
                name="account_number"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, errors.account_number && s.inputError]}
                    placeholder="10-12 หลัก"
                    value={value}
                    onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, 12))}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                  />
                )}
              />
              {errors.account_number && (
                <Text style={s.error}>{errors.account_number.message}</Text>
              )}
            </View>

            <View style={s.field}>
              <Text style={s.label}>ชื่อบัญชี *</Text>
              <Controller
                control={control}
                name="account_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, errors.account_name && s.inputError]}
                    placeholder="ต้องตรงกับชื่อบนบัตรประชาชน"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              {errors.account_name && (
                <Text style={s.error}>{errors.account_name.message}</Text>
              )}
            </View>

            <View style={s.field}>
              <Text style={s.label}>ประเภทบัญชี *</Text>
              <View style={s.toggleRow}>
                <Controller
                  control={control}
                  name="account_type"
                  render={({ field: { onChange, value } }) => (
                    <>
                      <TouchableOpacity
                        style={[s.toggle, value === 'savings' && s.toggleActive]}
                        onPress={() => onChange('savings')}
                      >
                        <Text style={[s.toggleText, value === 'savings' && s.toggleTextActive]}>
                          ออมทรัพย์
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.toggle, value === 'current' && s.toggleActive]}
                        onPress={() => onChange('current')}
                      >
                        <Text style={[s.toggleText, value === 'current' && s.toggleTextActive]}>
                          กระแสรายวัน
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                />
              </View>
              {errors.account_type && (
                <Text style={s.error}>{errors.account_type.message}</Text>
              )}
            </View>

            <Controller
              control={control}
              name="bank_book_image"
              render={({ field: { onChange, value } }) => (
                <ImagePickerField
                  label="สมุดบัญชีหน้าแรก *"
                  value={value}
                  onChange={onChange}
                  error={errors.bank_book_image?.message}
                />
              )}
            />
          </View>
        </ScrollView>

        <StepNav
          step={4}
          total={9}
          onBack={() => {
            setStep(3);
            router.back();
          }}
          onNext={onNext}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  title: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: { fontSize: 13, color: '#1565C0' },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#333' },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bankBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  bankBtnActive: { backgroundColor: '#0E3A78', borderColor: '#0E3A78' },
  bankText: { fontSize: 14, color: '#333' },
  bankTextActive: { color: '#fff', fontWeight: '600' },
  toggleRow: { flexDirection: 'row', gap: 12 },
  toggle: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  toggleActive: { backgroundColor: '#0E3A78', borderColor: '#0E3A78' },
  toggleText: { fontSize: 15, color: '#666' },
  toggleTextActive: { color: '#fff', fontWeight: '600' },
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
