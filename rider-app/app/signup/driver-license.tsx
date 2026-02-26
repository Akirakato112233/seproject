import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Modal,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSignup } from '../../context/SignupContext';

const PROVINCES = [
    'กรุงเทพมหานคร','กระบี่','กาญจนบุรี','กาฬสินธุ์','กำแพงเพชร',
    'ขอนแก่น','จันทบุรี','ฉะเชิงเทรา','ชลบุรี','ชัยนาท',
    'ชัยภูมิ','ชุมพร','เชียงราย','เชียงใหม่','ตรัง',
    'ตราด','ตาก','นครนายก','นครปฐม','นครพนม',
    'นครราชสีมา','นครศรีธรรมราช','นครสวรรค์','นนทบุรี','นราธิวาส',
    'น่าน','บึงกาฬ','บุรีรัมย์','ปทุมธานี','ประจวบคีรีขันธ์',
    'ปราจีนบุรี','ปัตตานี','พระนครศรีอยุธยา','พะเยา','พังงา',
    'พัทลุง','พิจิตร','พิษณุโลก','เพชรบุรี','เพชรบูรณ์',
    'แพร่','ภูเก็ต','มหาสารคาม','มุกดาหาร','แม่ฮ่องสอน',
    'ยโสธร','ยะลา','ร้อยเอ็ด','ระนอง','ระยอง',
    'ราชบุรี','ลพบุรี','ลำปาง','ลำพูน','เลย',
    'ศรีสะเกษ','สกลนคร','สงขลา','สตูล','สมุทรปราการ',
    'สมุทรสงคราม','สมุทรสาคร','สระแก้ว','สระบุรี','สิงห์บุรี',
    'สุโขทัย','สุพรรณบุรี','สุราษฎร์ธานี','สุรินทร์','หนองคาย',
    'หนองบัวลำภู','อ่างทอง','อำนาจเจริญ','อุดรธานี','อุตรดิตถ์',
    'อุทัยธานี','อุบลราชธานี',
];

const SHORT_DESC = 'ใบขับขี่ที่ถูกต้อง ควรมีลักษณะดัง..';
const FULL_DESC =
    'ใบขับขี่ที่ถูกต้อง ควรมีลักษณะดังต่อไปนี้:\n• โปรดอัพโหลดใบขับขี่สาธารณะ (ถ้ามี)\n• กรณีไม่มีใบขับขี่สาธารณะ สามารถถ่ายโหลดใบขับขี่ส่วนบุคคลได้\n• ข้อมูลในใบขับขี่ต้องตรงกับบัตรประจำตัวประชาชน\n• ใบขับขี่อยู่ในสภาพสมบูรณ์และไม่หมดอายุ\n• ไม่แก้ไขและตกแต่งรูป\n• เห็นข้อมูลชัดเจนและครบถ้วน';

const MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];
const ITEM_H = 44;

function range(start: number, end: number): number[] {
    const arr: number[] = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
}

function daysInMonth(month: number, year: number): number {
    return new Date(year, month, 0).getDate();
}

type DateField = 'issue' | 'expiry';

interface PickerColumnProps {
    data: string[];
    selectedIndex: number;
    onSelect: (index: number) => void;
}

function PickerColumn({ data, selectedIndex, onSelect }: PickerColumnProps) {
    const flatListRef = useRef<FlatList>(null);
    const [ready, setReady] = useState(false);

    const onLayout = useCallback(() => {
        if (!ready && selectedIndex > 0) {
            flatListRef.current?.scrollToOffset({ offset: selectedIndex * ITEM_H, animated: false });
        }
        setReady(true);
    }, [ready, selectedIndex]);

    const onMomentumEnd = useCallback((e: any) => {
        const y = e.nativeEvent.contentOffset.y;
        const idx = Math.round(y / ITEM_H);
        const clamped = Math.max(0, Math.min(idx, data.length - 1));
        onSelect(clamped);
    }, [data.length, onSelect]);

    return (
        <View style={ps.columnWrap}>
            <View pointerEvents="none" style={ps.highlight} />
            <FlatList
                ref={flatListRef}
                data={data}
                keyExtractor={(_, i) => String(i)}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_H}
                decelerationRate="fast"
                onLayout={onLayout}
                onMomentumScrollEnd={onMomentumEnd}
                contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
                getItemLayout={(_, index) => ({ length: ITEM_H, offset: ITEM_H * index, index })}
                renderItem={({ item, index }) => {
                    const isSelected = index === selectedIndex;
                    return (
                        <View style={ps.item}>
                            <Text style={[ps.itemText, isSelected && ps.itemTextSelected]}>{item}</Text>
                        </View>
                    );
                }}
            />
        </View>
    );
}

const ps = StyleSheet.create({
    columnWrap: { flex: 1, height: ITEM_H * 5, overflow: 'hidden' },
    highlight: {
        position: 'absolute', top: ITEM_H * 2, left: 0, right: 0, height: ITEM_H,
        backgroundColor: '#F1F5F9', borderRadius: 8, zIndex: -1,
    },
    item: { height: ITEM_H, justifyContent: 'center', alignItems: 'center' },
    itemText: { fontSize: 16, color: '#94A3B8' },
    itemTextSelected: { color: '#0F172A', fontWeight: '600', fontSize: 17 },
});

export default function DriverLicenseScreen() {
    const router = useRouter();
    const { data, setField, submit } = useSignup();

    const [licenseNo, setLicenseNo] = useState('');
    const [licenseType, setLicenseType] = useState('');
    const [issueDate, setIssueDate] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [province, setProvince] = useState('');
    const [showMore, setShowMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showProvinceModal, setShowProvinceModal] = useState(false);
    const [provinceSearch, setProvinceSearch] = useState('');

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [activeDateField, setActiveDateField] = useState<DateField>('issue');

    const now = new Date();
    const currentYear = now.getFullYear();

    const [pickerDay, setPickerDay] = useState(now.getDate());
    const [pickerMonth, setPickerMonth] = useState(now.getMonth() + 1);
    const [pickerYear, setPickerYear] = useState(currentYear);

    const licenseDigits = licenseNo.replace(/\D/g, '');
    const licenseError = licenseNo.length > 0 && licenseDigits.length !== 8;

    const canContinue =
        licenseDigits.length === 8 &&
        licenseType.trim().length > 0 &&
        issueDate.length > 0 &&
        expiryDate.length > 0 &&
        province.trim().length > 0 &&
        !!data.licenseUri;

    const yearRange = activeDateField === 'expiry'
        ? range(currentYear - 10, currentYear + 20)
        : range(1950, currentYear);

    const dayCount = daysInMonth(pickerMonth, pickerYear);
    const days = range(1, dayCount);

    const openDatePicker = (field: DateField) => {
        setActiveDateField(field);
        setPickerDay(now.getDate());
        setPickerMonth(now.getMonth() + 1);
        setPickerYear(currentYear);
        setShowDatePicker(true);
    };

    const confirmDate = () => {
        const clampedDay = Math.min(pickerDay, dayCount);
        const dd = String(clampedDay).padStart(2, '0');
        const mm = String(pickerMonth).padStart(2, '0');
        const formatted = `${dd}/${mm}/${pickerYear}`;

        if (activeDateField === 'issue') setIssueDate(formatted);
        else setExpiryDate(formatted);

        setShowDatePicker(false);
    };

    const handleContinue = async () => {
        if (!data.selfieUri) {
            Alert.alert(
                'กรุณาถ่ายรูปเซลฟี่',
                'โปรดถ่ายและอัปโหลดรูปเซลฟี่ของคุณก่อนดำเนินการต่อ',
                [
                    { text: 'ไปถ่ายรูป', onPress: () => router.push('/signup/selfie-guide' as any) },
                    { text: 'ยกเลิก', style: 'cancel' },
                ],
            );
            return;
        }

        if (licenseDigits.length !== 8) { Alert.alert('ข้อมูลไม่ถูกต้อง', 'เลขใบขับขี่ต้องเป็นตัวเลข 8 หลัก'); return; }
        if (!licenseType.trim()) { Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกชนิดใบขับขี่'); return; }
        if (!issueDate) { Alert.alert('กรุณากรอกข้อมูล', 'กรุณาเลือกวันอนุญาต'); return; }
        if (!expiryDate) { Alert.alert('กรุณากรอกข้อมูล', 'กรุณาเลือกวันหมดอายุ'); return; }
        if (!province.trim()) { Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกจังหวัดออกใบขับขี่'); return; }
        if (!data.licenseUri) { Alert.alert('กรุณาอัปโหลดรูป', 'กรุณาอัปโหลดรูปใบขับขี่'); return; }

        setField('licenseNo', licenseDigits);
        setField('licenseType', licenseType.trim());
        setField('licenseIssueDate', issueDate);
        setField('licenseExpiryDate', expiryDate);
        setField('licenseProvince', province.trim());

        setLoading(true);
        const result = await submit({
            licenseNo: licenseDigits,
            licenseType: licenseType.trim(),
            licenseIssueDate: issueDate,
            licenseExpiryDate: expiryDate,
            licenseProvince: province.trim(),
        });
        setLoading(false);

        if (result.success) {
            const regId = result.registrationId ? String(result.registrationId) : '';
            router.replace({
                pathname: '/verify-documents',
                params: { registrationId: regId },
            } as any);
        } else {
            Alert.alert('เกิดข้อผิดพลาด', result.message ?? 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่');
        }
    };

    const profilePhoto = data.selfieUri;

    const dayStrings = days.map(d => String(d));
    const monthStrings = MONTHS;
    const yearStrings = yearRange.map(y => String(y));

    return (
        <SafeAreaView style={s.safe} edges={['bottom']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                {/* Banner */}
                <View style={s.banner}>
                    <Image
                        source={require('../../assets/images/image.png')}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                    />
                    <View style={s.phoneCard}>
                        <View style={s.phoneFace}>
                            {profilePhoto ? (
                                <Image source={{ uri: profilePhoto }} style={s.phonePhoto} />
                            ) : (
                                <Ionicons name="person" size={28} color="#fff" />
                            )}
                        </View>
                        <View style={s.phoneCheck}>
                            <Ionicons name="checkmark" size={14} color="#fff" />
                        </View>
                    </View>
                </View>

                <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
                    <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={22} color="#111" />
                    </TouchableOpacity>

                    <View style={s.titleRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.title}>ใบอนุญาตขับรถ (ใบขับขี่)</Text>
                            <Text style={s.subtitle}>
                                รูปใบขับขี่ <Text style={s.required}>*</Text>
                            </Text>
                            <Text style={s.desc} numberOfLines={showMore ? undefined : 1}>
                                {showMore ? FULL_DESC : SHORT_DESC}
                            </Text>
                            <TouchableOpacity onPress={() => setShowMore(!showMore)}>
                                <Text style={s.showMoreText}>{showMore ? 'Show less' : 'Show more'}</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={s.uploadBox}
                            onPress={() => router.push('/signup/upload-doc-guide?type=license' as any)}
                        >
                            {data.licenseUri ? (
                                <Image source={{ uri: data.licenseUri }} style={s.uploadPreview} resizeMode="cover" />
                            ) : (
                                <>
                                    <Ionicons name="add" size={26} color="#64748B" />
                                    <Text style={s.uploadText}>Upload Photo</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* เลขใบขับขี่ */}
                    <TextInput
                        style={[s.input, licenseError && s.inputError]}
                        placeholder="เลขใบขับขี่"
                        placeholderTextColor="#aaa"
                        keyboardType="number-pad"
                        maxLength={8}
                        value={licenseNo}
                        onChangeText={(t) => setLicenseNo(t.replace(/\D/g, ''))}
                    />
                    {licenseNo.length > 0 && licenseDigits.length < 8 && (
                        <Text style={s.warningHint}>กรอกให้ครบ 8 หลัก ({licenseDigits.length}/8)</Text>
                    )}

                    {/* ชนิดใบขับขี่ */}
                    <TextInput
                        style={s.input}
                        placeholder="ชนิดใบขับขี่"
                        placeholderTextColor="#aaa"
                        value={licenseType}
                        onChangeText={setLicenseType}
                    />

                    {/* วันอนุญาต */}
                    <TouchableOpacity style={s.dateBtn} onPress={() => openDatePicker('issue')} activeOpacity={0.7}>
                        <Text style={[s.dateBtnText, !issueDate && { color: '#aaa' }]}>
                            {issueDate || 'วันอนุญาต วัน/เดือน/ปี ค.ศ'}
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color="#64748B" />
                    </TouchableOpacity>

                    {/* วันหมดอายุ */}
                    <TouchableOpacity style={s.dateBtn} onPress={() => openDatePicker('expiry')} activeOpacity={0.7}>
                        <Text style={[s.dateBtnText, !expiryDate && { color: '#aaa' }]}>
                            {expiryDate || 'วันบัตรหมดอายุ วัน/เดือน/ปี ค.ศ'}
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color="#64748B" />
                    </TouchableOpacity>

                    {/* จังหวัด */}
                    <TouchableOpacity style={s.dateBtn} onPress={() => { setProvinceSearch(''); setShowProvinceModal(true); }} activeOpacity={0.7}>
                        <Text style={[s.dateBtnText, !province && { color: '#aaa' }]}>
                            {province || 'จังหวัดออกใบขับขี่'}
                        </Text>
                        <Ionicons name="chevron-down" size={18} color="#64748B" />
                    </TouchableOpacity>
                </ScrollView>

                {/* Continue */}
                <View style={s.footer}>
                    <TouchableOpacity
                        style={[s.continueBtn, (!canContinue || loading) && s.continueBtnDisabled]}
                        onPress={handleContinue}
                        disabled={!canContinue || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={s.continueBtnText}>Continue</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Province Picker Modal */}
            <Modal visible={showProvinceModal} animationType="slide">
                <SafeAreaView style={s.provinceModalFull}>
                    <View style={s.datePickerHeader}>
                        <TouchableOpacity onPress={() => setShowProvinceModal(false)}>
                            <Text style={s.datePickerCancel}>ปิด</Text>
                        </TouchableOpacity>
                        <Text style={s.datePickerTitle}>เลือกจังหวัด</Text>
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
                        data={PROVINCES.filter(p => p.includes(provinceSearch.trim()))}
                        keyExtractor={(item) => item}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={s.provinceRow}
                                onPress={() => { setProvince(item); setShowProvinceModal(false); }}
                            >
                                <Text style={[s.provinceText, province === item && { color: '#0E3A78', fontWeight: '700' }]}>{item}</Text>
                                {province === item && <Ionicons name="checkmark" size={20} color="#0E3A78" />}
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text style={s.emptySearch}>ไม่พบจังหวัดที่ค้นหา</Text>}
                    />
                </SafeAreaView>
            </Modal>

            {/* Custom Date Picker Modal */}
            <Modal visible={showDatePicker} transparent animationType="slide">
                <TouchableOpacity style={s.modalOverlay} onPress={() => setShowDatePicker(false)} />
                <View style={s.datePickerSheet}>
                    <View style={s.datePickerHeader}>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <Text style={s.datePickerCancel}>ยกเลิก</Text>
                        </TouchableOpacity>
                        <Text style={s.datePickerTitle}>
                            {activeDateField === 'issue' ? 'วันอนุญาต' : 'วันหมดอายุ'}
                        </Text>
                        <TouchableOpacity onPress={confirmDate}>
                            <Text style={s.datePickerDone}>ตกลง</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={s.colLabels}>
                        <Text style={s.colLabel}>วัน</Text>
                        <Text style={s.colLabel}>เดือน</Text>
                        <Text style={s.colLabel}>ปี ค.ศ.</Text>
                    </View>

                    <View style={s.columnsRow}>
                        <PickerColumn
                            data={dayStrings}
                            selectedIndex={Math.min(pickerDay - 1, dayCount - 1)}
                            onSelect={(i) => setPickerDay(i + 1)}
                        />
                        <PickerColumn
                            data={monthStrings}
                            selectedIndex={pickerMonth - 1}
                            onSelect={(i) => setPickerMonth(i + 1)}
                        />
                        <PickerColumn
                            data={yearStrings}
                            selectedIndex={yearRange.indexOf(pickerYear)}
                            onSelect={(i) => setPickerYear(yearRange[i])}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },

    banner: {
        height: 200, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    phoneCard: {
        width: 70, height: 105, backgroundColor: '#fff', borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', gap: 8,
        shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4, padding: 10,
    },
    phoneFace: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#3B82F6',
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    phonePhoto: { width: 44, height: 44, borderRadius: 22 },
    phoneCheck: {
        backgroundColor: '#22C55E', borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 5, alignItems: 'center',
    },

    scroll: { flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: 20 },
    backBtn: {
        marginTop: 12, marginBottom: 16, width: 36, height: 36,
        alignItems: 'center', justifyContent: 'center',
    },

    titleRow: { flexDirection: 'row', gap: 12, marginBottom: 20, alignItems: 'flex-start' },
    title: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
    subtitle: { fontSize: 13, color: '#334155', lineHeight: 20, marginBottom: 4 },
    required: { color: '#EF4444' },
    desc: { fontSize: 12, color: '#475569', lineHeight: 18 },
    showMoreText: { color: '#2563EB', fontSize: 12, marginTop: 4 },

    uploadBox: {
        width: 88, height: 88, borderRadius: 8,
        borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed',
        alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0, overflow: 'hidden',
    },
    uploadPreview: { width: 88, height: 88, borderRadius: 8 },
    uploadText: { fontSize: 11, color: '#64748B', textAlign: 'center' },

    input: {
        borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 10,
        height: 52, paddingHorizontal: 16, fontSize: 15, color: '#0F172A', marginBottom: 12,
    },
    inputError: { borderColor: '#EF4444' },
    warningHint: { color: '#F59E0B', fontSize: 13, fontWeight: '500', marginTop: -8, marginBottom: 12 },

    dateBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 10,
        height: 52, paddingHorizontal: 16, marginBottom: 12,
    },
    dateBtnText: { fontSize: 15, color: '#0F172A' },

    footer: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12, backgroundColor: '#fff' },
    continueBtn: {
        height: 54, borderRadius: 27, backgroundColor: '#0E3A78',
        alignItems: 'center', justifyContent: 'center',
    },
    continueBtnDisabled: { backgroundColor: '#94A3B8' },
    continueBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },

    datePickerSheet: {
        backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40,
    },
    datePickerHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 16,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    datePickerTitle: { fontSize: 17, fontWeight: '600', color: '#0F172A' },
    datePickerCancel: { fontSize: 16, color: '#64748B' },
    datePickerDone: { fontSize: 16, fontWeight: '600', color: '#0E3A78' },

    colLabels: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12 },
    colLabel: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#64748B' },
    columnsRow: { flexDirection: 'row', paddingHorizontal: 8 },

    provinceModalFull: {
        flex: 1, backgroundColor: '#fff',
    },
    searchBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginHorizontal: 16, marginVertical: 12,
        borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 10,
        paddingHorizontal: 14, height: 44,
    },
    searchInput: { flex: 1, fontSize: 15, color: '#0F172A' },
    provinceRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 14, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    provinceText: { fontSize: 16, color: '#0F172A' },
    emptySearch: { textAlign: 'center', color: '#94A3B8', fontSize: 15, marginTop: 24 },
});
