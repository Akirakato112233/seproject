import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/colors';
import { StepNav } from '../../../components/registration/StepNav';
import { useRegistrationStore } from '../../../stores/registrationStore';
import { saveRegistration } from '../../../lib/registrationApi';
import { useAuth } from '../../../context/AuthContext';

export default function Step7Screen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    formData,
    updateForm,
    setStep,
    addServiceCategory,
    addServiceItem,
    removeServiceCategory,
    removeServiceItem,
  } = useRegistrationStore();
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addItemCatId, setAddItemCatId] = useState('');
  const [addItemCatName, setAddItemCatName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemWeight, setNewItemWeight] = useState('');
  const [newItemDuration, setNewItemDuration] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [deliveryFeeType, setDeliveryFeeType] = useState<'free' | 'by_distance' | 'fixed'>(
    formData.delivery_fee_type || 'free'
  );
  const [deliveryFixedPrice, setDeliveryFixedPrice] = useState(
    formData.delivery_fixed_price?.toString() || ''
  );
  const [standardDuration, setStandardDuration] = useState(
    formData.standard_duration_hours?.toString() || '24'
  );

  const categories = formData.service_categories || [];

  useEffect(() => {
    setStep(7);
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleDeleteCategory = (catName: string, catId: string) => {
    Alert.alert('ลบหมวด', `ต้องการลบหมวด "${catName}" และรายการทั้งหมดหรือไม่?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => removeServiceCategory(catId) },
    ]);
  };

  const handleDeleteItem = (itemName: string, catId: string, itemId: string) => {
    Alert.alert('ลบรายการ', `ต้องการลบ "${itemName}" หรือไม่?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => removeServiceItem(catId, itemId) },
    ]);
  };

  const onAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (trimmed) {
      addServiceCategory(trimmed);
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  };

  const onAddItem = () => {
    const trimmed = newItemName.trim();
    if (trimmed && addItemCatId) {
      addServiceItem(addItemCatId, trimmed, newItemPrice ? parseFloat(newItemPrice) : undefined, {
        weight_kg: newItemWeight.trim() || undefined,
        duration_minutes: newItemDuration.trim() || undefined,
        description: newItemDescription.trim() || undefined,
      });
      setNewItemName('');
      setNewItemWeight('');
      setNewItemDuration('');
      setNewItemDescription('');
      setNewItemPrice('');
      setShowAddItem(false);
    }
  };

  const hasAtLeastOneItemWithPrice = categories.some((c) =>
    c.items.some((i) => (i.price ?? 0) > 0)
  );

  const onNext = async () => {
    if (!hasAtLeastOneItemWithPrice) {
      Alert.alert('Error', 'กรุณาเพิ่มบริการอย่างน้อย 1 รายการและกรอกราคา');
      return;
    }

    const { merchantUserId: storeMerchantId, businessType } = useRegistrationStore.getState();
    const merchantUserId = storeMerchantId || user?._id || (user as { id?: string })?.id;
    if (!merchantUserId) {
      Alert.alert('Error', 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
      return;
    }

    setSubmitting(true);
    try {
      updateForm({
        delivery_fee_type: deliveryFeeType,
        delivery_fixed_price: deliveryFixedPrice ? parseFloat(deliveryFixedPrice) : undefined,
        standard_duration_hours: parseInt(standardDuration, 10) || 24,
      });

      const nextForm = useRegistrationStore.getState().formData;
      const ok = await saveRegistration(nextForm, merchantUserId, {
        convertImages: true,
        overrides: {
          businessType,
          delivery_fee_type: deliveryFeeType,
          delivery_fixed_price: deliveryFixedPrice ? parseFloat(deliveryFixedPrice) : undefined,
          standard_duration_hours: parseInt(standardDuration, 10) || 24,
        },
      });

      if (ok.success) {
        setStep(8);
        router.push('/signup/onboarding/step-8');
      } else {
        Alert.alert('Error', ok.message || 'Registration failed');
      }
    } catch (e: unknown) {
      const err = e as Error;
      console.error('Shop register error:', err);
      Alert.alert('Error', err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

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
          <Text style={s.title}>บริการและราคา</Text>
          <Text style={s.subtitle}>ขั้นตอนที่ 7 จาก 9</Text>

          <Text style={s.sectionTitle}>
            Services : ({categories.length} Categories)
          </Text>

          {categories.map((cat) => (
            <View key={cat.id} style={s.categoryBlock}>
              <View style={s.categoryRowWrap}>
                <TouchableOpacity
                  style={s.categoryRow}
                  onPress={() => toggleExpand(cat.id)}
                  activeOpacity={0.7}
                >
                  <Text style={s.categoryName}>{cat.name}</Text>
                  <View style={s.categoryRight}>
                    <Text style={s.itemCount}>
                      {cat.items.length} item{cat.items.length !== 1 ? 's' : ''}
                    </Text>
                    <Ionicons
                      name={expandedId === cat.id ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={Colors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>
                <Pressable
                  style={({ pressed }) => [s.deleteBtn, pressed && s.deleteBtnPressed]}
                  onPress={() => handleDeleteCategory(cat.name, cat.id)}
                  hitSlop={16}
                >
                  <Ionicons name="trash-outline" size={22} color="#dc2626" />
                </Pressable>
              </View>
              {expandedId === cat.id && (
                <View style={s.itemsList}>
                  {cat.items.length === 0 ? (
                    <Text style={s.emptyItems}>ยังไม่มีรายการ</Text>
                  ) : (
                    cat.items.map((item) => (
                      <View key={item.id} style={s.itemRow}>
                        <View style={s.itemInfo}>
                          <Text style={s.itemName}>{item.name}</Text>
                          {(item.weight_kg || item.duration_minutes) && (
                            <Text style={s.itemMeta}>
                              {[item.weight_kg && `${item.weight_kg} kg`, item.duration_minutes && `${item.duration_minutes} นาที`].filter(Boolean).join(' • ')}
                            </Text>
                          )}
                        </View>
                        {item.price != null && item.price > 0 && (
                          <Text style={s.itemPrice}>{item.price} บาท</Text>
                        )}
                        <Pressable
                          style={({ pressed }) => [s.itemDeleteBtn, pressed && { opacity: 0.6 }]}
                          onPress={() => handleDeleteItem(item.name, cat.id, item.id)}
                          hitSlop={12}
                        >
                          <Ionicons name="trash-outline" size={20} color="#dc2626" />
                        </Pressable>
                      </View>
                    ))
                  )}
                  <TouchableOpacity
                    style={s.addItemInCategory}
                    onPress={() => {
                      setAddItemCatId(cat.id);
                      setAddItemCatName(cat.name);
                      setNewItemName('');
                      setNewItemWeight('');
                      setNewItemDuration('');
                      setNewItemDescription('');
                      setNewItemPrice('');
                      setShowAddItem(true);
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={Colors.primaryBlue} />
                    <Text style={s.addItemText}>Add item in {cat.name}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={s.addBtn}
            onPress={() => {
              setNewCategoryName('');
              setShowAddCategory(true);
            }}
          >
            <Text style={s.addBtnText}>Add Category</Text>
          </TouchableOpacity>

          <View style={s.field}>
            <Text style={s.label}>ค่าจัดส่ง</Text>
            <View style={s.toggleRow}>
              {(['free', 'by_distance', 'fixed'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[s.toggle, deliveryFeeType === t && s.toggleActive]}
                  onPress={() => setDeliveryFeeType(t)}
                >
                  <Text style={[s.toggleText, deliveryFeeType === t && s.toggleTextActive]}>
                    {t === 'free' ? 'ฟรี' : t === 'by_distance' ? 'ตามระยะทาง' : 'คงที่'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {deliveryFeeType === 'fixed' && (
              <TextInput
                style={s.input}
                placeholder="ราคาคงที่ (บาท)"
                value={deliveryFixedPrice}
                onChangeText={setDeliveryFixedPrice}
                keyboardType="decimal-pad"
              />
            )}
          </View>

          <View style={s.field}>
            <Text style={s.label}>เวลารอคอยมาตรฐาน (ชม.) *</Text>
            <TextInput
              style={s.input}
              placeholder="24"
              value={standardDuration}
              onChangeText={setStandardDuration}
              keyboardType="number-pad"
            />
          </View>
        </ScrollView>

        <StepNav
          step={7}
          total={9}
          onBack={() => {
            setStep(6);
            router.back();
          }}
          onNext={onNext}
          nextLabel="ส่งคำขอ"
          nextLoading={submitting}
        />
      </KeyboardAvoidingView>

      <Modal visible={showAddCategory} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <Pressable style={s.modalBackdrop} onPress={() => setShowAddCategory(false)} />
          <View style={s.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={s.modalTitle}>เพิ่มหมวดหมู่</Text>
            <TextInput
              style={s.input}
              placeholder="ชื่อหมวด (เช่น บริการเสริม)"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalBtn} onPress={() => setShowAddCategory(false)}>
                <Text style={s.modalBtnText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnPrimary, !newCategoryName.trim() && s.modalBtnDisabled]}
                onPress={onAddCategory}
                disabled={!newCategoryName.trim()}
              >
                <Text style={s.modalBtnPrimaryText}>เพิ่ม</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddItem} transparent animationType="fade">
        <KeyboardAvoidingView
          style={s.modalKav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={s.modalOverlay} pointerEvents="box-none">
            <Pressable style={s.modalBackdrop} onPress={() => { Keyboard.dismiss(); setShowAddItem(false); }} />
            <ScrollView
              style={s.modalScroll}
              contentContainerStyle={[s.modalScrollContent, { paddingBottom: 320 }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
            <View style={s.modalContent} onStartShouldSetResponder={() => true}>
              <Text style={s.modalTitle}>Add Service</Text>

              <View style={s.modalField}>
                <Text style={s.modalLabel}>Category</Text>
                <View style={[s.input, s.inputReadonly]}>
                  <Text style={s.inputReadonlyText}>{addItemCatName || '-'}</Text>
                </View>
              </View>

              <View style={s.modalField}>
                <Text style={s.modalLabel}>Service Name</Text>
                <TextInput
                  style={s.input}
                  placeholder="e.g. Cold, Warm water ≈ 40°"
                  value={newItemName}
                  onChangeText={setNewItemName}
                />
              </View>

              <View style={s.modalField}>
                <Text style={s.modalLabel}>น้ำหนัก (kg)</Text>
                <TextInput
                  style={s.input}
                  placeholder="e.g. 9, 14, 18"
                  value={newItemWeight}
                  onChangeText={setNewItemWeight}
                  keyboardType="numeric"
                />
              </View>

              <View style={s.modalField}>
                <Text style={s.modalLabel}>ระยะเวลา (นาที)</Text>
                <TextInput
                  style={s.input}
                  placeholder="e.g. 35"
                  value={newItemDuration}
                  onChangeText={setNewItemDuration}
                  keyboardType="number-pad"
                />
              </View>

              <View style={s.modalField}>
                <Text style={s.modalLabel}>Description</Text>
                <TextInput
                  style={[s.input, s.inputMultiline]}
                  placeholder="Description"
                  value={newItemDescription}
                  onChangeText={setNewItemDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={s.modalField}>
                <Text style={s.modalLabel}>Price</Text>
                <TextInput
                  style={s.input}
                  placeholder="Enter price"
                  value={newItemPrice}
                  onChangeText={setNewItemPrice}
                  keyboardType="decimal-pad"
                />
              </View>

              <TouchableOpacity
                style={[s.addServiceBtn, !newItemName.trim() && s.modalBtnDisabled]}
                onPress={onAddItem}
                disabled={!newItemName.trim()}
                activeOpacity={0.85}
              >
                <Text style={s.addServiceBtnText}>Add Service</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.modalCancel} onPress={() => setShowAddItem(false)}>
                <Text style={s.modalCancelText}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cardBg },
  flex: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 24 },
  title: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  categoryBlock: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  categoryRowWrap: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  categoryRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingRight: 56,
  },
  categoryName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  categoryRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemCount: { fontSize: 14, color: Colors.textSecondary },
  itemsList: { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 0 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primaryBlue,
    marginBottom: 4,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  itemMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  itemPrice: { fontSize: 14, color: Colors.textSecondary, marginRight: 8 },
  itemDeleteBtn: { padding: 12, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  emptyItems: { fontSize: 13, color: Colors.textMuted, paddingVertical: 8 },
  addItemInCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
  },
  addItemText: { fontSize: 14, color: Colors.primaryBlue, fontWeight: '500' },
  addBtn: {
    backgroundColor: Colors.primaryBlue,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  addBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  deleteBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    padding: 16,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnPressed: { opacity: 0.6 },
  field: { gap: 6, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#333' },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggle: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  toggleActive: { backgroundColor: '#0E3A78', borderColor: '#0E3A78' },
  toggleText: { fontSize: 14, color: '#666' },
  toggleTextActive: { color: '#fff', fontWeight: '600' },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
  },
  modalKav: { flex: 1 },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 24 },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalScroll: { maxHeight: '80%' },
  modalScrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 24 },
  modalContent: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 20 },
  modalField: { marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  inputReadonly: { justifyContent: 'center' },
  inputReadonlyText: { fontSize: 15, color: '#666' },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  addServiceBtn: {
    backgroundColor: '#87CEEB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  addServiceBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  modalCancel: { alignItems: 'center', paddingVertical: 8 },
  modalCancelText: { fontSize: 14, color: '#666' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalBtnText: { fontSize: 16, color: '#666' },
  modalBtnPrimary: { backgroundColor: Colors.primaryBlue, borderColor: Colors.primaryBlue },
  modalBtnPrimaryText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  modalBtnDisabled: { opacity: 0.5 },
});
