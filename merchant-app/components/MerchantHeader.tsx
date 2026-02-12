import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';

const shopAvatarImg = require('../assets/images/shop-avatar.png');

interface MerchantHeaderProps {
  shopName?: string;
  onWalletPress?: () => void;
}

export function MerchantHeader({
  shopName = 'ร้านasukhai',
  onWalletPress,
}: MerchantHeaderProps) {
  return (
    <View style={s.header}>
      <View style={s.headerLeft}>
        <Image source={shopAvatarImg} style={s.avatar} />
        <Text style={s.shopName}>{shopName}</Text>
      </View>
      <TouchableOpacity onPress={onWalletPress}>
        <Ionicons name="wallet-outline" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBorder,
  },
  shopName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
});
