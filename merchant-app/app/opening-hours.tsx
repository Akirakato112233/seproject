import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useShop } from '../context/ShopContext';

const DAY_LABELS: { value: number; label: string }[] = [
  { value: 1, label: 'จันทร์' },
  { value: 2, label: 'อังคาร' },
  { value: 3, label: 'พุธ' },
  { value: 4, label: 'พฤหัสบดี' },
  { value: 5, label: 'ศุกร์' },
  { value: 6, label: 'เสาร์' },
  { value: 7, label: 'อาทิตย์' },
];

function parseTime(s: string): string {
  const trimmed = (s || '').trim();
  if (!trimmed) return '08:00';
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const h = Math.min(23, Math.max(0, parseInt(match[1], 10)));
    const m = Math.min(59, Math.max(0, parseInt(match[2], 10)));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return trimmed.length <= 5 ? trimmed : '08:00';
}

export default function OpeningHoursScreen() {
  const router = useRouter();
  const { shop, updateShop } = useShop();
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [open, setOpen] = useState('08:00');
  const [close, setClose] = useState('19:00');
  const [saving, setSaving] = useState(false);

  const existing = shop?.openingHours ?? [];

  useEffect(() => {
    if (existing.length > 0 && existing[0]) {
      const first = existing[0];
      setDays(first.days ?? [1, 2, 3, 4, 5]);
      setOpen(first.open ?? '08:00');
      setClose(first.close ?? '19:00');
    }
  }, [shop?._id, shop?.openingHours?.length]);

  const toggleDay = (d: number) => {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)
    );
  };

  const handleSave = async () => {
    if (!shop) return;
    const openNorm = parseTime(open);
    const closeNorm = parseTime(close);
    setSaving(true);
    const openingHours =
      days.length === 0
        ? []
        : [{ days: [...days], open: openNorm, close: closeNorm }];
    const ok = await updateShop({ openingHours });
    setSaving(false);
    if (ok) router.replace('/(tabs)/settings');
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Pressable
          onPress={() => router.replace('/(tabs)/settings')}
          style={s.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </Pressable>
        <Text style={s.headerTitle}>จัดการเวลาเปิด-ปิด</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <Text style={s.sectionTitle}>เลือกวัน</Text>
        <View style={s.dayRow}>
          {DAY_LABELS.map(({ value, label }) => (
            <TouchableOpacity
              key={value}
              onPress={() => toggleDay(value)}
              style={[s.dayChip, days.includes(value) && s.dayChipActive]}
            >
              <Text style={[s.dayChipText, days.includes(value) && s.dayChipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>เวลาเปิด - ปิด</Text>
        <View style={s.timeRow}>
          <TextInput
            style={s.timeInput}
            value={open}
            onChangeText={setOpen}
            placeholder="08:00"
            placeholderTextColor={Colors.textMuted}
          />
          <Text style={s.timeSeparator}>–</Text>
          <TextInput
            style={s.timeInput}
            value={close}
            onChangeText={setClose}
            placeholder="19:00"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <Text style={s.hint}>รูปแบบ HH:mm (เช่น 08:00, 19:00)</Text>

        <TouchableOpacity
          style={[s.saveBtn, saving && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={s.saveBtnText}>บันทึก</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cardBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBlue,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  backBtn: { padding: 12 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 20,
    marginBottom: 10,
  },
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  dayChipActive: {
    backgroundColor: Colors.primaryBlue,
    borderColor: Colors.primaryBlue,
  },
  dayChipText: { fontSize: 14, color: Colors.textPrimary },
  dayChipTextActive: { color: Colors.white, fontWeight: '600' },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  timeSeparator: { fontSize: 18, color: Colors.textSecondary },
  hint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },
  saveBtn: {
    marginTop: 28,
    backgroundColor: Colors.primaryBlue,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
