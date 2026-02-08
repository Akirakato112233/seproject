import React from 'react';
import { View, Text } from 'react-native';

export interface LaundryShop {
  id: string;
  name: string;
  rating?: number;
  priceLevel?: number;
  deliveryFee?: number;
  [key: string]: unknown;
}

export function LaundryShopCard() {
  return (
    <View>
      <Text>LaundryShopCard</Text>
    </View>
  );
}
