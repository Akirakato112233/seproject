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
import { ImagePickerField } from '../../../components/registration/ImagePickerField';
import { StepNav } from '../../../components/registration/StepNav';
import { step2Schema, formatIdNumber } from '../../../lib/registrationSchemas';
import { useRegistrationStore } from '../../../stores/registrationStore';
import { saveRegistration } from '../../../lib/registrationApi';
import { z } from 'zod';

type Step2Form = z.infer<typeof step2Schema>;

export default function Step2Screen() {
  const router = useRouter();
  const { formData, updateForm, setStep, merchantUserId } = useRegistrationStore();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      id_card_front: formData.id_card_front || '',
      id_card_back: formData.id_card_back || '',
      selfie_with_id: formData.selfie_with_id || '',
      id_number: formData.id_number || '',
      first_name: formData.first_name || formData.owner_first_name || '',
      last_name: formData.last_name || formData.owner_last_name || '',
      date_of_birth: formData.date_of_birth || '',
      address_on_card: formData.address_on_card || '',
    },
  });

  useEffect(() => {
    setStep(2);
  }, []);

  const onNext = handleSubmit(async (data) => {
    const nextForm = {
      ...formData,
      id_card_front: data.id_card_front,
      id_card_back: data.id_card_back,
      selfie_with_id: data.selfie_with_id,
      id_number: data.id_number.replace(/\D/g, ''),
      first_name: data.first_name,
      last_name: data.last_name,
      date_of_birth: data.date_of_birth,
      address_on_card: data.address_on_card,
    };
    updateForm(nextForm);
    if (merchantUserId) {
      const ok = await saveRegistration(nextForm, merchantUserId, { convertImages: true });
      if (!ok.success) {
        Alert.alert('Error', ok.message || 'ไม่สามารถบันทึกได้');
        return;
      }
    }
    setStep(3);
    router.push('/signup/onboarding/step-3');
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
          <Text style={s.title}>บัตรประชาชน</Text>
          <Text style={s.subtitle}>ขั้นตอนที่ 2 จาก 9</Text>

          <View style={s.form}>
            <Controller
              control={control}
              name="id_card_front"
              render={({ field: { onChange, value } }) => (
                <ImagePickerField
                  label="รูปบัตรประชาชนด้านหน้า *"
                  value={value}
                  onChange={onChange}
                  error={errors.id_card_front?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="id_card_back"
              render={({ field: { onChange, value } }) => (
                <ImagePickerField
                  label="รูปบัตรประชาชนด้านหลัง *"
                  value={value}
                  onChange={onChange}
                  error={errors.id_card_back?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="selfie_with_id"
              render={({ field: { onChange, value } }) => (
                <ImagePickerField
                  label="เซลฟี่พร้อมบัตร *"
                  value={value}
                  onChange={onChange}
                  error={errors.selfie_with_id?.message}
                  useCamera
                />
              )}
            />

            <View style={s.field}>
              <Text style={s.label}>เลขบัตรประชาชน *</Text>
              <Controller
                control={control}
                name="id_number"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, errors.id_number && s.inputError]}
                    placeholder="X-XXXX-XXXXX-XX-X"
                    value={formatIdNumber(value || '')}
                    onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, 13))}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                  />
                )}
              />
              <Text style={s.hint}>
                กรอก 13 หลัก (เลข 0-9 เท่านั้น) ระบบจัดรูปแบบอัตโนมัติ ต้องผ่านการตรวจสอบบัตรประชาชน
              </Text>
              {errors.id_number && (
                <Text style={s.error}>{errors.id_number.message}</Text>
              )}
            </View>

            <View style={s.row}>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={s.label}>ชื่อ *</Text>
                <Controller
                  control={control}
                  name="first_name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[s.input, errors.first_name && s.inputError]}
                      placeholder="ชื่อ"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
                {errors.first_name && (
                  <Text style={s.error}>{errors.first_name.message}</Text>
                )}
              </View>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={s.label}>นามสกุล *</Text>
                <Controller
                  control={control}
                  name="last_name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[s.input, errors.last_name && s.inputError]}
                      placeholder="นามสกุล"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
                {errors.last_name && (
                  <Text style={s.error}>{errors.last_name.message}</Text>
                )}
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>วันเกิด *</Text>
              <Controller
                control={control}
                name="date_of_birth"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, errors.date_of_birth && s.inputError]}
                    placeholder="YYYY-MM-DD (เช่น 2001-04-30)"
                    value={value || ''}
                    onChangeText={(t) => {
                      const cleaned = t.replace(/\D/g, '').slice(0, 8);
                      if (cleaned.length <= 4) {
                        onChange(cleaned);
                      } else if (cleaned.length <= 6) {
                        onChange(`${cleaned.slice(0, 4)}-${cleaned.slice(4)}`);
                      } else {
                        onChange(`${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6)}`);
                      }
                    }}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                  />
                )}
              />
              <Text style={s.hint}>ใช้ปี ค.ศ. เท่านั้น (กรอกปี-เดือน-วัน รวม 8 หลัก เช่น 20050202)</Text>
              {errors.date_of_birth && (
                <Text style={s.error}>{errors.date_of_birth.message}</Text>
              )}
            </View>

            <View style={s.field}>
              <Text style={s.label}>ที่อยู่ตามบัตร *</Text>
              <Controller
                control={control}
                name="address_on_card"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, s.textarea, errors.address_on_card && s.inputError]}
                    placeholder="ที่อยู่ตามบัตรประชาชน"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    numberOfLines={3}
                  />
                )}
              />
              {errors.address_on_card && (
                <Text style={s.error}>{errors.address_on_card.message}</Text>
              )}
            </View>
          </View>
        </ScrollView>

        <StepNav
          step={2}
          total={9}
          onBack={() => {
            setStep(1);
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
  form: { gap: 20 },
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
  hint: { fontSize: 12, color: '#666', marginTop: 4 },
  textarea: { height: 80, paddingTop: 12 },
  inputError: { borderColor: '#E53935' },
  error: { fontSize: 12, color: '#E53935' },
});
