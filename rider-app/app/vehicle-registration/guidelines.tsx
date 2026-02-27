import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { uploadFileFromUri } from '../../services/uploadBackgroundDoc';

const SAMPLE_DOC = require('../../assets/images/vehicle-book-sample.jpg');

const REQUIREMENTS = [
  'ต้องเป็น หน้าเล่มรถจริง (ไม่ใช่สำเนาเอกสารอื่น)',
  'เห็นข้อมูล ทะเบียนรถ / ยี่ห้อ / รุ่น / เลขตัวถัง ชัดเจน',
  'เห็นข้อมูล ชื่อ-นามสกุลเจ้าของรถ ครบถ้วน',
  'ภาพต้องเห็นเอกสาร ครบทั้งหน้า ไม่มีการตัดขอบ',
];

const AVOID = [
  'ห้ามถ่ายภาพเบลอ มืด หรือมีแสงสะท้อน',
  'ห้ามมีนิ้วมือหรือวัตถุบังข้อมูล',
  'ห้ามแก้ไข ตกแต่ง หรือปิดบังข้อมูลใด ๆ',
];

export default function VehicleBookGuidelinesScreen() {
  const router = useRouter();
  const { registrationId } = useLocalSearchParams<{ registrationId?: string }>();
  const insets = useSafeAreaInsets();
  const [uploading, setUploading] = useState(false);

  const handleUploadDocument = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('ต้องการสิทธิ์', 'กรุณาอนุญาตการเข้าถึงรูปภาพ');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setUploading(true);
    try {
      const url = await uploadFileFromUri(uri, { prefix: 'vehicle-book' });
      const regId = (registrationId ?? '').trim();
      router.replace({
        pathname: '/vehicle-registration',
        params: regId ? { registrationId: regId, photoUri: uri, photoUploadUrl: url } : { photoUri: uri, photoUploadUrl: url },
      } as any);
    } catch (e) {
      console.error(e);
      Alert.alert('อัปโหลดไม่สำเร็จ', e instanceof Error ? e.message : 'กรุณาลองใหม่');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>ตัวอย่างการอัปโหลดเอกสาร</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator
      >
        <View style={s.titleBlock}>
          <Text style={s.titleMain}>รายการจดทะเบียน</Text>
          <Text style={s.titleSub}>ใช้หน้าข้อมูลรถ และหน้าข้อมูลเจ้าของรถ</Text>
        </View>

        <View style={s.sampleBox}>
          <Image source={SAMPLE_DOC} style={s.sampleImage} resizeMode="contain" />
        </View>
        <Text style={s.sampleLabel}>ตัวอย่างเอกสาร</Text>

        <View style={s.sectionRow}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text style={s.sectionTitle}>ข้อกำหนดในการอัปโหลด:</Text>
        </View>
        {REQUIREMENTS.map((item, i) => (
          <View key={i} style={s.bulletRow}>
            <Text style={s.bullet}>•</Text>
            <Text style={s.bulletText}>{item}</Text>
          </View>
        ))}

        <View style={s.sectionRow}>
          <Ionicons name="close-circle" size={24} color="#EF4444" />
          <Text style={s.sectionTitle}>ข้อควรหลีกเลี่ยง:</Text>
        </View>
        {AVOID.map((item, i) => (
          <View key={i} style={s.bulletRow}>
            <Text style={s.bullet}>•</Text>
            <Text style={s.bulletText}>{item}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(24, insets.bottom + 12) }]}>
        <TouchableOpacity
          style={s.uploadBtn}
          onPress={handleUploadDocument}
          disabled={uploading}
          activeOpacity={0.85}
        >
          {uploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={s.uploadBtnText}>Upload Document</Text>
          )}
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
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  backBtn: { padding: 4 },
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20 },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 20,
  },
  titleMain: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0E3A78',
    marginBottom: 4,
  },
  titleSub: {
    fontSize: 15,
    color: '#0E3A78',
    textAlign: 'center',
  },
  sampleBox: {
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    minHeight: 200,
  },
  sampleImage: { width: '100%', height: 180 },
  sampleLabel: { fontSize: 13, color: '#64748B', marginBottom: 24 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginLeft: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  bullet: { fontSize: 14, color: '#475569', marginRight: 8 },
  bulletText: { flex: 1, fontSize: 14, color: '#475569', lineHeight: 20 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  uploadBtn: {
    backgroundColor: '#0E3A78',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
