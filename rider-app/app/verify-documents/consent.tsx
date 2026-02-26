import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConsentScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Terms &amp; Consent</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <Text style={s.title}>คำยินยอมในการตรวจสอบประวัติ</Text>

        <View style={s.card}>
          <Text style={s.paragraph}>
            ข้าพเจ้ายินยอมให้ผู้ให้บริการแอปพลิเคชัน ใช้ข้อมูลจากบัตรประชาชนและเอกสารประกอบที่ข้าพเจ้าให้ไว้ เพื่อดำเนินการตรวจสอบประวัติ (Background Check) ตามที่กฎหมายหรือนโยบายของแพลตฟอร์มกำหนด
          </Text>
          <Text style={s.paragraph}>
            ข้าพเจ้าเข้าใจว่าข้อมูลดังกล่าวจะถูกเก็บรักษาอย่างปลอดภัย และใช้เฉพาะเพื่อวัตถุประสงค์ในการตรวจสอบเท่านั้น ผู้ให้บริการจะไม่เปิดเผยข้อมูลต่อบุคคลที่สามโดยไม่มีความจำเป็นหรือโดยไม่ได้รับความยินยอมจากข้าพเจ้า เว้นแต่ต้องปฏิบัติตามกฎหมาย
          </Text>
          <Text style={[s.paragraph, { marginBottom: 0 }]}>
            ข้าพเจ้ายืนยันว่าข้อมูลที่ให้ไว้เป็นความจริงและครบถ้วน หากพบว่าข้อมูลไม่ถูกต้อง ข้าพเจ้ารับทราบว่าอาจส่งผลต่อการพิจารณาหรือการให้บริการในแพลตฟอร์มนี้
          </Text>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.submitBtn} onPress={() => router.back()}>
          <Text style={s.submitText}>เข้าใจและกลับไปหน้าหลัก</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  backBtn: { padding: 4 },
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paragraph: { fontSize: 15, color: '#475569', lineHeight: 24, marginBottom: 16 },
  footer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  submitBtn: {
    backgroundColor: '#0E3A78',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

