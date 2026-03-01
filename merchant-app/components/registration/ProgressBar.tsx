import { StyleSheet, View } from 'react-native';

interface ProgressBarProps {
  current: number;
  total?: number;
}

export function ProgressBar({ current, total = 9 }: ProgressBarProps) {
  const pct = Math.min(1, Math.max(0, current / total));
  return (
    <View style={s.wrap}>
      <View style={[s.fill, { width: `${pct * 100}%` }]} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    height: 4,
    backgroundColor: '#E8E8E8',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#0E3A78',
    borderRadius: 2,
  },
});
