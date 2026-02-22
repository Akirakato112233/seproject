import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const THAI_TO_DAY: Record<string, string> = {
  'จันทร์': 'Mon', 'อังคาร': 'Tue', 'พุธ': 'Wed', 'พฤหัสบดี': 'Thu',
  'ศุกร์': 'Fri', 'เสาร์': 'Sat', 'อาทิตย์': 'Sun',
};

function daysFromStore(
  raw: number[] | string[] | undefined
): string[] {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const first = raw[0];
  if (typeof first === 'number') {
    return (raw as number[]).map((n) => DAY_NAMES[Math.max(0, n - 1)] ?? String(n));
  }
  return (raw as string[]).map((d) => THAI_TO_DAY[d] ?? d);
}

/** Valid time: HH:mm, 00:00–24:00 (24:00 = end of day, minutes must be 00) */
function isValidTime(s: string): boolean {
  const trimmed = (s || '').trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return false;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 24) return false;
  if (h === 24) return m === 0;
  return m >= 0 && m <= 59;
}

function parseTime(s: string): string {
  const trimmed = (s || '').trim();
  if (!trimmed) return '08:00';
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    let h = parseInt(match[1], 10);
    let m = parseInt(match[2], 10);
    if (h === 24 && m === 0) return '24:00';
    h = Math.min(23, Math.max(0, h));
    m = Math.min(59, Math.max(0, m));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return trimmed.length <= 5 ? trimmed : '08:00';
}

export default function OpeningHoursScreen() {
  const router = useRouter();
  const { shop, updateShop } = useShop();
  const [days, setDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [open, setOpen] = useState('08:00');
  const [close, setClose] = useState('19:00');
  const [saving, setSaving] = useState(false);

  const existing = shop?.openingHours ?? [];

  useEffect(() => {
    if (existing.length > 0 && existing[0]) {
      const first = existing[0];
      setDays(daysFromStore(first.days));
      setOpen(first.open ?? '08:00');
      setClose(first.close ?? '19:00');
    }
  }, [shop?._id, shop?.openingHours?.length]);

  const toggleDay = (dayName: string) => {
    setDays((prev) => {
      const next = prev.includes(dayName) ? prev.filter((x) => x !== dayName) : [...prev, dayName];
      return DAY_NAMES.filter((d) => next.includes(d));
    });
  };

  const handleSave = async () => {
    if (!shop) return;
    if (!isValidTime(open) || !isValidTime(close)) {
      Alert.alert(
        'Invalid time',
        'Please enter open and close time in HH:mm format (00:00–24:00). For example: 08:00, 23:00.',
        [{ text: 'OK' }]
      );
      return;
    }
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
        <Text style={s.headerTitle}>Opening Hours</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <Text style={s.sectionTitle}>Select Day</Text>
        <View style={s.dayRow}>
          {DAY_NAMES.map((dayName) => (
            <TouchableOpacity
              key={dayName}
              onPress={() => toggleDay(dayName)}
              style={[s.dayChip, days.includes(dayName) && s.dayChipActive]}
            >
              <Text style={[s.dayChipText, days.includes(dayName) && s.dayChipTextActive]}>
                {dayName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>Open – Close Time</Text>
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
        <Text style={s.hint}>Format HH:mm (e.g. 08:00, 19:00)</Text>

        <TouchableOpacity
          style={[s.saveBtn, saving && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={s.saveBtnText}>Save</Text>
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
