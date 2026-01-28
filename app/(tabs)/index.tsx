// app/(tabs)/index.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API } from '../../config';


function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={s.action} onPress={onPress} activeOpacity={0.85}>
      <View style={s.actionIcon}>{icon}</View>
      <Text style={s.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState('0.00');

useFocusEffect(
  useCallback(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch(API.BALANCE);
        
        const data = await res.json();
        console.log('Balance loaded:', data); // ดู Log ใน Terminal ฝั่ง Metro (Expo)
        
        // แปลงตัวเลขให้มีทศนิยม 2 ตำแหน่ง
        setBalance(data.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      } catch (error) {
        console.log('Error loading balance:', error);
        // alert('ดึงยอดเงินไม่สำเร็จ: ' + error); // เปิดบรรทัดนี้เพื่อดู error บนหน้าจอมือถือ
      }
    };
    fetchBalance();
  }, [])
);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <LinearGradient
        colors={['#2E6BE8', '#5B42F3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.headerWrap}
      >
        <View style={s.topRow}>
          <View>
            <Text style={s.welcomeSmall}>WELCOME BACK,</Text>
            <Text style={s.welcomeName}>Bakugo</Text>
          </View>

          <TouchableOpacity style={s.avatar} activeOpacity={0.85}>
            <Ionicons name="person" size={18} color="#3B3B3B" />
          </TouchableOpacity>
        </View>

        {/* ✅ แก้ไข: เปลี่ยน Search Box ให้เป็นปุ่มกดไปหน้า Discover */}
        <TouchableOpacity 
          style={s.searchBox} 
          activeOpacity={0.9}
          onPress={() => router.push('/discover')} 
        >
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.9)" />
          <Text style={s.searchInputPlaceholder}>
            ค้นหาร้านซักรีดที่คุณต้องการ...
          </Text>
        </TouchableOpacity>

        <View style={s.walletCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={s.walletIcon}>
              <Ionicons name="wallet-outline" size={18} color="#2E6BE8" />
            </View>
            <View>
              <Text style={s.walletLabel}>WIT WALLET BALANCE</Text>
              <Text style={s.walletValue}>฿ {balance}</Text>
            </View>
          </View>

          <TouchableOpacity style={s.topUpBtn} activeOpacity={0.85} onPress={() => router.push('/wallet' as any)}>
            <Text style={s.topUpText}>TOP UP</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={s.gridWrap}>
        <View style={s.gridRow}>
          <ActionButton
            icon={<MaterialCommunityIcons name="washing-machine" size={22} color="#2E6BE8" />}
            label="WASH & FOLD"
            // ✅ ส่งค่า type='full' ไปหน้า Search
            onPress={() => router.push({ pathname: '/search', params: { type: 'full' } })}
          />
          <ActionButton
            icon={<MaterialCommunityIcons name="iron" size={22} color="#2E6BE8" />}
            label="IRONING"
             // ✅ ส่งค่า type='full' (หรือ ironing='true' ถ้ามี)
            onPress={() => router.push({ pathname: '/search', params: { type: 'full' } })}
          />
          <ActionButton
            icon={<MaterialCommunityIcons name="hanger" size={22} color="#2E6BE8" />}
            label="DRY CLEAN"
             // ✅ ไปหน้า Search แบบ Full Service
            onPress={() => router.push({ pathname: '/search', params: { type: 'full' } })}
          />
          <ActionButton
            icon={<Ionicons name="location-outline" size={22} color="#2E6BE8" />}
            label="NEAR ME"
            // ✅ ส่งค่า nearMe='true' ไปหน้า Search
            onPress={() => router.push({ pathname: '/search', params: { nearMe: 'true' } })}
          />
        </View>

        <View style={s.gridRow}>
          <ActionButton
            icon={<MaterialCommunityIcons name="washing-machine-alert" size={22} color="#2E6BE8" />}
            label="COIN LAUNDRY"
            // ✅ ส่งค่า type='coin' ไปหน้า Search
            onPress={() => router.push({ pathname: '/search', params: { type: 'coin' } })}
          />
          <ActionButton
            icon={<Ionicons name="time-outline" size={22} color="#2E6BE8" />}
            label="CHECK STATUS"
          />
          <ActionButton
            icon={<Ionicons name="grid-outline" size={22} color="#2E6BE8" />}
            label="MORE"
            onPress={() => router.push('/discover')} // หรือกด More เพื่อไปหน้า Discover ก็ได้
          />
          {/* ช่องว่างให้เหมือนเลย์เอาต์ 3 อันแถวล่างในรูป */}
          <View style={[s.action, { opacity: 0 }]} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeSmall: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  welcomeName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    marginTop: 14,
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  searchInputPlaceholder: {
    flex: 1,
    color: 'rgba(255,255,255,0.75)', // สีจางๆ เหมือน Placeholder
    fontSize: 14,
  },
  walletCard: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#EAF1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletLabel: {
    fontSize: 10,
    color: '#7A7A7A',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  walletValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
    marginTop: 2,
  },
  topUpBtn: {
    backgroundColor: '#EAF1FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  topUpText: {
    color: '#2E6BE8',
    fontWeight: '900',
    fontSize: 12,
  },
  gridWrap: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F3F7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2A2A2A',
    textAlign: 'center',
  },
});