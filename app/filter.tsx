import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ScrollView, SafeAreaView, Platform 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // 1. นำเข้า useRouter

export default function FilterScreen() {
  const router = useRouter(); // 2. ประกาศตัวแปร router

  // --- ส่วนของ State ---
  const [laundryType, setLaundryType] = useState('coin');
  const [options, setOptions] = useState({ rating: true, promo: false, nearMe: true });
  const [priceRange, setPriceRange] = useState(2);
  const [deliveryFee, setDeliveryFee] = useState('any');

  const toggleOption = (key: keyof typeof options) => {
    setOptions({ ...options, [key]: !options[key] });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 1. Header - แก้ไขให้กดกลับได้ */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 2. Section: Laundry Type */}
        <Text style={styles.sectionTitle}>Laundry Type</Text>
        <FilterRow 
          icon={<MaterialCommunityIcons name="washing-machine" size={22} color="#555" />}
          label="Coin Laundry"
          selected={laundryType === 'coin'}
          onPress={() => setLaundryType('coin')}
          type="radio"
        />
        <FilterRow 
          icon={<Ionicons name="layers-outline" size={22} color="#555" />}
          label="Full-service Laundry"
          selected={laundryType === 'full'}
          onPress={() => setLaundryType('full')}
          type="radio"
        />

        <View style={styles.divider} />

        {/* 3. Section: Options */}
        <Text style={styles.sectionTitle}>Options</Text>
        <FilterRow 
          icon={<Ionicons name="star-outline" size={22} color="#555" />}
          label="Rating"
          selected={options.rating}
          onPress={() => toggleOption('rating')}
          type="checkbox"
        />
        <FilterRow 
          icon={<Ionicons name="pricetag-outline" size={22} color="#555" />}
          label="Promo"
          selected={options.promo}
          onPress={() => toggleOption('promo')}
          type="checkbox"
        />
        <FilterRow 
          icon={<Ionicons name="location-outline" size={22} color="#555" />}
          label="Near me"
          selected={options.nearMe}
          onPress={() => toggleOption('nearMe')}
          type="checkbox"
        />

        <View style={styles.divider} />

        {/* 4. Section: Price */}
        <Text style={styles.sectionTitle}>Price</Text>
        <View style={styles.priceContainer}>
          {[1, 2, 3, 4].map((num) => (
            <TouchableOpacity 
              key={num}
              style={[styles.priceButton, priceRange === num && styles.priceButtonActive]}
              onPress={() => setPriceRange(num)}
            >
              <Text style={[styles.priceText, priceRange === num && styles.priceTextActive]}>
                {'$'.repeat(num)}
                <Text style={{color: priceRange === num ? '#fff' : '#ccc'}}>{'$'.repeat(4-num)}</Text>
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        {/* 5. Section: Delivery Fee */}
        <Text style={styles.sectionTitle}>Delivery Fee</Text>
        {['any', '10', '20', '30', '40'].map((fee) => (
          <TouchableOpacity key={fee} style={styles.feeRow} onPress={() => setDeliveryFee(fee)}>
            <Text style={styles.feeText}>{fee === 'any' ? 'Any' : `Less than ฿ ${fee}`}</Text>
            <View style={[styles.radioOuter, deliveryFee === fee && styles.radioActive]}>
              {deliveryFee === fee && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 6. Footer Buttons - เพิ่มกดกลับที่ปุ่ม Apply */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.resetBtn}
          onPress={() => {
            // ใส่ Logic ล้างค่าตรงนี้ถ้าต้องการ
            router.back();
          }}
        >
          <Text style={styles.resetBtnText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.applyBtn} 
          onPress={() => router.back()} // กด Apply แล้วย้อนกลับหน้าแรก
        >
          <Text style={styles.applyBtnText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- Component ย่อยสำหรับแต่ละแถว ---
const FilterRow = ({ icon, label, selected, onPress, type }: any) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.rowLeft}>
      <View style={styles.iconBox}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    {type === 'radio' ? (
      <View style={[styles.radioOuter, selected && styles.radioActive]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    ) : (
      <Ionicons 
        name={selected ? "checkbox" : "square-outline"} 
        size={24} 
        color={selected ? "#1d4685" : "#ccc"} 
      />
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 120 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#000' },
  divider: { height: 1, backgroundColor: '#f2f2f2', marginVertical: 16 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 30, alignItems: 'center', marginRight: 12 },
  rowLabel: { fontSize: 16, color: '#333' },

  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: '#1d4685' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#1d4685' },

  priceContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  priceButton: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: '#1d4685', borderRadius: 20, alignItems: 'center', marginHorizontal: 4 },
  priceButtonActive: { backgroundColor: '#1d4685' },
  priceText: { fontSize: 14, fontWeight: 'bold', color: '#1d4685' },
  priceTextActive: { color: '#fff' },

  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingLeft: 0 },
  feeText: { fontSize: 16, color: '#444' },

  footer: { position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  resetBtn: { flex: 1, paddingVertical: 16, backgroundColor: '#a3b7d2', borderRadius: 25, marginRight: 12, alignItems: 'center' },
  applyBtn: { flex: 1, paddingVertical: 16, backgroundColor: '#1d4685', borderRadius: 25, alignItems: 'center' },
  resetBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  applyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});