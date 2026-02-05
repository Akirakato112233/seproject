import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../style/myStyle';

interface PriceSelectorProps {
  selectedPrice: number;
  onSelect: (price: number) => void;
}

export const PriceSelector: React.FC<PriceSelectorProps> = ({ selectedPrice, onSelect }) => (
  <View style={styles.priceContainer}>
    {[1, 2, 3, 4].map((num) => (
      <TouchableOpacity
        key={num}
        style={[styles.priceBtnItem, selectedPrice === num && styles.priceBtnActive]}
        onPress={() => onSelect(num)}
      >
        <Text style={[styles.priceBtnText, selectedPrice === num && styles.priceBtnTextActive]}>
          {'$'.repeat(num)}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);
