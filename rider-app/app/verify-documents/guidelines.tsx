import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// ตัวอย่างเอกสาร 2 รูป (เปลี่ยน path ให้ตรงกับไฟล์จริงใน assets/images)
const SAMPLE_1 = require('../../assets/images/verify-doc-sample-1.png');
const SAMPLE_2 = require('../../assets/images/verify-doc-sample-2.png');

const REQUIREMENTS = [
  'The full name and national ID number must be clearly visible',
  'The verification result and issue date must be shown',
  'The document must be issued within the last 30 days',
  'The image must show the entire document, with all edges visible',
];

const AVOID = [
  'Do not edit, alter, or obscure any part of the document',
  'Ensure no fingers or objects cover the document',
];

export default function GuidelinesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Document Upload Guidelines</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* รูปบน: ตัวอย่างเอกสารรูปแรก (เต็มความกว้าง) */}
        <View style={s.sampleBoxSingle}>
          <Image source={SAMPLE_1} style={s.sampleImage} resizeMode="contain" />
        </View>

        {/* ข้อความไทยเหนือรูปล่าง */}
        <Text style={s.sampleSectionTitle}>
          ถ้าตรวจพบประวัติอาชญากรรม ต้องแนบเอกสารที่ตรวจพบเข้ามาด้วย
        </Text>
        {/* รูปล่าง: ตัวอย่างเอกสารรูปที่สอง (เต็มความกว้าง) */}
        <View style={s.sampleBoxSingle}>
          <Image source={SAMPLE_2} style={s.sampleImage} resizeMode="contain" />
        </View>
        <Text style={s.sampleLabelCenter}>Sample Document</Text>

        {/* Requirements */}
        <View style={s.requirementRow}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text style={s.sectionTitle}>Requirements:</Text>
        </View>
        {REQUIREMENTS.map((item, i) => (
          <View key={i} style={s.bulletRow}>
            <Text style={s.bullet}>•</Text>
            <Text style={s.bulletText}>{item}</Text>
          </View>
        ))}

        {/* Things to avoid */}
        <View style={s.requirementRow}>
          <Ionicons name="close-circle" size={24} color="#EF4444" />
          <Text style={s.sectionTitle}>Things to avoid:</Text>
        </View>
        {AVOID.map((item, i) => (
          <View key={i} style={s.bulletRow}>
            <Text style={s.bullet}>•</Text>
            <Text style={s.bulletText}>{item}</Text>
          </View>
        ))}
      </ScrollView>
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
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  sampleBoxSingle: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#93C5FD',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  sampleImage: { width: '100%', height: '100%' },
  sampleSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginTop: 8,
    marginBottom: 12,
    lineHeight: 20,
  },
  sampleLabelCenter: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 8,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  bullet: { fontSize: 16, color: '#475569', marginRight: 8 },
  bulletText: { flex: 1, fontSize: 14, color: '#475569', lineHeight: 22 },
});

