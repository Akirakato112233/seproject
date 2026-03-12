import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';
import { BASE_URL } from '../config';
import { useShop } from '../context/ShopContext';

const shopAvatarImg = require('../assets/images/shop-avatar.png');

interface MerchantHeaderProps {
  shopName?: string;
}

export function MerchantHeader({
  shopName = 'ร้านasukhai',
}: MerchantHeaderProps) {
  const { shop, updateShop } = useShop();
  const [updating, setUpdating] = useState(false);
  const isOn = shop?.status !== false; // default true ถ้าไม่มีค่า

  const handleToggle = async () => {
    if (updating || !shop) return;
    if (isOn) {
      Alert.alert(
        'Turn shop OFF',
        'Are you sure you want to turn the shop off? Customers will not see your shop in the list.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Turn OFF', style: 'destructive', onPress: () => doUpdateStatus(false) },
        ]
      );
      return;
    }
    Alert.alert(
      'Turn shop ON',
      'Are you sure you want to turn the shop on? Customers will see your shop in the list.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Turn ON', onPress: () => doUpdateStatus(true) },
      ]
    );
  };

  const doUpdateStatus = async (next: boolean) => {
    if (!shop) return;
    setUpdating(true);
    const ok = await updateShop({ status: next });
    if (!ok) {
      await updateShop({ status: isOn });
    }
    setUpdating(false);
  };

  const shopImageUri = shop?.imageUrl
    ? shop.imageUrl.startsWith('http')
      ? shop.imageUrl
      : `${BASE_URL}${shop.imageUrl}`
    : null;

  return (
    <View style={s.header}>
      <View style={s.headerLeft}>
        {shopImageUri ? (
          <Image source={{ uri: shopImageUri }} style={s.avatar} />
        ) : (
          <Image source={shopAvatarImg} style={s.avatar} />
        )}
        <Text style={s.shopName} numberOfLines={1} ellipsizeMode="tail">{shopName}</Text>
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBorder,
  },
  shopName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
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
});
