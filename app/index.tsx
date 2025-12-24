import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity,
  SafeAreaView, Platform, Modal, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// --- 1. Reusable Bottom Sheet Wrapper ---
const BottomSheet = ({ visible, onClose, title, children, onReset, onApply }: any) => (
  <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
    <TouchableWithoutFeedback onPress={onClose}><View style={styles.modalOverlay} /></TouchableWithoutFeedback>
    <View style={styles.bottomSheetContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.bottomSheetTitle}>{title}</Text>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
      </View>
      {children}
      <View style={styles.bottomSheetFooter}>
        <TouchableOpacity style={styles.resetBtn} onPress={onReset}><Text style={styles.resetBtnText}>Reset</Text></TouchableOpacity>
        <TouchableOpacity style={styles.applyBtn} onPress={onApply}><Text style={styles.applyBtnText}>Apply</Text></TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// --- 2. Filter Components (Radio & Checkbox) ---
const FilterRow = ({ icon, label, selected, onPress }: any) => (
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

const CheckboxRow = ({ icon, label, selected, onPress }: any) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.rowLeft}>
      <Ionicons name={icon} size={22} color="#333" style={{ marginRight: 15 }} />
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <View style={[styles.checkbox, selected && styles.checkboxActive]}>
      {selected && <Ionicons name="checkmark" size={16} color="white" />}
    </View>
  </TouchableOpacity>
);

// --- 3. Main Filter Modal (หน้าต่างรวมที่กดจากไอคอน) ---
const MainFilterModal = ({ visible, onClose, filters, setFilters }: any) => (
  <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
    <TouchableWithoutFeedback onPress={onClose}><View style={styles.modalOverlay} /></TouchableWithoutFeedback>
    <View style={[styles.bottomSheetContainer, { height: '85%' }]}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose}><Ionicons name="arrow-back" size={24} color="black" /></TouchableOpacity>
        <Text style={[styles.bottomSheetTitle, { marginLeft: 15, marginBottom: 0 }]}>Filters</Text>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Laundry Type</Text>
        <FilterRow label="Coin Laundry" selected={filters.type === 'coin'} onPress={() => setFilters({...filters, type: 'coin'})} icon={<MaterialCommunityIcons name="washing-machine" size={24} />} />
        <FilterRow label="Full-service Laundry" selected={filters.type === 'full'} onPress={() => setFilters({...filters, type: 'full'})} icon={<Ionicons name="layers-outline" size={24} />} />

        <Text style={styles.sectionTitle}>Options</Text>
        <CheckboxRow label="Rating" selected={filters.rating > 0} onPress={() => setFilters({...filters, rating: filters.rating > 0 ? 0 : 4})} icon="star-outline" />
        <CheckboxRow label="Promo" selected={filters.promo} onPress={() => setFilters({...filters, promo: !filters.promo})} icon="pricetag-outline" />
        <CheckboxRow label="Near me" selected={filters.nearMe} onPress={() => setFilters({...filters, nearMe: !filters.nearMe})} icon="location-outline" />

        <Text style={styles.sectionTitle}>Price</Text>
        <View style={styles.priceContainer}>
          {[1, 2, 3, 4].map(num => (
            <TouchableOpacity key={num} style={[styles.priceBtnItem, filters.price === num && styles.priceBtnActive]} onPress={() => setFilters({...filters, price: num})}>
              <Text style={[styles.priceBtnText, filters.price === num && styles.priceBtnTextActive]}>{'$'.repeat(num)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Delivery Fee</Text>
        {['Any', 'Less than ฿ 10', 'Less than ฿ 20', 'Less than ฿ 30'].map(fee => (
          <FilterRow key={fee} label={fee} selected={filters.delivery === fee} onPress={() => setFilters({...filters, delivery: fee})} />
        ))}
      </ScrollView>

      <View style={styles.bottomSheetFooter}>
        <TouchableOpacity style={styles.resetBtn} onPress={() => setFilters({open:true, type:'coin', nearMe:false, rating:0, price:0, promo:false, delivery:'Any'})}>
          <Text style={styles.resetBtnText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyBtn} onPress={onClose}><Text style={styles.applyBtnText}>Apply</Text></TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default function SearchScreen() {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isMainModalVisible, setMainModalVisible] = useState(false);

  const [filters, setFilters] = useState({
    open: true,
    type: 'coin',
    nearMe: false,
    rating: 0,
    price: 0,
    promo: false,
    delivery: 'Any'
  });

  const isFilterActive = (key: keyof typeof filters, defaultValue: any) => filters[key] !== defaultValue;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <View style={{marginLeft: 15}}><Text style={styles.locationTitle}>Your location</Text><Text style={styles.locationName}>The One Place Building</Text></View>
      </View>
      
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="menu-outline" size={24} color="#666" />
          <TextInput placeholder=" " style={styles.searchInput} />
          <Ionicons name="search-outline" size={22} color="#666" />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          
          <TouchableOpacity style={styles.filterIconButton} onPress={() => setMainModalVisible(true)}>
            <Ionicons name="options-outline" size={18} color="#1d4685" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.chip, filters.open && styles.activeChip]} onPress={() => setFilters({...filters, open: !filters.open})}>
            <Text style={[styles.chipText, filters.open && styles.activeChipText]}>Open</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.chip, isFilterActive('type', 'any') && styles.activeChip]} onPress={() => setActiveModal('type')}>
            <Text style={[styles.chipText, isFilterActive('type', 'any') && styles.activeChipText]}>Laundry Type</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.chip, filters.nearMe && styles.activeChip]} onPress={() => setFilters({...filters, nearMe: !filters.nearMe})}>
            <Text style={[styles.chipText, filters.nearMe && styles.activeChipText]}>Near me</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.chip, isFilterActive('rating', 0) && styles.activeChip]} onPress={() => setActiveModal('rating')}>
            <Text style={[styles.chipText, isFilterActive('rating', 0) && styles.activeChipText]}>Rating</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.chip, isFilterActive('price', 0) && styles.activeChip]} onPress={() => setActiveModal('price')}>
            <Text style={[styles.chipText, isFilterActive('price', 0) && styles.activeChipText]}>Price</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.chip, filters.promo && styles.activeChip]} onPress={() => setFilters({...filters, promo: !filters.promo})}>
            <Text style={[styles.chipText, filters.promo && styles.activeChipText]}>Promo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.chip, isFilterActive('delivery', 'Any') && styles.activeChip]} onPress={() => setActiveModal('delivery')}>
            <Text style={[styles.chipText, isFilterActive('delivery', 'Any') && styles.activeChipText]}>Delivery fee</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.emptyContent}><Ionicons name="search" size={60} color="#F0F0F0" /><Text style={styles.emptyText}>รายการร้านค้าจะแสดงที่นี่</Text></View>

      {/* --- Modals --- */}
      <MainFilterModal visible={isMainModalVisible} onClose={() => setMainModalVisible(false)} filters={filters} setFilters={setFilters} />

      <BottomSheet visible={activeModal === 'type'} title="Laundry Type" onClose={() => setActiveModal(null)} onReset={() => setFilters({...filters, type: 'coin'})} onApply={() => setActiveModal(null)}>
        <FilterRow icon={<MaterialCommunityIcons name="washing-machine" size={24} />} label="Coin Laundry" selected={filters.type === 'coin'} onPress={() => setFilters({...filters, type: 'coin'})} />
        <FilterRow icon={<Ionicons name="layers-outline" size={24} />} label="Full-service Laundry" selected={filters.type === 'full'} onPress={() => setFilters({...filters, type: 'full'})} />
      </BottomSheet>

      <BottomSheet visible={activeModal === 'rating'} title="Rating" onClose={() => setActiveModal(null)} onReset={() => setFilters({...filters, rating: 0})} onApply={() => setActiveModal(null)}>
        {[5, 4, 3, 2].map(star => (
          <FilterRow key={star} label={`${star} Stars & Above`} selected={filters.rating === star} onPress={() => setFilters({...filters, rating: star})} />
        ))}
      </BottomSheet>

      <BottomSheet visible={activeModal === 'price'} title="Price" onClose={() => setActiveModal(null)} onReset={() => setFilters({...filters, price: 0})} onApply={() => setActiveModal(null)}>
        <View style={styles.priceContainer}>
          {[1, 2, 3, 4].map(num => (
            <TouchableOpacity key={num} style={[styles.priceBtnItem, filters.price === num && styles.priceBtnActive]} onPress={() => setFilters({...filters, price: num})}>
              <Text style={[styles.priceBtnText, filters.price === num && styles.priceBtnTextActive]}>{'$'.repeat(num)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>

      <BottomSheet visible={activeModal === 'delivery'} title="Delivery Fee" onClose={() => setActiveModal(null)} onReset={() => setFilters({...filters, delivery: 'Any'})} onApply={() => setActiveModal(null)}>
        {['Any', 'Less than ฿ 10', 'Less than ฿ 20', 'Less than ฿ 30'].map(fee => (
          <FilterRow key={fee} label={fee} selected={filters.delivery === fee} onPress={() => setFilters({...filters, delivery: fee})} />
        ))}
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  locationTitle: { fontSize: 12, color: '#999' },
  locationName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  searchSection: { paddingHorizontal: 16, paddingVertical: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAF5FF', borderRadius: 15, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#F0E6FF' },
  searchInput: { flex: 1, marginHorizontal: 10, fontSize: 16 },
  filterContainer: { marginVertical: 10 },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  filterIconButton: { borderWidth: 1, borderColor: '#1d4685', borderRadius: 10, width: 40, height: 32, justifyContent: 'center', alignItems: 'center' },
  chip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 15, height: 32, justifyContent: 'center', backgroundColor: '#fff' },
  chipText: { fontSize: 13, color: '#666' },
  activeChip: { backgroundColor: '#A0C4FF', borderColor: '#1d4685' },
  activeChipText: { color: '#1d4685', fontWeight: 'bold' },
  emptyContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#CCC', fontSize: 16, marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  bottomSheetContainer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  bottomSheetTitle: { fontSize: 20, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 30, marginRight: 15 },
  rowLabel: { fontSize: 16 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: '#1d4685' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#1d4685' },
  checkbox: { width: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#1d4685', borderColor: '#1d4685' },
  priceContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  priceBtnItem: { flex: 1, height: 40, borderWidth: 1, borderColor: '#1d4685', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginHorizontal: 4 },
  priceBtnActive: { backgroundColor: '#1d4685' },
  priceBtnText: { color: '#1d4685', fontWeight: 'bold' },
  priceBtnTextActive: { color: '#fff' },
  bottomSheetFooter: { flexDirection: 'row', gap: 15, marginTop: 10 },
  resetBtn: { flex: 1, paddingVertical: 14, backgroundColor: '#a3b7d2', borderRadius: 25, alignItems: 'center' },
  applyBtn: { flex: 1, paddingVertical: 14, backgroundColor: '#1d4685', borderRadius: 25, alignItems: 'center' },
  resetBtnText: { fontWeight: 'bold' },
  applyBtnText: { color: '#fff', fontWeight: 'bold' },
});