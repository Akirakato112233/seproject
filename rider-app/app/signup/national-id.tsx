import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Alert,
    FlatList,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSignup } from '../../context/SignupContext';

const SHORT_DESC = 'บัตรประจำตัวประชาชนที่ถูกต้อง..';
const FULL_DESC =
    'บัตรประจำตัวประชาชนที่ถูกต้อง\n• บัตรประจำตัวประชาชนอยู่ในสภาพสมบูรณ์และไม่หมดอายุ\n• ไม่มีโฟและตัดแต่งรูป\n• เห็นข้อมูลชัดเจนและครบถ้วน\n• เพื่อการเก็บรวบรวมข้อมูลตามกฎหมายคุ้มครองข้อมูลส่วนบุคคลกรุณาเบลอหรือซักที่กับข้อมูลหมู่เลือดของบัตรประจำตัวประชาชนของท่าน (ถ้ามี)';

const GENDER_OPTIONS = ['หญิง', 'ชาย'];
const THAI_REGEX = /^[\u0E00-\u0E7F\s]+$/;
const EN_REGEX = /^[a-zA-Z\s.]+$/;

const MONTHS = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
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

type DateField = 'issue' | 'expiry' | 'dob';

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
            flatListRef.current?.scrollToOffset({
                offset: selectedIndex * ITEM_H,
                animated: false,
            });
        }
        setReady(true);
    }, [ready, selectedIndex]);

    const onMomentumEnd = useCallback(
        (e: any) => {
            const y = e.nativeEvent.contentOffset.y;
            const idx = Math.round(y / ITEM_H);
            const clamped = Math.max(0, Math.min(idx, data.length - 1));
            onSelect(clamped);
        },
        [data.length, onSelect]
    );

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
                            <Text style={[ps.itemText, isSelected && ps.itemTextSelected]}>
                                {item}
                            </Text>
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
        position: 'absolute',
        top: ITEM_H * 2,
        left: 0,
        right: 0,
        height: ITEM_H,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        zIndex: -1,
    },
    item: { height: ITEM_H, justifyContent: 'center', alignItems: 'center' },
    itemText: { fontSize: 16, color: '#94A3B8' },
    itemTextSelected: { color: '#0F172A', fontWeight: '600', fontSize: 17 },
});

export default function NationalIdScreen() {
    const router = useRouter();
    const { data, setField } = useSignup();

    const [nameTH, setNameTH] = useState('');
    const [nameEN, setNameEN] = useState('');
    const [idNumber, setIdNumber] = useState('');
    const [issueDate, setIssueDate] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('');
    const [address, setAddress] = useState('');
    const [showMore, setShowMore] = useState(false);
    const [showGenderModal, setShowGenderModal] = useState(false);

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [activeDateField, setActiveDateField] = useState<DateField>('dob');

    const now = new Date();
    const currentYear = now.getFullYear();

    const [pickerDay, setPickerDay] = useState(now.getDate());
    const [pickerMonth, setPickerMonth] = useState(now.getMonth() + 1);
    const [pickerYear, setPickerYear] = useState(currentYear);

    const nameTHError = nameTH.length > 0 && !THAI_REGEX.test(nameTH);
    const nameENError = nameEN.length > 0 && !EN_REGEX.test(nameEN);
    const idDigits = idNumber.replace(/\D/g, '');
    const idError = idNumber.length > 0 && idDigits.length !== 13;

    const canContinue =
        nameTH.trim().length > 0 &&
        !nameTHError &&
        nameEN.trim().length > 0 &&
        !nameENError &&
        idDigits.length === 13 &&
        issueDate.length > 0 &&
        expiryDate.length > 0 &&
        dob.length > 0 &&
        gender.length > 0 &&
        address.trim().length > 0 &&
        !!data.idFrontUri;

    const yearRange =
        activeDateField === 'expiry'
            ? range(currentYear - 10, currentYear + 20)
            : activeDateField === 'dob'
              ? range(1920, currentYear)
              : range(1950, currentYear);

    const dayCount = daysInMonth(pickerMonth, pickerYear);
    const days = range(1, dayCount);

    const openDatePicker = (field: DateField) => {
        setActiveDateField(field);
        if (field === 'dob') {
            setPickerDay(1);
            setPickerMonth(1);
            setPickerYear(2000);
        } else {
            setPickerDay(now.getDate());
            setPickerMonth(now.getMonth() + 1);
            setPickerYear(currentYear);
        }
        setShowDatePicker(true);
    };

    const confirmDate = () => {
        const clampedDay = Math.min(pickerDay, dayCount);
        const dd = String(clampedDay).padStart(2, '0');
        const mm = String(pickerMonth).padStart(2, '0');
        const formatted = `${dd}/${mm}/${pickerYear}`;

        switch (activeDateField) {
            case 'issue':
                setIssueDate(formatted);
                break;
            case 'expiry':
                setExpiryDate(formatted);
                break;
            case 'dob':
                setDob(formatted);
                break;
        }
        setShowDatePicker(false);
    };

    const handleContinue = () => {
        if (!nameTH.trim()) {
            Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกชื่อ-สกุล (ภาษาไทย)');
            return;
        }
        if (nameTHError) {
            Alert.alert('ข้อมูลไม่ถูกต้อง', 'ชื่อ-สกุล (ภาษาไทย) ต้องเป็นภาษาไทยเท่านั้น');
            return;
        }
        if (!nameEN.trim()) {
            Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกชื่อ-สกุล (ภาษาอังกฤษ)');
            return;
        }
        if (nameENError) {
            Alert.alert('ข้อมูลไม่ถูกต้อง', 'ชื่อ-สกุล (ภาษาอังกฤษ) ต้องเป็นภาษาอังกฤษเท่านั้น');
            return;
        }
        if (idDigits.length !== 13) {
            Alert.alert('ข้อมูลไม่ถูกต้อง', 'หมายเลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก');
            return;
        }
        if (!issueDate) {
            Alert.alert('กรุณากรอกข้อมูล', 'กรุณาเลือกวันออกบัตร');
            return;
        }
        if (!expiryDate) {
            Alert.alert('กรุณากรอกข้อมูล', 'กรุณาเลือกวันบัตรหมดอายุ');
            return;
        }
        if (!dob) {
            Alert.alert('กรุณากรอกข้อมูล', 'กรุณาเลือกวันเกิด');
            return;
        }
        if (!gender) {
            Alert.alert('กรุณากรอกข้อมูล', 'กรุณาเลือกเพศ');
            return;
        }
        if (!address.trim()) {
            Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกที่อยู่ตามบัตรประชาชน');
            return;
        }
        if (!data.idFrontUri) {
            Alert.alert('กรุณาอัปโหลดรูป', 'กรุณาถ่ายหรืออัปโหลดรูปบัตรประจำตัวประชาชน');
            return;
        }

        setField('nameTH', nameTH.trim());
        setField('nameEN', nameEN.trim());
        setField('idNumber', idDigits);
        setField('idIssueDate', issueDate);
        setField('idExpiryDate', expiryDate);
        setField('dob', dob);
        setField('gender', gender);
        setField('address', address.trim());

        router.push('/signup/driver-license' as any);
    };

    const profilePhoto = data.selfieUri;

    const dayStrings = days.map((d) => String(d));
    const monthStrings = MONTHS;
    const yearStrings = yearRange.map((y) => String(y));

    return (
        <SafeAreaView style={s.safe} edges={['bottom']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
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

                <ScrollView
                    style={s.scroll}
                    contentContainerStyle={s.content}
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={22} color="#111" />
                    </TouchableOpacity>

                    <View style={s.titleRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.title}>บัตรประจำตัวประชาชน</Text>
                            <Text style={s.subtitle}>
                                รูปบัตรประจำตัวประชาชน{'\n'}(ด้านหน้า){' '}
                                <Text style={s.required}>*</Text>
                            </Text>
                            <Text style={s.desc} numberOfLines={showMore ? undefined : 1}>
                                {showMore ? FULL_DESC : SHORT_DESC}
                            </Text>
                            <TouchableOpacity onPress={() => setShowMore(!showMore)}>
                                <Text style={s.showMoreText}>
                                    {showMore ? 'Show less' : 'Show more'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={s.uploadBox}
                            onPress={() => router.push('/signup/upload-doc-guide?type=id' as any)}
                        >
                            {data.idFrontUri ? (
                                <Image
                                    source={{ uri: data.idFrontUri }}
                                    style={s.uploadPreview}
                                    resizeMode="cover"
                                />
                            ) : (
                                <>
                                    <Ionicons name="add" size={26} color="#64748B" />
                                    <Text style={s.uploadText}>Upload Photo</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* ชื่อ-สกุล (ภาษาไทย) */}
                    <TextInput
                        style={[s.input, nameTHError && s.inputError]}
                        placeholder="ชื่อ - สกุล (ภาษาไทย)"
                        placeholderTextColor="#aaa"
                        value={nameTH}
                        onChangeText={setNameTH}
                    />
                    {nameTHError && <Text style={s.errorHint}>กรุณากรอกเป็นภาษาไทยเท่านั้น</Text>}

                    {/* ชื่อ-สกุล (ภาษาอังกฤษ) */}
                    <TextInput
                        style={[s.input, nameENError && s.inputError]}
                        placeholder="ชื่อ - สกุล (ภาษาอังกฤษ)"
                        placeholderTextColor="#aaa"
                        value={nameEN}
                        onChangeText={setNameEN}
                        autoCapitalize="words"
                    />
                    {nameENError && (
                        <Text style={s.errorHint}>กรุณากรอกเป็นภาษาอังกฤษเท่านั้น</Text>
                    )}

                    {/* หมายเลขบัตรประชาชน */}
                    <TextInput
                        style={[s.input, idError && s.inputError]}
                        placeholder="หมายเลขบัตรประจำตัวประชาชน"
                        placeholderTextColor="#aaa"
                        keyboardType="number-pad"
                        maxLength={13}
                        value={idNumber}
                        onChangeText={(t) => setIdNumber(t.replace(/\D/g, ''))}
                    />
                    {idNumber.length > 0 && idDigits.length < 13 && (
                        <Text style={s.warningHint}>กรอกให้ครบ 13 หลัก ({idDigits.length}/13)</Text>
                    )}

                    {/* วันออกบัตร */}
                    <TouchableOpacity
                        style={s.dateBtn}
                        onPress={() => openDatePicker('issue')}
                        activeOpacity={0.7}
                    >
                        <Text style={[s.dateBtnText, !issueDate && { color: '#aaa' }]}>
                            {issueDate || 'วันออกบัตร วัน/เดือน/ปี ค.ศ'}
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color="#64748B" />
                    </TouchableOpacity>

                    {/* วันบัตรหมดอายุ */}
                    <TouchableOpacity
                        style={s.dateBtn}
                        onPress={() => openDatePicker('expiry')}
                        activeOpacity={0.7}
                    >
                        <Text style={[s.dateBtnText, !expiryDate && { color: '#aaa' }]}>
                            {expiryDate || 'วันบัตรหมดอายุ วัน/เดือน/ปี ค.ศ'}
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color="#64748B" />
                    </TouchableOpacity>

                    {/* วันเกิด */}
                    <TouchableOpacity
                        style={s.dateBtn}
                        onPress={() => openDatePicker('dob')}
                        activeOpacity={0.7}
                    >
                        <Text style={[s.dateBtnText, !dob && { color: '#aaa' }]}>
                            {dob || 'วันเกิด วัน/เดือน/ปี ค.ศ'}
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color="#64748B" />
                    </TouchableOpacity>

                    {/* เพศ */}
                    <TouchableOpacity style={s.pickerBtn} onPress={() => setShowGenderModal(true)}>
                        <Text style={[s.pickerText, !gender && { color: '#aaa' }]}>
                            {gender || 'เพศ'}
                        </Text>
                        <Ionicons name="chevron-down" size={18} color="#555" />
                    </TouchableOpacity>

                    {/* ที่อยู่ */}
                    <TextInput
                        style={[s.input, s.textArea]}
                        placeholder="ที่อยู่ตามบัตรประชาชน เลขที่ หมู่ ตำบล/แขวง อำเภอ/เขต จังหวัด"
                        placeholderTextColor="#aaa"
                        multiline
                        numberOfLines={3}
                        value={address}
                        onChangeText={setAddress}
                        textAlignVertical="top"
                    />
                </ScrollView>

                {/* Continue */}
                <View style={s.footer}>
                    <TouchableOpacity
                        style={[s.continueBtn, !canContinue && s.continueBtnDisabled]}
                        onPress={handleContinue}
                        activeOpacity={canContinue ? 0.85 : 1}
                        disabled={!canContinue}
                    >
                        <Text style={s.continueBtnText}>Continue</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Gender Modal */}
            <Modal visible={showGenderModal} transparent animationType="slide">
                <TouchableOpacity
                    style={s.modalOverlay}
                    onPress={() => setShowGenderModal(false)}
                />
                <View style={s.modalSheet}>
                    {GENDER_OPTIONS.map((g) => (
                        <TouchableOpacity
                            key={g}
                            style={s.genderRow}
                            onPress={() => {
                                setGender(g);
                                setShowGenderModal(false);
                            }}
                        >
                            <Text style={s.genderText}>{g}</Text>
                            <View style={[s.radio, gender === g && s.radioSelected]}>
                                {gender === g && <View style={s.radioDot} />}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </Modal>

            {/* Custom Date Picker Modal */}
            <Modal visible={showDatePicker} transparent animationType="slide">
                <TouchableOpacity style={s.modalOverlay} onPress={() => setShowDatePicker(false)} />
                <View style={s.datePickerSheet}>
                    {/* Header */}
                    <View style={s.datePickerHeader}>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <Text style={s.datePickerCancel}>ยกเลิก</Text>
                        </TouchableOpacity>
                        <Text style={s.datePickerTitle}>
                            {activeDateField === 'issue'
                                ? 'วันออกบัตร'
                                : activeDateField === 'expiry'
                                  ? 'วันบัตรหมดอายุ'
                                  : 'วันเกิด'}
                        </Text>
                        <TouchableOpacity onPress={confirmDate}>
                            <Text style={s.datePickerDone}>ตกลง</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Column labels */}
                    <View style={s.colLabels}>
                        <Text style={s.colLabel}>วัน</Text>
                        <Text style={s.colLabel}>เดือน</Text>
                        <Text style={s.colLabel}>ปี ค.ศ.</Text>
                    </View>

                    {/* Spinner columns */}
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

const BANNER_H = 200;

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },

    banner: {
        height: BANNER_H,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    phoneCard: {
        width: 70,
        height: 105,
        backgroundColor: '#fff',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
        padding: 10,
    },
    phoneFace: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    phonePhoto: { width: 44, height: 44, borderRadius: 22 },
    phoneCheck: {
        backgroundColor: '#22C55E',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 5,
        alignItems: 'center',
    },

    scroll: { flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: 20 },
    backBtn: {
        marginTop: 12,
        marginBottom: 16,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },

    titleRow: { flexDirection: 'row', gap: 12, marginBottom: 20, alignItems: 'flex-start' },
    title: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
    subtitle: { fontSize: 13, color: '#334155', lineHeight: 20, marginBottom: 4 },
    required: { color: '#EF4444' },
    desc: { fontSize: 12, color: '#475569', lineHeight: 18 },
    showMoreText: { color: '#2563EB', fontSize: 12, marginTop: 4 },

    uploadBox: {
        width: 88,
        height: 88,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        flexShrink: 0,
    },
    uploadText: { fontSize: 11, color: '#64748B', textAlign: 'center' },
    uploadPreview: { width: 88, height: 88, borderRadius: 8 },

    input: {
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        height: 52,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#0F172A',
        marginBottom: 12,
    },
    inputError: { borderColor: '#EF4444' },
    errorHint: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '500',
        marginTop: -8,
        marginBottom: 12,
    },
    warningHint: {
        color: '#F59E0B',
        fontSize: 13,
        fontWeight: '500',
        marginTop: -8,
        marginBottom: 12,
    },
    textArea: { height: 80, paddingTop: 14 },

    dateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        height: 52,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    dateBtnText: { fontSize: 15, color: '#0F172A' },

    pickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        height: 52,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    pickerText: { fontSize: 15, color: '#0F172A' },

    footer: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12, backgroundColor: '#fff' },
    continueBtn: {
        height: 54,
        borderRadius: 27,
        backgroundColor: '#0E3A78',
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueBtnDisabled: { backgroundColor: '#94A3B8' },
    continueBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
    modalSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 48,
        gap: 8,
    },
    genderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    genderText: { fontSize: 17, color: '#0F172A' },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: { borderColor: '#1E3A8A', backgroundColor: '#1E3A8A' },
    radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

    datePickerSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
    },
    datePickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    datePickerTitle: { fontSize: 17, fontWeight: '600', color: '#0F172A' },
    datePickerCancel: { fontSize: 16, color: '#64748B' },
    datePickerDone: { fontSize: 16, fontWeight: '600', color: '#0E3A78' },

    colLabels: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    colLabel: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#64748B' },
    columnsRow: { flexDirection: 'row', paddingHorizontal: 8 },
});
