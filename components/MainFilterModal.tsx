import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from '../style/myStyle';
import { FilterRow } from './FilterRow';
import { CheckboxRow } from './CheckboxRow';

interface FilterState {
  open: boolean;
  type: string;
  nearMe: boolean;
  rating: number;
  price: number;
  promo: boolean;
  delivery: string;
}

interface MainFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

export const MainFilterModal: React.FC<MainFilterModalProps> = ({
  visible,
  onClose,
  filters,
  setFilters,
}) => {
  const handleReset = () => {
    setFilters({
      open: true,
      type: 'coin',
      nearMe: false,
      rating: 0,
      price: 0,
      promo: false,
      delivery: 'Any',
    });
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>
      <View style={[styles.bottomSheetContainer, { height: '85%' }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={[styles.bottomSheetTitle, { marginLeft: 15, marginBottom: 0 }]}>Filters</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Laundry Type</Text>
          <FilterRow
            label="Coin Laundry"
            selected={filters.type === 'coin'}
            onPress={() => setFilters({ ...filters, type: 'coin' })}
            icon={<MaterialCommunityIcons name="washing-machine" size={24} />}
          />
          <FilterRow
            label="Full-service Laundry"
            selected={filters.type === 'full'}
            onPress={() => setFilters({ ...filters, type: 'full' })}
            icon={<Ionicons name="layers-outline" size={24} />}
          />

          <Text style={styles.sectionTitle}>Options</Text>
          <CheckboxRow
            label="Rating"
            selected={filters.rating > 0}
            onPress={() => setFilters({ ...filters, rating: filters.rating > 0 ? 0 : 4 })}
            icon="star-outline"
          />
          <CheckboxRow
            label="Promo"
            selected={filters.promo}
            onPress={() => setFilters({ ...filters, promo: !filters.promo })}
            icon="pricetag-outline"
          />
          <CheckboxRow
            label="Near me"
            selected={filters.nearMe}
            onPress={() => setFilters({ ...filters, nearMe: !filters.nearMe })}
            icon="location-outline"
          />

          <Text style={styles.sectionTitle}>Price</Text>
          <View style={styles.priceContainer}>
            {[1, 2, 3, 4].map((num) => (
              <TouchableOpacity
                key={num}
                style={[styles.priceBtnItem, filters.price === num && styles.priceBtnActive]}
                onPress={() => setFilters({ ...filters, price: num })}
              >
                <Text style={[styles.priceBtnText, filters.price === num && styles.priceBtnTextActive]}>
                  {'$'.repeat(num)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Delivery Fee</Text>
          {['Any', 'Less than ฿ 10', 'Less than ฿ 20', 'Less than ฿ 30'].map((fee) => (
            <FilterRow
              key={fee}
              label={fee}
              selected={filters.delivery === fee}
              onPress={() => setFilters({ ...filters, delivery: fee })}
            />
          ))}
        </ScrollView>

        <View style={styles.bottomSheetFooter}>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={onClose}>
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
