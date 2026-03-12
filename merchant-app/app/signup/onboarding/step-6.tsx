import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { step6Schema } from '../../../lib/registrationSchemas';
import { useRegistrationStore, build24hBusinessHours } from '../../../stores/registrationStore';
import { z } from 'zod';

type Step6Form = z.infer<typeof step6Schema>;

const DAYS_SHORT = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
const DAYS_FULL = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

export default function Step6Screen() {
  const router = useRouter();
  const { formData, updateForm, setStep, merchantUserId, businessType } = useRegistrationStore();
  const [selectedDays, setSelectedDays] = useState<number[]>(() => {
    const hours = formData.business_hours || [];
    if (hours.length === 0) return [0, 1, 2, 3, 4, 5];
    return hours
      .map((h, i) => (h.is_open ? i : -1))
      .filter((i) => i >= 0);
  });
  const [openTime, setOpenTime] = useState(
    formData.business_hours?.[0]?.open_time || '08:00'
  );
  const [closeTime, setCloseTime] = useState(
    formData.business_hours?.[0]?.close_time || '20:00'
  );

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Step6Form>({
    resolver: zodResolver(step6Schema),
    defaultValues: {
      business_hours: formData.business_hours || DAYS_FULL.map((day) => ({
        day,
        is_open: day !== 'อาทิตย์',
        open_time: '08:00',
        close_time: '20:00',
      })),
      cut_off_time: formData.cut_off_time || '18:00',
    },
  });

  useEffect(() => {
    if (businessType === 'coin') {
      const hours = build24hBusinessHours();
      updateForm({
        business_hours: hours,
        cut_off_time: formData.cut_off_time || '18:00',
      });
    setStep(6);
    router.replace('/signup/onboarding/step-7');
      return;
    }
    setStep(5);
  }, [businessType, formData.cut_off_time, router, setStep, updateForm]);

  // coin flow uses step 6 for step-7 screen

  const toggleDay = (idx: number) => {
    setSelectedDays((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx].sort((a, b) => a - b)
    );
  };

  const selectAllDays = () => {
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  };

  const selectWeekdayWeekend = () => {
    setSelectedDays([0, 1, 2, 3, 4]); // จ-ศ
  };

  const onNext = handleSubmit(async (data) => {
    const hours = DAYS_FULL.map((day, idx) => ({
      day,
      is_open: selectedDays.includes(idx),
      open_time: openTime,
      close_time: closeTime,
    }));
    setValue('business_hours', hours);
    const nextForm = {
      ...formData,
      business_hours: hours,
      cut_off_time: data.cut_off_time,
    };
    updateForm(nextForm);
    setStep(7);
    router.push('/signup/onboarding/step-7');
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
          <Text style={s.title}>เวลาทำการ</Text>
          <Text style={s.subtitle}>ขั้นตอนที่ 5 จาก 8</Text>

          <View style={s.actions}>
            <TouchableOpacity style={s.actionBtn} onPress={selectAllDays}>
              <Text style={s.actionText}>ใช้เวลาเดิมทุกวัน</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={selectWeekdayWeekend}>
              <Text style={s.actionText}>วันธรรมดา/หยุด</Text>
            </TouchableOpacity>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>เลือกวัน</Text>
            <View style={s.dayRow}>
              {DAYS_SHORT.map((day, idx) => (
                <TouchableOpacity
                  key={day}
                  style={[s.dayBtn, selectedDays.includes(idx) && s.dayBtnSelected]}
                  onPress={() => toggleDay(idx)}
                >
                  <Text
                    style={[
                      s.dayBtnText,
                      selectedDays.includes(idx) && s.dayBtnTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>เวลาเปิด - ปิด</Text>
            <View style={s.timeRow}>
              <TextInput
                style={s.timeInput}
                value={openTime}
                onChangeText={setOpenTime}
                placeholder="08:00"
              />
              <Text style={s.dash}>–</Text>
              <TextInput
                style={s.timeInput}
                value={closeTime}
                onChangeText={setCloseTime}
                placeholder="20:00"
              />
            </View>
            <Text style={s.formatHint}>รูปแบบ HH:mm (เช่น 08:00, 19:00)</Text>
          </View>

          <View style={s.field}>
            <Text style={s.label}>เวลารับออเดอร์ล่าสุด (HH:MM)</Text>
            <Controller
              control={control}
              name="cut_off_time"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={s.timeInputFull}
                  value={value || '18:00'}
                  onChangeText={onChange}
                  placeholder="18:00"
                />
              )}
            />
            <Text style={s.formatHint}>รูปแบบ HH:mm (เช่น 18:00)</Text>
          </View>
        </ScrollView>

        <StepNav
          step={5}
          total={8}
          onBack={() => {
            setStep(4);
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
  actions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
  },
  actionText: { fontSize: 13, color: '#0E3A78', fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dayBtnSelected: {
    backgroundColor: '#0E3A78',
    borderColor: '#0E3A78',
  },
  dayBtnText: { fontSize: 14, color: '#333', fontWeight: '500' },
  dayBtnTextSelected: { color: '#fff', fontWeight: '600' },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
  },
  dash: { fontSize: 16, color: '#666', fontWeight: '500' },
  formatHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  field: { marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 8 },
  timeInputFull: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
  },
});
