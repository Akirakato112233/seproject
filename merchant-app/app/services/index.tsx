import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useServices } from '../../context/ServicesContext';

export default function OptionScreen() {
  const router = useRouter();
  const { categories, removeCategory, removeItem } = useServices();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleDeleteCategory = (catName: string, catId: string) => {
    const msg = `ต้องการลบหมวด "${catName}" และรายการทั้งหมดหรือไม่?`;
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) removeCategory(catId);
    } else {
      Alert.alert('ลบหมวด', msg, [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ลบ', style: 'destructive', onPress: () => removeCategory(catId) },
      ]);
    }
  };

  const handleDeleteItem = (itemName: string, catId: string, itemId: string) => {
    const msg = `ต้องการลบ "${itemName}" หรือไม่?`;
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) removeItem(catId, itemId);
    } else {
      Alert.alert('ลบรายการ', msg, [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ลบ', style: 'destructive', onPress: () => removeItem(catId, itemId) },
      ]);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
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
                  <Text style={s.emptyItems}>No items yet</Text>
                ) : (
                  cat.items.map((item) => (
                    <View key={item.id} style={s.itemRow}>
                      <Text style={s.itemName}>{item.name}</Text>
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
                  onPress={() =>
                    router.push({
                      pathname: '/services/add-item',
                      params: { categoryId: cat.id, categoryName: cat.name },
                    })
                  }
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
          onPress={() => router.push('/services/add-choice')}
        >
          <Text style={s.addBtnText}>Add Item or Category</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cardBg },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
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
  categoryRowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
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
  itemName: { fontSize: 14, color: Colors.textPrimary, flex: 1 },
  itemDeleteBtn: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
});
