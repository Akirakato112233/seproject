import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../style/myStyle';

interface CheckboxRowProps {
  icon: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}

export const CheckboxRow: React.FC<CheckboxRowProps> = ({ icon, label, selected, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.rowLeft}>
      <Ionicons name={icon as any} size={22} color="#333" style={{ marginRight: 15 }} />
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <View style={[styles.checkbox, selected && styles.checkboxActive]}>
      {selected && <Ionicons name="checkmark" size={16} color="white" />}
    </View>
  </TouchableOpacity>
);
