import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useServices } from '../../context/ServicesContext';

export default function AddItemScreen() {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const { addItem, categories } = useServices();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [weight, setWeight] = useState('');
  const [duration, setDuration] = useState('');
  const [unit, setUnit] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const targetCategoryId =
    selectedCatId || categoryId || categories[0]?.id || '';
  const targetCategory = categories.find((c) => c.id === targetCategoryId);
  const isWash = targetCategory?.id === 'wash' || targetCategory?.name.toLowerCase().includes('wash');
  const isDry = targetCategory?.id === 'dry' || targetCategory?.name.toLowerCase().includes('dry');
  const isIron = targetCategory?.id?.startsWith('iron') || targetCategory?.name.toLowerCase().includes('iron');
  const isFold = targetCategory?.id === 'fold' || targetCategory?.name.toLowerCase().includes('fold');
  const isOther = targetCategory && !isWash && !isDry && !isIron && !isFold;

  useEffect(() => {
    if (categoryId) setSelectedCatId(categoryId);
    else if (categories[0]?.id) setSelectedCatId(categories[0].id);
  }, [categoryId, categories]);

  // Pre-fill unit เมื่อเลือก category แบบ Other ที่มี defaultUnit
  useEffect(() => {
    if (isOther && targetCategory?.defaultUnit) {
      setUnit(targetCategory.defaultUnit);
    } else if (!isOther) {
      setUnit('');
    }
  }, [targetCategoryId, targetCategory?.defaultUnit, isOther]);

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed || !targetCategoryId) return;
    const priceNum = price.trim() ? parseFloat(price) : undefined;
    const weightNum = weight.trim() ? parseInt(weight, 10) : undefined;
    const durationNum = duration.trim() ? parseInt(duration, 10) : undefined;

    addItem(targetCategoryId, trimmed, {
      description: isOther ? undefined : (description.trim() || undefined),
      price: priceNum,
      weight: weightNum,
      duration: durationNum,
      unit: unit.trim() || undefined,
    });
    router.replace('/services');
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <Text style={s.label}>Category</Text>
        <TouchableOpacity
          style={s.selectRow}
          onPress={() => setShowCategoryPicker(true)}
        >
          <Text
            style={[
              s.selectText,
              !targetCategoryId && s.selectPlaceholder,
            ]}
          >
            {targetCategory?.name ?? 'Select Category'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        <Text style={s.label}>Service Name</Text>
        <TextInput
          style={s.input}
          placeholder={isWash || isDry ? 'e.g. Cold, Warm water ≈ 40°' : isOther ? 'e.g. ซักแห้ง' : 'Service Name'}
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        {(isWash || isDry) && (
          <>
            <Text style={s.label}>น้ำหนัก (kg)</Text>
            <TextInput
              style={s.input}
              placeholder={isWash ? 'e.g. 9, 14, 18' : 'e.g. 15, 25'}
              placeholderTextColor={Colors.textMuted}
              value={weight}
              onChangeText={setWeight}
              keyboardType="number-pad"
            />
            <Text style={s.label}>ระยะเวลา (นาที)</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. 35"
              placeholderTextColor={Colors.textMuted}
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
            />
          </>
        )}

        {isOther && (
          <>
            <Text style={s.label}>หน่วย</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. ชิ้น, กก., ตร.ม., คู่, ผืน, ใบ, เม็ด"
              placeholderTextColor={Colors.textMuted}
              value={unit}
              onChangeText={setUnit}
            />
          </>
        )}

        {!isOther && (
          <>
            <Text style={s.label}>Description</Text>
            <TextInput
              style={[s.input, s.inputMultiline]}
              placeholder="Description"
              placeholderTextColor={Colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </>
        )}

        <Text style={s.label}>Price</Text>
        <TextInput
          style={s.input}
          placeholder="Enter price"
          placeholderTextColor={Colors.textMuted}
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />

        <Modal
          visible={showCategoryPicker}
          transparent
          animationType="fade"
        >
          <View style={s.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => setShowCategoryPicker(false)}>
              <View style={s.modalBackdrop} />
            </TouchableWithoutFeedback>
            <View style={s.pickerSheet}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={s.pickerItem}
                  onPress={() => {
                    setSelectedCatId(c.id);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={s.pickerItemText}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        <TouchableOpacity
          style={[s.addBtn, !name.trim() && s.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!name.trim()}
        >
          <Text style={s.addBtnText}>Add Service</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
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
    marginBottom: 16,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  selectText: { fontSize: 16, color: Colors.textPrimary },
  selectPlaceholder: { color: Colors.textMuted },
  addBtn: {
    backgroundColor: Colors.primaryBlue,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32,
  },
  pickerItem: {
    padding: 16,
  },
  pickerItemText: { fontSize: 16, color: Colors.textPrimary },
});
