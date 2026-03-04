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
    TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Config } from '../../constants/config';

const ILLUSTRATION = require('../../assets/images/vehicle-hero.png');

const OWNER_OPTIONS = [
    { value: 'self' as const, label: 'ชื่อตรงกับผู้สมัคร' },
    { value: 'relative' as const, label: 'ชื่อคนอื่น หรือ ญาติ' },
    { value: 'company' as const, label: 'ชื่อบริษัท / นิติบุคคล' },
];

const RELATION_OPTIONS = ['บิดา มารดา', 'พี่น้อง', 'ญาติ', 'สามี ภรรยา', 'แฟน', 'เพื่อน'];

const CONSENT_TEXT =
    'ข้าพเจ้ารับรองว่าข้าพเจ้าได้รับความยินยอมจากเจ้าของกรรมสิทธิ์และผู้ครอบครองรถในการปรึกษา/ รถจักรยานยนต์นี้ในการให้บริการผ่านแอปพลิเคชัน WIT ตลอดระยะเวลาที่ข้าพเจ้าใช้บริการบนแพลตฟอร์ม WIT ในการให้บริการแก่ผู้บริโภคหรือบุคคลที่สาม';

export default function OwnershipScreen() {
    const router = useRouter();
    const { registrationId } = useLocalSearchParams<{ registrationId?: string }>();
    const insets = useSafeAreaInsets();
    const [ownerType, setOwnerType] = useState<'self' | 'relative' | 'company' | null>(null);
    const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
    const [relation, setRelation] = useState<string | null>(null);
    const [showRelationDropdown, setShowRelationDropdown] = useState(false);
    const [holderName, setHolderName] = useState('');
    const [consent, setConsent] = useState(false);
    const [loading, setLoading] = useState(false);

    const ownerSelected = ownerType ? OWNER_OPTIONS.find((o) => o.value === ownerType) : null;
    const isRelationRequired = ownerType === 'relative';
    const canContinue =
        !!ownerType &&
        holderName.trim().length > 0 &&
        consent &&
        (!isRelationRequired || !!relation);

    const handleContinue = async () => {
        if (!canContinue || !ownerType) return;
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
                `${Config.API_URL}/riders/registrations/${encodeURIComponent(regId)}/ownership`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ownershipType: ownerType,
                        ownershipRelation: relation ?? undefined,
                        ownershipHolderName: holderName.trim(),
                        ownershipConsentAgreed: true,
                    }),
                }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || `Request failed ${res.status}`);
            }
            router.replace({
                pathname: '/package',
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
                <Text style={s.headerTitle}>กรรมสิทธิ์เจ้าของรถ</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={s.scroll}
                contentContainerStyle={[s.content, { paddingBottom: 120 }]}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
            >
                <View style={s.illustration}>
                    <Image source={ILLUSTRATION} style={s.illustrationImage} resizeMode="cover" />
                </View>

                <Text style={s.title}>กรรมสิทธิ์เจ้าของรถ</Text>

                {/* Owner type */}
                <Text style={s.label}>ผู้ครอบครอง</Text>
                <TouchableOpacity
                    style={[s.selectWrap, showOwnerDropdown && s.selectWrapOpen]}
                    onPress={() => {
                        setShowOwnerDropdown(!showOwnerDropdown);
                        setShowRelationDropdown(false);
                    }}
                    activeOpacity={0.8}
                >
                    <Text style={[s.selectText, !ownerSelected && s.selectPlaceholder]}>
                        {ownerSelected ? ownerSelected.label : 'เลือกประเภทเจ้าของกรรมสิทธิ์'}
                    </Text>
                    <Ionicons
                        name={showOwnerDropdown ? 'chevron-up' : 'chevron-down'}
                        size={22}
                        color="#64748B"
                    />
                </TouchableOpacity>
                {showOwnerDropdown && (
                    <View style={s.dropdown}>
                        {OWNER_OPTIONS.map((opt, index) => (
                            <React.Fragment key={opt.value}>
                                {index > 0 && <View style={s.optionDivider} />}
                                <TouchableOpacity
                                    style={s.option}
                                    onPress={() => {
                                        setOwnerType(opt.value);
                                        setShowOwnerDropdown(false);
                                        setRelation(null);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={s.optionText}>{opt.label}</Text>
                                </TouchableOpacity>
                            </React.Fragment>
                        ))}
                    </View>
                )}

                {/* Relation dropdown — แสดงเฉพาะเมื่อเลือก \"ชื่อคนอื่น หรือ ญาติ\" */}
                {ownerType === 'relative' && (
                    <>
                        <Text style={[s.label, { marginTop: 16 }]}>ความสัมพันธ์</Text>
                        <TouchableOpacity
                            style={[s.selectWrap, showRelationDropdown && s.selectWrapOpen]}
                            onPress={() => {
                                setShowRelationDropdown(!showRelationDropdown);
                                setShowOwnerDropdown(false);
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={[s.selectText, !relation && s.selectPlaceholder]}>
                                {relation ?? 'เลือกความสัมพันธ์'}
                            </Text>
                            <Ionicons
                                name={showRelationDropdown ? 'chevron-up' : 'chevron-down'}
                                size={22}
                                color="#64748B"
                            />
                        </TouchableOpacity>
                        {showRelationDropdown && (
                            <View style={s.dropdown}>
                                {RELATION_OPTIONS.map((opt, index) => (
                                    <React.Fragment key={opt}>
                                        {index > 0 && <View style={s.optionDivider} />}
                                        <TouchableOpacity
                                            style={s.option}
                                            onPress={() => {
                                                setRelation(opt);
                                                setShowRelationDropdown(false);
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={s.optionText}>{opt}</Text>
                                        </TouchableOpacity>
                                    </React.Fragment>
                                ))}
                            </View>
                        )}
                    </>
                )}

                {/* Holder name */}
                <View style={s.fieldWrap}>
                    <Text style={s.label}>ชื่อผู้ถือกรรมสิทธิ์</Text>
                    <TextInput
                        style={s.input}
                        value={holderName}
                        onChangeText={setHolderName}
                        placeholder="ชื่อผู้ถือกรรมสิทธิ์"
                        placeholderTextColor="#94A3B8"
                    />
                </View>

                {/* Consent */}
                <TouchableOpacity
                    style={s.checkRow}
                    onPress={() => setConsent(!consent)}
                    activeOpacity={0.7}
                >
                    <View style={[s.checkbox, consent && s.checkboxActive]}>
                        {consent && <Ionicons name="checkmark" size={16} color="#FFF" />}
                    </View>
                    <Text style={s.consentText}>{CONSENT_TEXT}</Text>
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
        backgroundColor: '#BFDBFE',
    },
    illustrationImage: { width: '100%', height: '100%' },
    title: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 16 },
    label: { fontSize: 14, color: '#334155', marginBottom: 6 },
    selectWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        minHeight: 52,
    },
    selectWrapOpen: { borderColor: '#0E3A78', backgroundColor: '#DBEAFE' },
    selectText: { fontSize: 16, color: '#0F172A', flex: 1 },
    selectPlaceholder: { color: '#94A3B8' },
    dropdown: {
        marginTop: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        marginBottom: 4,
    },
    option: { paddingVertical: 16, paddingHorizontal: 16 },
    optionDivider: { height: 1, backgroundColor: '#E2E8F0', marginHorizontal: 12 },
    optionText: { fontSize: 16, color: '#334155' },
    fieldWrap: { marginTop: 16, marginBottom: 8 },
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
    checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 16 },
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
    consentText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 20 },
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
