import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    TextInput,
    Image,
    Modal,
    FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useSignup } from '../../context/SignupContext';
import { Config } from '../../constants/config';
import { API, NGROK_HEADERS } from '../../config';

const ILLUSTRATION = require('../../assets/images/package-hero.png');

// ตำบล/แขวง ทุกจังหวัด (แขวงในกรุงเทพ = ตำบลในจังหวัดอื่น ความหมายเดียวกัน)
const SUBDISTRICTS_BY_PROVINCE: Record<string, string[]> = require('../../data/thailandSubdistrictsByProvince.json');

const PROVINCES = Object.keys(SUBDISTRICTS_BY_PROVINCE).sort();

const PACKAGE_OPTIONS = [
    { value: '990', label: '990 บาท (กระเป๋าขนาดกลาง)' },
    { value: '1220', label: '1220 บาท (กระเป๋าขนาดใหญ่)' },
];

const DISCLAIMER =
    'ข้าพเจ้าขอรับรองว่าการเลือกซื้ออุปกรณ์ภาคสนามจะทำให้ข้าพเจ้าพร้อมสำหรับการให้บริการได้ทันที และรับทราบแล้วว่าการเลือกซื้อจะไม่สามารถยกเลิกได้ หากพหลังชำระมีการยกเลิกจะต้องใช้วิธีการเก็บเงินในรูปแบบอื่น ข้าพเจ้าต้องชำระอุปกรณ์ภาคสนามทั้งหมด เช่น กระเป๋าใส่อาหารและอุปกรณ์อื่น ทั้งหมดจาก WIT ร้านค้าพันธมิตร หรือ ศูนย์มืออาชีพเท่านั้น ที่ได้รับการรับรองโดยแพลตฟอร์มเท่านั้น';

export default function PackageScreen() {
    const router = useRouter();
    const { registrationId } = useLocalSearchParams<{ registrationId?: string }>();
    const { login } = useAuth();
    const { data: signupData } = useSignup();
    const insets = useSafeAreaInsets();
    const [province, setProvince] = useState('');
    const [district, setDistrict] = useState('');
    const [choice, setChoice] = useState<string | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [consent, setConsent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showProvinceModal, setShowProvinceModal] = useState(false);
    const [provinceSearch, setProvinceSearch] = useState('');
    const [showDistrictModal, setShowDistrictModal] = useState(false);
    const [districtSearch, setDistrictSearch] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');

    const subdistrictOptions = SUBDISTRICTS_BY_PROVINCE[province] || [];

    const isBuyingPackage = choice === '990' || choice === '1220';

    const onProvinceSelect = (p: string) => {
        setProvince(p);
        setDistrict('');
        setShowProvinceModal(false);
    };

    const selected = choice ? PACKAGE_OPTIONS.find((p) => p.value === choice) : null;
    const canContinue =
        province.trim().length > 0 &&
        district.trim().length > 0 &&
        !!choice &&
        consent &&
        (!isBuyingPackage || shippingAddress.trim().length > 0);

    const handleContinue = async () => {
        if (!canContinue || !choice) return;
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
                `${Config.API_URL}/riders/registrations/${encodeURIComponent(regId)}/package`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        packageProvince: province.trim(),
                        packageDistrict: district.trim(),
                        packageChoice: choice,
                        packageDisclaimerAgreed: true,
                        ...(isBuyingPackage && {
                            packageShippingAddress: shippingAddress.trim(),
                            packagePaymentMethod: 'cod',
                        }),
                    }),
                }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || `Request failed ${res.status}`);
            }
            const tempToken = signupData.tempToken;
            if (tempToken) {
                const loginRes = await fetch(`${API.RIDERS}/registrations/complete-login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
                    body: JSON.stringify({ tempToken, registrationId: regId }),
                });
                const loginJson = await loginRes.json();
                if (loginJson.success && loginJson.token && loginJson.user) {
                    await login(loginJson.token, loginJson.user);
                }
            }
            router.replace({
                pathname: '/waiting-results',
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
                <Text style={s.headerTitle}>แพ็กเกจ</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={s.scroll}
                contentContainerStyle={[s.content, { paddingBottom: 120 }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={s.illustrationWrap}>
                    <Image source={ILLUSTRATION} style={s.illustrationImage} resizeMode="cover" />
                </View>

                <Text style={s.title}>แพ็กเกจ</Text>

                {/* พื้นที่ให้บริการ */}
                <View style={s.card}>
                    <View style={s.sectionLabel}>
                        <Ionicons name="location-outline" size={18} color="#0E3A78" />
                        <Text style={s.sectionTitle}>พื้นที่ให้บริการ</Text>
                    </View>
                    <View style={s.fieldWrap}>
                        <Text style={s.label}>จังหวัด</Text>
                        <TouchableOpacity
                            style={s.selectBtn}
                            onPress={() => {
                                setProvinceSearch('');
                                setShowProvinceModal(true);
                            }}
                        >
                            <Text
                                style={[s.selectBtnText, !province && s.selectBtnPlaceholder]}
                                numberOfLines={1}
                            >
                                {province || 'เลือกจังหวัด'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                    <View style={s.fieldWrap}>
                        <Text style={s.label}>ตำบล/แขวง</Text>
                        <TouchableOpacity
                            style={s.selectBtn}
                            onPress={() => {
                                if (!province) return;
                                setDistrictSearch('');
                                setShowDistrictModal(true);
                            }}
                            disabled={!province}
                        >
                            <Text
                                style={[s.selectBtnText, (!district || !province) && s.selectBtnPlaceholder]}
                                numberOfLines={1}
                            >
                                {!province
                                    ? 'เลือกจังหวัดก่อน'
                                    : district || 'เลือกตำบล/แขวง'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* แพ็กเกจอุปกรณ์ */}
                <View style={s.card}>
                    <View style={s.sectionLabel}>
                        <Ionicons name="bag-outline" size={18} color="#0E3A78" />
                        <Text style={s.sectionTitle}>แพ็กเกจอุปกรณ์</Text>
                    </View>
                    <Text style={s.label}>โปรดเลือกแพ็กเกจ</Text>
                    <TouchableOpacity
                        style={[s.selectWrap, showDropdown && s.selectWrapOpen]}
                        onPress={() => setShowDropdown(!showDropdown)}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[s.selectText, !selected && s.selectPlaceholder]}
                            numberOfLines={1}
                        >
                            {selected ? selected.label : 'เลือกแพ็กเกจ'}
                        </Text>
                        <Ionicons
                            name={showDropdown ? 'chevron-up' : 'chevron-down'}
                            size={22}
                            color="#64748B"
                        />
                    </TouchableOpacity>
                    {showDropdown && (
                        <View style={s.dropdown}>
                            {PACKAGE_OPTIONS.map((opt, index) => (
                                <React.Fragment key={opt.value}>
                                    {index > 0 && <View style={s.optionDivider} />}
                                    <TouchableOpacity
                                        style={[s.option, choice === opt.value && s.optionSelected]}
                                        onPress={() => {
                                            setChoice(opt.value);
                                            setShowDropdown(false);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[s.optionText, choice === opt.value && s.optionTextSelected]}>
                                            {opt.label}
                                        </Text>
                                        {choice === opt.value && (
                                            <Ionicons name="checkmark-circle" size={20} color="#0E3A78" />
                                        )}
                                    </TouchableOpacity>
                                </React.Fragment>
                            ))}
                        </View>
                    )}
                </View>

                {isBuyingPackage && (
                    <View style={s.card}>
                        <View style={s.sectionLabel}>
                            <Ionicons name="car-outline" size={18} color="#0E3A78" />
                            <Text style={s.sectionTitle}>ที่อยู่จัดส่ง</Text>
                        </View>
                        <View style={s.codBadge}>
                            <Ionicons name="wallet-outline" size={20} color="#059669" />
                            <Text style={s.codText}>ชำระเงินเมื่อรับสินค้า (เก็บเงินปลายทาง)</Text>
                        </View>
                        <TextInput
                            style={[s.input, s.inputMultiline]}
                            placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                            placeholderTextColor="#94A3B8"
                            value={shippingAddress}
                            onChangeText={setShippingAddress}
                            multiline
                            numberOfLines={4}
                        />
                    </View>
                )}

                {/* ข้อความยอมรับ */}
                <View style={s.card}>
                    <TouchableOpacity
                        style={s.checkRow}
                        onPress={() => setConsent(!consent)}
                        activeOpacity={0.7}
                    >
                        <View style={[s.checkbox, consent && s.checkboxActive]}>
                            {consent && <Ionicons name="checkmark" size={14} color="#FFF" />}
                        </View>
                        <Text style={s.consentText}>{DISCLAIMER}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal visible={showProvinceModal} animationType="slide">
                <SafeAreaView style={s.modalFull}>
                    <View style={s.modalHeader}>
                        <TouchableOpacity onPress={() => setShowProvinceModal(false)}>
                            <Text style={s.modalHeaderCancel}>ปิด</Text>
                        </TouchableOpacity>
                        <Text style={s.modalHeaderTitle}>เลือกจังหวัด</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <View style={s.searchBox}>
                        <Ionicons name="search" size={18} color="#94A3B8" />
                        <TextInput
                            style={s.searchInput}
                            placeholder="ค้นหาจังหวัด..."
                            placeholderTextColor="#94A3B8"
                            value={provinceSearch}
                            onChangeText={setProvinceSearch}
                            autoCorrect={false}
                            autoFocus
                        />
                        {provinceSearch.length > 0 && (
                            <TouchableOpacity onPress={() => setProvinceSearch('')}>
                                <Ionicons name="close-circle" size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <FlatList
                        data={PROVINCES.filter((p) =>
                            p.toLowerCase().includes(provinceSearch.trim().toLowerCase())
                        )}
                        keyExtractor={(item) => item}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={s.listRow}
                                onPress={() => onProvinceSelect(item)}
                            >
                                <Text
                                    style={[
                                        s.listRowText,
                                        province === item && { color: '#0E3A78', fontWeight: '700' },
                                    ]}
                                >
                                    {item}
                                </Text>
                                {province === item && (
                                    <Ionicons name="checkmark" size={20} color="#0E3A78" />
                                )}
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <Text style={s.emptySearch}>ไม่พบจังหวัดที่ค้นหา</Text>
                        }
                    />
                </SafeAreaView>
            </Modal>

            <Modal visible={showDistrictModal} animationType="slide">
                <SafeAreaView style={s.modalFull}>
                    <View style={s.modalHeader}>
                        <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                            <Text style={s.modalHeaderCancel}>ปิด</Text>
                        </TouchableOpacity>
                        <Text style={s.modalHeaderTitle}>เลือกตำบล/แขวง</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <View style={s.searchBox}>
                        <Ionicons name="search" size={18} color="#94A3B8" />
                        <TextInput
                            style={s.searchInput}
                            placeholder="ค้นหาตำบล/แขวง..."
                            placeholderTextColor="#94A3B8"
                            value={districtSearch}
                            onChangeText={setDistrictSearch}
                            autoCorrect={false}
                            autoFocus
                        />
                        {districtSearch.length > 0 && (
                            <TouchableOpacity onPress={() => setDistrictSearch('')}>
                                <Ionicons name="close-circle" size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <FlatList
                        data={subdistrictOptions.filter((d) =>
                            d.toLowerCase().includes(districtSearch.trim().toLowerCase())
                        )}
                        keyExtractor={(item) => item}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={s.listRow}
                                onPress={() => {
                                    setDistrict(item);
                                    setShowDistrictModal(false);
                                }}
                            >
                                <Text
                                    style={[
                                        s.listRowText,
                                        district === item && {
                                            color: '#0E3A78',
                                            fontWeight: '700',
                                        },
                                    ]}
                                >
                                    {item}
                                </Text>
                                {district === item && (
                                    <Ionicons name="checkmark" size={20} color="#0E3A78" />
                                )}
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <Text style={s.emptySearch}>ไม่พบรายการที่ค้นหา</Text>
                        }
                    />
                </SafeAreaView>
            </Modal>

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
    safeArea: { flex: 1, backgroundColor: '#F1F5F9' },
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
    scroll: { flex: 1, backgroundColor: '#F1F5F9' },
    content: { padding: 16 },
    illustrationWrap: {
        height: 140,
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
        backgroundColor: '#DBEAFE',
        shadowColor: '#0E3A78',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    illustrationImage: { width: '100%', height: '100%' },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    fieldWrap: { marginBottom: 14 },
    label: { fontSize: 13, color: '#64748B', marginBottom: 6, fontWeight: '500' },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#0F172A',
    },
    inputMultiline: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    codBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#ECFDF5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    codText: {
        fontSize: 14,
        color: '#047857',
        fontWeight: '600',
        flex: 1,
    },
    selectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    selectBtnText: { fontSize: 16, color: '#0F172A', flex: 1 },
    selectBtnPlaceholder: { color: '#94A3B8' },
    modalFull: { flex: 1, backgroundColor: '#fff' },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalHeaderCancel: { fontSize: 16, color: '#64748B' },
    modalHeaderTitle: { fontSize: 18, fontWeight: '600', color: '#0F172A' },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: 16,
        marginVertical: 12,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 14,
        height: 44,
    },
    searchInput: { flex: 1, fontSize: 15, color: '#0F172A' },
    listRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    listRowText: { fontSize: 16, color: '#0F172A' },
    emptySearch: { textAlign: 'center', color: '#94A3B8', fontSize: 15, marginTop: 24 },
    selectWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        minHeight: 52,
        marginTop: 4,
    },
    selectWrapOpen: {
        borderColor: '#0E3A78',
        backgroundColor: '#EFF6FF',
        borderWidth: 2,
    },
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
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    optionSelected: {
        backgroundColor: '#EFF6FF',
    },
    optionDivider: { height: 1, backgroundColor: '#E2E8F0', marginHorizontal: 12 },
    optionText: { fontSize: 16, color: '#334155', flex: 1 },
    optionTextSelected: { color: '#0E3A78', fontWeight: '600' },
    checkRow: { flexDirection: 'row', alignItems: 'flex-start' },
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
    consentText: { flex: 1, fontSize: 13, color: '#64748B', lineHeight: 20 },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    continueBtn: {
        backgroundColor: '#0E3A78',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#0E3A78',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    continueBtnDisabled: {
        backgroundColor: '#94A3B8',
        opacity: 0.7,
        shadowOpacity: 0,
    },
    continueText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
