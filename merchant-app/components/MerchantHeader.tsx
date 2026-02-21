import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';
import { useShop } from '../context/ShopContext';

const shopAvatarImg = require('../assets/images/shop-avatar.png');

interface MerchantHeaderProps {
  shopName?: string;
  onWalletPress?: () => void;
}

export function MerchantHeader({
  shopName = 'ร้านasukhai',
  onWalletPress,
}: MerchantHeaderProps) {
  const { shop, updateShop } = useShop();
  const [updating, setUpdating] = useState(false);
  const isOn = shop?.status !== false; // default true ถ้าไม่มีค่า

  const handleToggle = async () => {
    if (updating || !shop) return;
    setUpdating(true);
    const next = !isOn;
    const ok = await updateShop({ status: next });
    if (!ok) {
      // rollback ไม่ต้อง set state เพราะ updateShop ไม่ได้อัปเดต local
      await updateShop({ status: isOn });
    }
    setUpdating(false);
  };

  return (
    <View style={s.header}>
      <View style={s.headerLeft}>
        <Image source={shopAvatarImg} style={s.avatar} />
        <Text style={s.shopName}>{shopName}</Text>
      </View>
      <View style={s.headerRight}>
        <Pressable
          onPress={handleToggle}
          style={[s.toggleTrack, isOn ? s.toggleOn : s.toggleOff]}
          disabled={updating}
        >
          {isOn ? (
            <>
              <Text style={[s.toggleLabel, s.toggleLabelOn]}>ON</Text>
              <View style={[s.toggleThumb, s.toggleThumbOn]} />
            </>
          ) : (
            <>
              <View style={[s.toggleThumb, s.toggleThumbOff]} />
              <Text style={[s.toggleLabel, s.toggleLabelOff]}>OFF</Text>
            </>
          )}
        </Pressable>
        <TouchableOpacity onPress={onWalletPress} style={s.walletBtn}>
          <Ionicons name="wallet-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBorder,
  },
  shopName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  // Toggle แบบรูปที่ 1: ON = พื้นดำ ตัวอักษร/วงกลมขาว, OFF = พื้นขาวขอบดำ ตัวอักษร/วงกลมดำ
  toggleTrack: {
    width: 72,
    height: 36,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  toggleOn: {
    backgroundColor: '#1f2937',
  },
  toggleOff: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: '#1f2937',
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  toggleLabelOn: { color: Colors.white },
  toggleLabelOff: { color: '#1f2937' },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  toggleThumbOn: { backgroundColor: Colors.white },
  toggleThumbOff: { backgroundColor: '#1f2937' },
  walletBtn: { padding: 4 },
});
