import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRegistrationStore } from '../../../stores/registrationStore';
import { API, NGROK_HEADERS } from '../../../config';

export default function Step9Screen() {
  const router = useRouter();
  const { setStep, formData, businessType, merchantUserId } = useRegistrationStore();
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    setStep(9);
  }, []);

  const shopName = formData.shop_name || 'ร้านของคุณ';

  const publishShop = async () => {
    if (!merchantUserId) return;
    try {
      setPublishing(true);
      await fetch(API.SHOPS_PUBLISH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
        body: JSON.stringify({ merchantUserId }),
      }).catch(() => undefined);
    } finally {
      setPublishing(false);
    }
  };

  const openShop = async () => {
    await publishShop();
    if (businessType === 'coin') {
      router.replace('/(coin)');
    } else {
      router.replace('/(tabs)');
    }
  };

  const viewDashboard = () => {
    if (businessType === 'coin') {
      router.replace('/(coin)');
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <View style={s.content}>
        <View style={s.iconWrap}>
          <Text style={s.icon}>✓</Text>
        </View>
        <Text style={s.title}>อนุมัติแล้ว เปิดร้านได้!</Text>
        <Text style={s.shopName}>{shopName}</Text>

        <View style={s.checklist}>
          <View style={s.checkItem}>
            <Text style={s.checkDone}>✅</Text>
            <Text style={s.checkText}>ลงทะเบียนร้านสำเร็จ</Text>
          </View>
          <View style={s.checkItem}>
            <Text style={s.checkDone}>✅</Text>
            <Text style={s.checkText}>เอกสารได้รับการอนุมัติ</Text>
          </View>
          <View style={s.checkItem}>
            <Text style={s.checkEmpty}>○</Text>
            <Text style={s.checkText}>เปิดสถานะรับออเดอร์ครั้งแรก</Text>
          </View>
          <View style={s.checkItem}>
            <Text style={s.checkEmpty}>○</Text>
            <Text style={s.checkText}>แชร์ลิงก์ร้านให้ลูกค้า</Text>
          </View>
        </View>

        <TouchableOpacity
          style={s.primaryBtn}
          onPress={openShop}
          activeOpacity={0.85}
          disabled={publishing}
        >
          {publishing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.primaryBtnText}>เปิดรับออเดอร์เลย!</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={s.secondaryBtn} onPress={viewDashboard} activeOpacity={0.85}>
          <Text style={s.secondaryBtnText}>ดู Dashboard ก่อน</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: { fontSize: 48, color: '#fff', fontWeight: 'bold' },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
    marginBottom: 8,
    textAlign: 'center',
  },
  shopName: {
    fontSize: 18,
    color: '#0E3A78',
    fontWeight: '600',
    marginBottom: 32,
  },
  checklist: {
    alignSelf: 'stretch',
    gap: 16,
    marginBottom: 32,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkDone: { fontSize: 18 },
  checkEmpty: { fontSize: 18, color: '#ccc' },
  checkText: { fontSize: 16, color: '#333' },
  primaryBtn: {
    alignSelf: 'stretch',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0E3A78',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryBtn: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#0E3A78',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0E3A78',
  },
});
