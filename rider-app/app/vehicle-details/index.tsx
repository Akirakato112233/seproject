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

const ILLUSTRATION = require('../../assets/images/vehicle-hero.png');

const QUESTION = 'Do you have the vehicle registration book ready?*';

const OPTIONS = [
    { value: 'ready' as const, label: 'I have the vehicle and the registration book ready.' },
    {
        value: 'submit_later' as const,
        label: 'I have the vehicle, but I want to submit the registration book later',
    },
];

export default function VehicleDetailsScreen() {
    const router = useRouter();
    const { registrationId } = useLocalSearchParams<{ registrationId?: string }>();
    const insets = useSafeAreaInsets();
    const [value, setValue] = useState<'ready' | 'submit_later' | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);

    const canContinue = value !== null;
    const selectedOption = value !== null ? OPTIONS.find((o) => o.value === value) : null;

    const handleContinue = async () => {
        if (!canContinue || !value) return;
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
                `${Config.API_URL}/riders/registrations/${encodeURIComponent(regId)}/vehicle-details`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ vehicleRegistrationBook: value }),
                }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || `Request failed ${res.status}`);
            }

            // ถ้ามีเล่มทะเบียนพร้อม ให้ไปหน้าอัปโหลดเล่มรถเลย
            if (value === 'ready') {
                router.replace({
                    pathname: '/vehicle-registration',
                    params: { registrationId: regId },
                } as any);
            } else {
                // ยังไม่มีเล่มทะเบียน → ไปกรอกข้อมูลต่อ
                router.replace({
                    pathname: '/plate-color',
                    params: { registrationId: regId },
                } as any);
            }
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
                <Text style={s.headerTitle}>Vehicle Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={s.scroll}
                contentContainerStyle={[s.content, { paddingBottom: 100 }]}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
            >
                <View style={s.illustration}>
                    <Image source={ILLUSTRATION} style={s.illustrationImage} resizeMode="cover" />
                </View>

                <Text style={s.title}>Vehicle Details</Text>
                <Text style={s.question}>{QUESTION}</Text>

                <TouchableOpacity
                    style={[s.selectWrap, showDropdown && s.selectWrapOpen]}
                    onPress={() => setShowDropdown(!showDropdown)}
                    activeOpacity={0.8}
                >
                    <Text
                        style={[s.selectText, !selectedOption && s.selectPlaceholder]}
                        numberOfLines={2}
                    >
                        {selectedOption ? selectedOption.label : 'Select an option'}
                    </Text>
                    <Ionicons
                        name={showDropdown ? 'chevron-up' : 'chevron-down'}
                        size={22}
                        color="#64748B"
                    />
                </TouchableOpacity>

                {showDropdown && (
                    <View style={s.dropdown}>
                        {OPTIONS.map((opt, index) => (
                            <React.Fragment key={opt.value}>
                                {index > 0 && <View style={s.optionDivider} />}
                                <TouchableOpacity
                                    style={s.option}
                                    onPress={() => {
                                        setValue(opt.value);
                                        setShowDropdown(false);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={s.optionText}>{opt.label}</Text>
                                </TouchableOpacity>
                            </React.Fragment>
                        ))}
                    </View>
                )}
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
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 16,
    },
    question: {
        fontSize: 16,
        color: '#334155',
        lineHeight: 24,
        marginBottom: 12,
    },
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
    selectWrapOpen: {
        borderColor: '#0E3A78',
        backgroundColor: '#DBEAFE',
    },
    selectText: {
        fontSize: 16,
        color: '#0F172A',
        flex: 1,
    },
    selectPlaceholder: {
        color: '#94A3B8',
    },
    dropdown: {
        marginTop: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    option: {
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    optionDivider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 12,
    },
    optionText: {
        fontSize: 16,
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
