import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Config } from '../../constants/config';

const ILLUSTRATION = require('../../assets/images/verify-doc-hero.png');

const CONSENT_DOCUMENTS =
  'I certify that the documents submitted to WIT are true, correct, and complete in every respect.';

const CONSENT_HEALTH =
  'I confirm that every time I accept a Grab job, I am in good health, free from serious infectious diseases, have no symptoms of coughing, sneezing, or other basic infectious diseases, and my body temperature is below 37.5 degrees Celsius. If I experience any of the aforementioned symptoms, I will stop accepting work and see a doctor.';

export default function ConsentSectionScreen() {
  const router = useRouter();
  const { registrationId } = useLocalSearchParams<{ registrationId?: string }>();
  const insets = useSafeAreaInsets();
  const [consentDocuments, setConsentDocuments] = useState(false);
  const [consentHealth, setConsentHealth] = useState(false);
  const [loading, setLoading] = useState(false);

  const canContinue = consentDocuments && consentHealth;

  const handleContinue = async () => {
    if (!canContinue) return;
    const regId = (registrationId ?? '').trim();
    if (!regId) {
      Alert.alert(
        'ไม่พบข้อมูลการสมัคร',
        'กรุณาทำขั้นตอนสมัครให้ครบก่อน',
        [{ text: 'ตกลง', onPress: () => router.replace('/(tabs)') }],
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${Config.API_URL}/riders/registrations/${encodeURIComponent(regId)}/consent`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consentDocumentsTrue: true,
            consentHealthDeclaration: true,
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Request failed ${res.status}`);
      }
      router.replace({
        pathname: '/terms-and-info',
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
        <Text style={s.headerTitle}>Consent Section</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator
      >
        <View style={s.illustration}>
          <Image source={ILLUSTRATION} style={s.illustrationImage} resizeMode="cover" />
        </View>

        <Text style={s.sectionTitle}>Consent Section</Text>

        <TouchableOpacity
          style={s.checkRow}
          onPress={() => setConsentDocuments(!consentDocuments)}
          activeOpacity={0.7}
        >
          <View style={[s.checkbox, consentDocuments && s.checkboxActive]}>
            {consentDocuments && <Ionicons name="checkmark" size={16} color="#FFF" />}
          </View>
          <Text style={s.checkText}>{CONSENT_DOCUMENTS}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.checkRow}
          onPress={() => setConsentHealth(!consentHealth)}
          activeOpacity={0.7}
        >
          <View style={[s.checkbox, consentHealth && s.checkboxActive]}>
            {consentHealth && <Ionicons name="checkmark" size={16} color="#FFF" />}
          </View>
          <Text style={s.checkText}>{CONSENT_HEALTH}</Text>
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
    height: 160,
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  illustrationImage: { width: '100%', height: '100%' },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 20,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
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
  checkboxActive: {
    backgroundColor: '#0E3A78',
    borderColor: '#0E3A78',
  },
  checkText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
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
  continueBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.8,
  },
  continueText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
