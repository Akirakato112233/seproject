import React from 'react';
import { ScrollView, View } from 'react-native';
import { styles } from '../style/myStyle';
import { LaundryShopCard, LaundryShop } from './LaundryShopCard';
import { EmptyContent } from './EmptyContent';

interface LaundryShopListProps {
  shops: LaundryShop[];
  onShopPress?: (shop: LaundryShop) => void;
}

export const LaundryShopList: React.FC<LaundryShopListProps> = ({ shops, onShopPress }) => {
  if (shops.length === 0) {
    return <EmptyContent />;
  }

  return (
    <ScrollView style={styles.shopListContainer} showsVerticalScrollIndicator={false}>
      {shops.map((shop) => (
        <LaundryShopCard
          key={shop.id}
          shop={shop}
          onPress={() => onShopPress?.(shop)}
        />
      ))}
    </ScrollView>
  );
};
