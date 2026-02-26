import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Config } from '../../constants/config';
import { uploadFileFromUri } from '../../services/uploadBackgroundDoc';

const ILLUSTRATION = require('../../assets/images/vehicle-hero.png');

const DISCLAIMER =
  'ข้าพเจ้าได้กรอกข้อมูลนี้ถูกต้องครบถ้วน หากตรวจสอบแล้วพบว่าข้อมูลไม่ถูกต้อง ข้าพเจ้ายินยอมให้ข้อมูลเป็นโมฆะและยินยอมให้ระบบทำการเปลี่ยนแปลงข้อมูลให้เป็นไปตามความจริง ข้าพเจ้าได้ตรวจสอบและยินยอมให้ระบบทำการเปลี่ยนแปลงข้อมูลให้เป็นไปตามความจริง ข้าพเจ้าตกลงที่จะดำเนินการแก้ไขข้อมูลภายใน 14 วันนับจากวันที่ได้รับแจ้ง มิฉะนั้นการทำงานของข้าพเจ้าอาจถูกระงับชั่วคราว';

const FIELDS = [
  { key: 'vehicleRegistrationNo', label: 'ทะเบียนรถ', placeholder: '' },
  { key: 'vehicleBrand', label: 'ยี่ห้อรถของคุณคืออะไร?', placeholder: '' },
  { key: 'vehicleModel', label: 'รุ่นรถของคุณคืออะไร?', placeholder: '' },
  { key: 'vehicleColor', label: 'สีของรถคุณ', placeholder: '' },
  { key: 'vehicleYear', label: 'ปีที่ผลิต (ค.ศ.)', placeholder: '' },
  { key: 'vehicleRegistrationProvince', label: 'จังหวัดจดทะเบียนรถ', placeholder: '' },
  { key: 'vehicleFuel', label: 'เชื้อเพลิง', placeholder: '' },
  { key: 'vehicleEngineCc', label: 'เครื่องยนต์ (CC)', placeholder: '' },
  { key: 'rightsHolderName', label: 'ชื่อเจ้าของสิทธิ์', placeholder: '' },
  { key: 'rightsHolderId', label: 'เลขที่บัตรผู้ถือกรรมสิทธิ์', placeholder: '' },
  { key: 'possessorName', label: 'ผู้ครอบครอง', placeholder: '' },
  { key: 'possessorId', label: 'เลขบัตรผู้ครอบครอง', placeholder: '' },
] as const;

type FieldKey = (typeof FIELDS)[number]['key'];

function getInitialValues(): Record<FieldKey, string> {
  return FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {} as Record<FieldKey, string>);
}

export default function VehicleRegistrationScreen() {
  const router = useRouter();
  const { registrationId } = useLocalSearchParams<{ registrationId?: string }>();
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState(getInitialValues);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoUploadUrl, setPhotoUploadUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [disclaimerAgreed, setDisclaimerAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateField = (key: FieldKey, text: string) => {
    setValues((prev) => ({ ...prev, [key]: text }));
  };

  const pickAndUploadPhoto = async () => {
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
    setPhotoUri(uri);
    setUploading(true);
    try {
      const url = await uploadFileFromUri(uri, { prefix: 'vehicle-book' });
      setPhotoUploadUrl(url);
    } catch (e) {
      console.error(e);
      Alert.alert('อัปโหลดไม่สำเร็จ', e instanceof Error ? e.message : 'กรุณาลองใหม่');
    } finally {
      setUploading(false);
    }
  };

  const canContinue = disclaimerAgreed && photoUploadUrl;

  const handleContinue = async () => {
    if (!canContinue) return;
    const regId = (registrationId ?? '').trim();
    if (!regId) {
      Alert.alert('ไม่พบข้อมูลการสมัคร', 'กรุณาทำขั้นตอนสมัครให้ครบก่อน', [
        { text: 'ตกลง', onPress: () => router.replace('/(tabs)') },
      ]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${Config.API_URL}/riders/registrations/${encodeURIComponent(regId)}/vehicle-book`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleBookPhotoUri: photoUploadUrl,
            vehicleRegistrationNo: values.vehicleRegistrationNo.trim() || undefined,
            vehicleBrand: values.vehicleBrand.trim() || undefined,
            vehicleModel: values.vehicleModel.trim() || undefined,
            vehicleColor: values.vehicleColor.trim() || undefined,
            vehicleYear: values.vehicleYear.trim() || undefined,
            vehicleRegistrationProvince: values.vehicleRegistrationProvince.trim() || undefined,
            vehicleFuel: values.vehicleFuel.trim() || undefined,
            vehicleEngineCc: values.vehicleEngineCc.trim() || undefined,
            rightsHolderName: values.rightsHolderName.trim() || undefined,
            rightsHolderId: values.rightsHolderId.trim() || undefined,
            possessorName: values.possessorName.trim() || undefined,
            possessorId: values.possessorId.trim() || undefined,
            vehicleBookDisclaimerAgreed: true,
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Request failed ${res.status}`);
      }
      router.replace({
        pathname: '/plate-color',
        params: { registrationId: regId },
      } as any);
    } catch (e) {
      console.error(e);
      Alert.alert('เกิดข้อผิดพลาด', e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          เล่มรถ
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.content, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.illustration}>
            <Image source={ILLUSTRATION} style={s.illustrationImage} resizeMode="cover" />
          </View>

          <Text style={s.title}>รูปรายการจดทะเบียนรถ</Text>
          <Text style={s.subtitle}>(เล่มรถ)</Text>
          <Text style={s.intro}>กรณีที่ผู้สมัครเป็นเจ้าของรถ*</Text>

          <View style={s.uploadRow}>
            <View style={s.uploadBox}>
              <TouchableOpacity
                style={s.uploadTouch}
                onPress={pickAndUploadPhoto}
                disabled={uploading}
                activeOpacity={0.8}
              >
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={s.uploadImage} resizeMode="cover" />
                ) : uploading ? (
                  <ActivityIndicator size="large" color="#0E3A78" />
                ) : (
                  <>
                    <Ionicons name="add" size={36} color="#94A3B8" />
                    <Text style={s.uploadLabel}>Upload Photo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/vehicle-registration/guidelines')}
            style={s.guidelineLink}
          >
            <Text style={s.guidelineLinkText}>ดูตัวอย่างการอัปโหลดเอกสาร</Text>
            <Ionicons name="chevron-forward" size={18} color="#0E3A78" />
          </TouchableOpacity>

          {FIELDS.map(({ key, label }) => (
            <View key={key} style={s.fieldWrap}>
              <Text style={s.fieldLabel}>{label}</Text>
              <TextInput
                style={s.input}
                value={values[key]}
                onChangeText={(t) => updateField(key, t)}
                placeholder={`${label}...`}
                placeholderTextColor="#94A3B8"
              />
            </View>
          ))}

          <TouchableOpacity
            style={s.checkRow}
            onPress={() => setDisclaimerAgreed(!disclaimerAgreed)}
            activeOpacity={0.7}
          >
            <View style={[s.checkbox, disclaimerAgreed && s.checkboxActive]}>
              {disclaimerAgreed && <Ionicons name="checkmark" size={16} color="#FFF" />}
            </View>
            <Text style={s.disclaimerText}>{DISCLAIMER}</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={[s.footer, { paddingBottom: Math.max(24, insets.bottom + 12) }]}>
          <TouchableOpacity
            style={[s.continueBtn, (!canContinue || loading) && s.continueBtnDisabled]}
            disabled={!canContinue || loading}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={s.continueText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  content: { padding: 20 },
  illustration: {
    height: 140,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#BFDBFE',
  },
  illustrationImage: { width: '100%', height: '100%' },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 16, color: '#64748B', marginBottom: 4 },
  intro: { fontSize: 14, color: '#334155', marginBottom: 16 },
  uploadRow: { flexDirection: 'row', marginBottom: 8 },
  uploadBox: {
    width: 120,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  uploadTouch: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadImage: { width: '100%', height: '100%' },
  uploadLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  guidelineLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  guidelineLinkText: { fontSize: 14, color: '#0E3A78', marginRight: 4 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 14, color: '#334155', marginBottom: 6 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0F172A',
  },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8, marginBottom: 16 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: '#0E3A78', borderColor: '#0E3A78' },
  disclaimerText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 20 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  continueBtn: {
    backgroundColor: '#0E3A78',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueBtnDisabled: { backgroundColor: '#94A3B8', opacity: 0.8 },
  continueText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
