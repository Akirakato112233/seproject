import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRegistrationStore } from '../../../stores/registrationStore';

export default function Step8Screen() {
  const router = useRouter();
  const { setStep } = useRegistrationStore();

  useEffect(() => {
    setStep(8);
  }, []);

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <View style={s.content}>
        <View style={s.iconWrap}>
          <Text style={s.icon}>🕐</Text>
        </View>
        <Text style={s.title}>ส่งคำขอเรียบร้อยแล้ว!</Text>
        <Text style={s.desc}>ระยะเวลา 1–3 วันทำการ</Text>

        <View style={s.checklist}>
          <View style={s.checkItem}>
            <Text style={s.checkDone}>✅</Text>
            <Text style={s.checkText}>ส่งเอกสารครบแล้ว</Text>
          </View>
          <View style={s.checkItem}>
            <Text style={s.checkPending}>🔄</Text>
            <Text style={s.checkText}>กำลังตรวจสอบเอกสาร KYC</Text>
          </View>
          <View style={s.checkItem}>
            <Text style={s.checkWait}>⏳</Text>
            <Text style={s.checkText}>รอการอนุมัติจาก Admin</Text>
          </View>
          <View style={s.checkItem}>
            <Text style={s.checkEmpty}>○</Text>
            <Text style={s.checkText}>เปิดร้านได้!</Text>
          </View>
        </View>

        <View style={s.contactBox}>
          <Text style={s.contactTitle}>ติดต่อฝ่ายสนับสนุน</Text>
          <Text style={s.contactItem}>โทร: 0864932918</Text>
          <Text style={s.contactItem}>Line OA: @WIT</Text>
          <Text style={s.contactItem}>อีเมล: WIT@gmail.com</Text>
        </View>

        <Text
          style={s.link}
          onPress={() => {
            setStep(9);
            router.push('/signup/onboarding/step-9');
          }}
        >
          จำลองอนุมัติแล้ว (สำหรับทดสอบ)
        </Text>
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: { fontSize: 40 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    fontSize: 16,
    color: '#666',
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
  checkPending: { fontSize: 18 },
  checkWait: { fontSize: 18 },
  checkEmpty: { fontSize: 18, color: '#ccc' },
  checkText: { fontSize: 16, color: '#333' },
  contactBox: {
    alignSelf: 'stretch',
    backgroundColor: '#F5F5F5',
    padding: 20,
    borderRadius: 12,
    gap: 8,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  contactItem: { fontSize: 14, color: '#666' },
  link: {
    marginTop: 24,
    fontSize: 14,
    color: '#0E3A78',
    textDecorationLine: 'underline',
  },
});
