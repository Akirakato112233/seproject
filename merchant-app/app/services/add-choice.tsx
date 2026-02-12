import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

export default function AddChoiceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <View style={s.content}>
        <TouchableOpacity
          style={s.optionRow}
          onPress={() => router.push('/services/add-item')}
          activeOpacity={0.7}
        >
          <View>
            <Text style={s.optionTitle}>Add Item</Text>
            <Text style={s.optionPlaceholder}>e.g. Cold Wash</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={s.divider} />
        <TouchableOpacity
          style={s.optionRow}
          onPress={() => router.push('/services/add-category')}
        >
          <View>
            <Text style={s.optionTitle}>Add Category</Text>
            <Text style={s.optionPlaceholder}>e.g. Drying, Ironing</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  content: {
    margin: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  optionPlaceholder: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.cardBorder, marginLeft: 16 },
});
