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
import { StepNav } from '../../../components/registration/StepNav';
import { step4Schema } from '../../../lib/registrationSchemas';
import { useRegistrationStore } from '../../../stores/registrationStore';
import { z } from 'zod';

type Step4Form = z.infer<typeof step4Schema>;

export default function Step4Screen() {
  const router = useRouter();
  const { formData, updateForm, setStep, merchantUserId } = useRegistrationStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Step4Form>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      bank_name: formData.bank_name || 'truemoney',
      account_number: formData.account_number || '',
      account_name: formData.account_name || '',
      account_type: formData.account_type || 'savings',
    },
  });

  useEffect(() => {
    setStep(4);
  }, []);

  const onNext = handleSubmit(async (data) => {
    const nextForm = {
      ...formData,
      bank_name: 'truemoney',
      account_number: data.account_number.replace(/\D/g, ''),
      account_name: data.account_name,
      account_type: 'savings',
    };
    updateForm(nextForm);
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
          <Text style={s.title}>รับเป็น TrueMoney</Text>
          <Text style={s.subtitle}>ขั้นตอนที่ 4 จาก 9</Text>

          <View style={s.infoBox}>
            <Text style={s.infoText}>
              เงินจะโอนเข้าบัญชีนี้ทุกรอบ 7 วัน หลังหักค่าคอมมิชชั่น
            </Text>
          </View>

          <View style={s.form}>
            <View style={s.field}>
              <Text style={s.label}>ช่องทางรับเงิน</Text>
              <View style={s.channelPill}>
                <Text style={s.channelPillText}>TrueMoney Wallet (เบอร์มือถือ)</Text>
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>เบอร์ทรูมันนี่ *</Text>
              <Controller
                control={control}
                name="account_number"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, errors.account_number && s.inputError]}
                    placeholder="เบอร์โทร 10 หลัก"
                    value={value}
                    onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, 10))}
                    onBlur={onBlur}
                    keyboardType="phone-pad"
                  />
                )}
              />
              {errors.account_number && (
                <Text style={s.error}>{errors.account_number.message}</Text>
              )}
            </View>

            <View style={s.field}>
              <Text style={s.label}>ชื่อผู้รับ *</Text>
              <Controller
                control={control}
                name="account_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, errors.account_name && s.inputError]}
                    placeholder="ชื่อจริงของเจ้าของบัญชี TrueMoney"
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
  channelPill: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#0E3A78',
  },
  channelPillText: { fontSize: 14, color: '#fff', fontWeight: '600' },
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
