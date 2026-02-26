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
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Config } from '../../constants/config';

const ILLUSTRATION = require('../../assets/images/consent-hero.png');

const INTRO =
  'By proceeding, I acknowledge that my personal data will be processed for my application (including background checks, linking my existing Grab account to apply for and manage a Grab wallet, and for other related purposes). I further acknowledge that by submitting my application, I have read, understood, and agreed to:';

const LEGAL_ITEMS = [
  { key: 'privacy', label: "WIT's Privacy Notice" },
  { key: 'termsTransport', label: 'Terms of Service: WIT Transport, Delivery and Logistics' },
  { key: 'termsPayments', label: 'Terms of Service: WIT Payments and Rewards' },
  { key: 'termsFamily', label: 'Terms of Service for Family Account' },
  { key: 'codeOfConduct', label: 'WIT Code of Business Conduct' },
] as const;

const MARKETING_ITEMS = [
  { key: 'sms', label: 'SMS' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'push', label: 'Push Notification' },
  { key: 'chat', label: 'Chat Application (e.g., Viber, Zalo, Telegram, WhatsApp)' },
] as const;

type LegalKey = (typeof LEGAL_ITEMS)[number]['key'];
type MarketingKey = (typeof MARKETING_ITEMS)[number]['key'];

export default function TermsAndInfoScreen() {
  const router = useRouter();
  const { registrationId } = useLocalSearchParams<{ registrationId?: string }>();
  const insets = useSafeAreaInsets();
  const [legal, setLegal] = useState<Record<LegalKey, boolean>>({
    privacy: false,
    termsTransport: false,
    termsPayments: false,
    termsFamily: false,
    codeOfConduct: false,
  });
  const [marketing, setMarketing] = useState<Record<MarketingKey, boolean>>({
    sms: false,
    phone: false,
    email: false,
    push: false,
    chat: false,
  });
  const [loading, setLoading] = useState(false);

  const allLegalChecked = LEGAL_ITEMS.every((item) => legal[item.key]);
  const canContinue = allLegalChecked;

  const toggleLegal = (key: LegalKey) => setLegal((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleMarketing = (key: MarketingKey) =>
    setMarketing((prev) => ({ ...prev, [key]: !prev[key] }));

  const openLink = (label: string) => {
    // Placeholder: could open in-app browser or external URL per document
    Linking.openURL('https://www.wit.co.th').catch(() => {});
  };

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
        `${Config.API_URL}/riders/registrations/${encodeURIComponent(regId)}/terms-and-info`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agreedPrivacyNotice: legal.privacy,
            agreedTermsTransport: legal.termsTransport,
            agreedTermsPayments: legal.termsPayments,
            agreedTermsFamilyAccount: legal.termsFamily,
            agreedCodeOfConduct: legal.codeOfConduct,
            marketingSms: marketing.sms,
            marketingPhone: marketing.phone,
            marketingEmail: marketing.email,
            marketingPush: marketing.push,
            marketingChat: marketing.chat,
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Request failed ${res.status}`);
      }
      router.replace({
        pathname: '/questionnaire',
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
          Terms &amp; Conditions
        </Text>
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

        <Text style={s.mainTitle}>Terms, Conditions, and Receipt of Information</Text>
        <Text style={s.intro}>{INTRO}</Text>

        {LEGAL_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={s.checkRow}
            onPress={() => toggleLegal(item.key)}
            activeOpacity={0.7}
          >
            <View style={[s.checkbox, legal[item.key] && s.checkboxActive]}>
              {legal[item.key] && <Ionicons name="checkmark" size={16} color="#FFF" />}
            </View>
            <TouchableOpacity
              onPress={() => openLink(item.label)}
              style={s.linkWrap}
              activeOpacity={0.8}
            >
              <Text style={s.linkText}>{item.label}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <Text style={s.sectionTitle}>Offers from WIT</Text>
        <Text style={s.sectionIntro}>
          I wish to be contacted to receive promotional information, events, and for other marketing
          purposes via:
        </Text>
        {MARKETING_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={s.checkRow}
            onPress={() => toggleMarketing(item.key)}
            activeOpacity={0.7}
          >
            <View style={[s.checkbox, marketing[item.key] && s.checkboxActive]}>
              {marketing[item.key] && <Ionicons name="checkmark" size={16} color="#FFF" />}
            </View>
            <Text style={s.checkText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', flex: 1 },
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
  mainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  intro: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 20,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
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
  linkWrap: { flex: 1 },
  linkText: {
    fontSize: 15,
    color: '#0E3A78',
    lineHeight: 22,
    textDecorationLine: 'underline',
  },
  checkText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
    marginBottom: 8,
  },
  sectionIntro: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 12,
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
