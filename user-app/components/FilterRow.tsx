import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../style/myStyle';

interface FilterRowProps {
  icon?: React.ReactNode;
  label: string;
  selected: boolean;
  onPress: () => void;
}

export const FilterRow: React.FC<FilterRowProps> = ({ icon, label, selected, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.rowLeft}>
      {icon && <View style={styles.iconBox}>{icon}</View>}
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <View style={[styles.radioOuter, selected && styles.radioActive]}>
      {selected && <View style={styles.radioInner} />}
    </View>
  </TouchableOpacity>
);
