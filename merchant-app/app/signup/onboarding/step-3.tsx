import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
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
import { step3Schema, formatTaxId } from '../../../lib/registrationSchemas';
import { useRegistrationStore } from '../../../stores/registrationStore';
import { z } from 'zod';

type Step3Form = z.infer<typeof step3Schema>;

export default function Step3Screen() {
  const router = useRouter();
  const { formData, updateForm, setStep, merchantUserId } = useRegistrationStore();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Step3Form>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      business_type: formData.business_type,
      tax_id: formData.tax_id || '',
      registered_name: formData.registered_name || '',
      registered_address: formData.registered_address || '',
      business_document: formData.business_document || '',
    },
  });

  const bizType = watch('business_type');

  useEffect(() => {
    setStep(3);
  }, []);

  const onNext = handleSubmit(async (data) => {
    const nextForm = {
      ...formData,
      business_type: data.business_type,
      tax_id: data.tax_id.replace(/\D/g, ''),
      registered_name: data.registered_name,
      registered_address: data.registered_address,
      business_document: data.business_document,
    };
    updateForm(nextForm);
    setStep(4);
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
          <Text style={s.title}>เอกสารธุรกิจ</Text>
          <Text style={s.subtitle}>ขั้นตอนที่ 3 จาก 8</Text>

          <View style={s.note}>
            <Text style={s.noteText}>
              บุคคลธรรมดาที่ยังไม่ได้จดทะเบียน สามารถใช้สำเนาบัตรประชาชนแทนได้
            </Text>
          </View>

          <View style={s.form}>
            <View style={s.field}>
              <Text style={s.label}>ประเภทธุรกิจ *</Text>
              <View style={s.toggleRow}>
                <TouchableOpacity
                  style={[s.toggle, bizType === 'individual' && s.toggleActive]}
                  onPress={() => setValue('business_type', 'individual')}
                >
                  <Text style={[s.toggleText, bizType === 'individual' && s.toggleTextActive]}>
                    บุคคลธรรมดา
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.toggle, bizType === 'juristic' && s.toggleActive]}
                  onPress={() => setValue('business_type', 'juristic')}
                >
                  <Text style={[s.toggleText, bizType === 'juristic' && s.toggleTextActive]}>
                    นิติบุคคล
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.business_type && (
                <Text style={s.error}>{errors.business_type.message}</Text>
              )}
            </View>

            <View style={s.field}>
              <Text style={s.label}>เลขประจำตัวผู้เสียภาษี *</Text>
              <Controller
                control={control}
                name="tax_id"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, errors.tax_id && s.inputError]}
                    placeholder="X-XXXX-XXXXX-XX-X"
                    value={formatTaxId(value || '')}
                    onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, 13))}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                  />
                )}
              />
              {errors.tax_id && (
                <Text style={s.error}>{errors.tax_id.message}</Text>
              )}
            </View>

            <View style={s.field}>
              <Text style={s.label}>ชื่อจดทะเบียน *</Text>
              <Controller
                control={control}
                name="registered_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, errors.registered_name && s.inputError]}
                    placeholder="ชื่อตามเอกสารจดทะเบียน"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              {errors.registered_name && (
                <Text style={s.error}>{errors.registered_name.message}</Text>
              )}
            </View>

            <View style={s.field}>
              <Text style={s.label}>ที่อยู่จดทะเบียน *</Text>
              <Controller
                control={control}
                name="registered_address"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, s.textarea, errors.registered_address && s.inputError]}
                    placeholder="ที่อยู่ตามเอกสาร"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    numberOfLines={3}
                  />
                )}
              />
              {errors.registered_address && (
                <Text style={s.error}>{errors.registered_address.message}</Text>
              )}
            </View>

            <Controller
              control={control}
              name="business_document"
              render={({ field: { onChange, value } }) => (
                <ImagePickerField
                  label="ใบทะเบียนพาณิชย์ หรือ ใบเสียภาษี *"
                  value={value}
                  onChange={onChange}
                  error={errors.business_document?.message}
                />
              )}
            />
          </View>
        </ScrollView>

        <StepNav
          step={3}
          total={8}
          onBack={() => {
            setStep(2);
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
  note: {
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  noteText: { fontSize: 13, color: '#795548' },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#333' },
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
  textarea: { height: 80, paddingTop: 12 },
  inputError: { borderColor: '#E53935' },
  error: { fontSize: 12, color: '#E53935' },
});
