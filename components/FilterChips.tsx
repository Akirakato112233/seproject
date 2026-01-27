import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../style/myStyle';

interface FilterState {
  open: boolean;
  type: string;
  nearMe: boolean;
  rating: number;
  price: number;
  promo: boolean;
  delivery: string;
}

interface FilterChipsProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  setActiveModal: (modal: string | null) => void;
  setMainModalVisible: (visible: boolean) => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  filters,
  setFilters,
  setActiveModal,
  setMainModalVisible,
}) => {
  const isFilterActive = (key: keyof FilterState, defaultValue: any) => filters[key] !== defaultValue;

  return (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        <TouchableOpacity style={styles.filterIconButton} onPress={() => setMainModalVisible(true)}>
          <Ionicons name="options-outline" size={18} color="#1d4685" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, filters.open && styles.activeChip]}
          onPress={() => setFilters({ ...filters, open: !filters.open })}
        >
          <Text style={[styles.chipText, filters.open && styles.activeChipText]}>Open</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, isFilterActive('type', 'any') && styles.activeChip]}
          onPress={() => setActiveModal('type')}
        >
          <Text style={[styles.chipText, isFilterActive('type', 'any') && styles.activeChipText]}>
            Laundry Type
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, filters.nearMe && styles.activeChip]}
          onPress={() => setFilters({ ...filters, nearMe: !filters.nearMe })}
        >
          <Text style={[styles.chipText, filters.nearMe && styles.activeChipText]}>Near me</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, isFilterActive('rating', 0) && styles.activeChip]}
          onPress={() => setActiveModal('rating')}
        >
          <Text style={[styles.chipText, isFilterActive('rating', 0) && styles.activeChipText]}>Rating</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, isFilterActive('price', 0) && styles.activeChip]}
          onPress={() => setActiveModal('price')}
        >
          <Text style={[styles.chipText, isFilterActive('price', 0) && styles.activeChipText]}>Price</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, filters.promo && styles.activeChip]}
          onPress={() => setFilters({ ...filters, promo: !filters.promo })}
        >
          <Text style={[styles.chipText, filters.promo && styles.activeChipText]}>Promo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, isFilterActive('delivery', 'Any') && styles.activeChip]}
          onPress={() => setActiveModal('delivery')}
        >
          <Text style={[styles.chipText, isFilterActive('delivery', 'Any') && styles.activeChipText]}>
            Delivery fee
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
