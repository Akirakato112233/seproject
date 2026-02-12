import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useServices } from '../../context/ServicesContext';

export default function AddCategoryScreen() {
  const router = useRouter();
  const { addCategory } = useServices();
  const [name, setName] = useState('');

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (trimmed) {
      addCategory(trimmed);
      router.replace('/services');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <View style={s.content}>
        <Text style={s.label}>Category Name</Text>
        <TextInput
          style={s.input}
          placeholder="Laundry"
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TouchableOpacity
          style={[s.confirmBtn, !name.trim() && s.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!name.trim()}
        >
          <Text style={s.confirmBtnText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  content: { flex: 1, padding: 24 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 24,
  },
  confirmBtn: {
    backgroundColor: Colors.primaryBlue,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
