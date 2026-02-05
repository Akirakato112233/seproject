import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../style/myStyle';

export interface LaundryShop {
  _id: string;
  name: string;
  rating: number;
  reviewCount: number;
  priceLevel: number; // 1-4 ($, $$, $$$, $$$$)
  type: 'coin' | 'full';
  deliveryFee: number;
  deliveryTime: number; // in minutes
  imageUrl?: string;
}

interface LaundryShopCardProps {
  shop: LaundryShop;
  onPress?: () => void;
}

export const LaundryShopCard: React.FC<LaundryShopCardProps> = ({ shop, onPress }) => {
  const formatReviewCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K+`;
    }
    return `${count}+`;
  };

  const priceLevelText = '$'.repeat(shop.priceLevel);
  const typeText = shop.type === 'coin' ? 'Coin Laundry' : 'Full-service Laundry';

  return (
    <TouchableOpacity
      style={styles.shopCard}
      onPress={() => router.push({ pathname: '/shop/[id]', params: { id: shop._id } })}
      activeOpacity={0.7}
    >
      {/* รูปภาพร้าน */}
      <View style={styles.shopImage}>
        {shop.imageUrl ? (
          <Image source={{ uri: shop.imageUrl }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#E0E0E0' }}>
            <Ionicons name="shirt-outline" size={40} color="#999" />
            <Text style={{ fontSize: 10, color: '#999', marginTop: 4, fontWeight: 'bold' }}>
              {shop.type === 'coin' ? 'COIN LAUNDRY' : 'FULL SERVICE'}
            </Text>
          </View>
        )}
      </View>

      {/* ข้อมูลร้าน */}
      <View style={styles.shopInfo}>
        {/* ชื่อร้าน */}
        <Text style={styles.shopName} numberOfLines={2}>
          {shop.name}
        </Text>

        {/* คะแนนรีวิว */}
        <View style={styles.shopRating}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>{shop.rating}</Text>
          <Text style={styles.ratingCount}>({formatReviewCount(shop.reviewCount)})</Text>
        </View>

        {/* ระดับราคา, ประเภท, ค่าจัดส่ง */}
        <View style={styles.shopDetails}>
          <Text style={styles.priceLevel}>{priceLevelText}</Text>
          <Text style={styles.shopType}>{typeText}</Text>
        </View>

        {/* ค่าจัดส่งและเวลา */}
        <Text style={styles.deliveryInfo}>
          ฿ {shop.deliveryFee} · From {shop.deliveryTime} mins
        </Text>
      </View>
    </TouchableOpacity>
  );
};
