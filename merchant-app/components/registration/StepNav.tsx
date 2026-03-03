import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface StepNavProps {
  step: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
}

export function StepNav({
  step,
  total,
  onBack,
  onNext,
  nextLabel = 'ถัดไป',
  nextDisabled,
  nextLoading,
}: StepNavProps) {
  return (
    <View style={s.row}>
      <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.8}>
        <Text style={s.backText}>ย้อนกลับ</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[s.nextBtn, nextDisabled && s.nextDisabled]}
        onPress={onNext}
        disabled={nextDisabled || nextLoading}
        activeOpacity={0.85}
      >
        {nextLoading ? (
          <Text style={s.nextText}>กำลังบันทึก...</Text>
        ) : (
          <Text style={s.nextText}>{nextLabel}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 100,
  },
  backText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  nextBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0E3A78',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 200,
  },
  nextDisabled: { opacity: 0.5 },
  nextText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
