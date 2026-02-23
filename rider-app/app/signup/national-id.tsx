import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSignup } from '../../context/SignupContext';

const SHORT_DESC = 'บัตรประจำตัวประชาชนที่ถูกต้อง..';
const FULL_DESC =
    'บัตรประจำตัวประชาชนที่ถูกต้อง\n• บัตรประจำตัวประชาชนอยู่ในสภาพสมบูรณ์และไม่หมดอายุ\n• ไม่มีโฟและตัดแต่งรูป\n• เห็นข้อมูลชัดเจนและครบถ้วน\n• เพื่อการเก็บรวบรวมข้อมูลตามกฎหมายคุ้มครองข้อมูลส่วนบุคคลกรุณาเบลอหรือซักที่กับข้อมูลหมู่เลือดของบัตรประจำตัวประชาชนของท่าน (ถ้ามี)';

const GENDER_OPTIONS = ['หญิง', 'ชาย'];

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

    const canContinue =
        nameTH.trim().length > 0 &&
        nameEN.trim().length > 0 &&
        idNumber.trim().length > 0 &&
        issueDate.trim().length > 0 &&
        expiryDate.trim().length > 0 &&
        dob.trim().length > 0 &&
        gender.length > 0 &&
        address.trim().length > 0 &&
        !!data.idFrontUri;

    const handleContinue = () => {
        // Validate all required fields
        if (!nameTH.trim()) { Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกชื่อ-สกุล (ภาษาไทย)'); return; }
        if (!nameEN.trim()) { Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกชื่อ-สกุล (ภาษาอังกฤษ)'); return; }
        if (!idNumber.trim()) { Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกหมายเลขบัตรประจำตัวประชาชน'); return; }
        if (!issueDate.trim()) { Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกวันออกบัตร'); return; }
        if (!expiryDate.trim()) { Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกวันบัตรหมดอายุ'); return; }
        if (!dob.trim()) { Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกวันเกิด'); return; }
        if (!gender) { Alert.alert('กรุณากรอกข้อมูล', 'กรุณาเลือกเพศ'); return; }
        if (!address.trim()) { Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกที่อยู่ตามบัตรประชาชน'); return; }
        if (!data.idFrontUri) { Alert.alert('กรุณาอัปโหลดรูป', 'กรุณาถ่ายหรืออัปโหลดรูปบัตรประจำตัวประชาชน'); return; }

        // Save to SignupContext
        setField('nameTH', nameTH.trim());
        setField('nameEN', nameEN.trim());
        setField('idNumber', idNumber.trim());
        setField('idIssueDate', issueDate.trim());
        setField('idExpiryDate', expiryDate.trim());
        setField('dob', dob.trim());
        setField('gender', gender);
        setField('address', address.trim());
        // idFrontUri already set when photo picked

        router.push('/signup/driver-license' as any);
    };

    const profilePhoto = data.selfieUri;

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
                    {/* Phone mockup with selfie */}
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
                    {/* Back */}
                    <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={22} color="#111" />
                    </TouchableOpacity>

                    {/* Title row */}
                    <View style={s.titleRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.title}>บัตรประจำตัวประชาชน</Text>
                            <Text style={s.subtitle}>
                                รูปบัตรประจำตัวประชาชน{'\n'}(ด้านหน้า) <Text style={s.required}>*</Text>
                            </Text>
                            <Text style={s.desc} numberOfLines={showMore ? undefined : 1}>
                                {showMore ? FULL_DESC : SHORT_DESC}
                            </Text>
                            <TouchableOpacity onPress={() => setShowMore(!showMore)}>
                                <Text style={s.showMore}>{showMore ? 'Show less' : 'Show more'}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Upload Photo */}
                        <TouchableOpacity style={s.uploadBox} onPress={() => router.push('/signup/upload-doc-guide?type=id' as any)}>
                            {data.idFrontUri ? (
                                <Image source={{ uri: data.idFrontUri }} style={s.uploadPreview} resizeMode="cover" />
                            ) : (
                                <>
                                    <Ionicons name="add" size={26} color="#64748B" />
                                    <Text style={s.uploadText}>Upload Photo</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Fields */}
                    <TextInput style={s.input} placeholder="ชื่อ - สกุล (ภาษาไทย)" placeholderTextColor="#aaa" value={nameTH} onChangeText={setNameTH} />
                    <TextInput style={s.input} placeholder="ชื่อ - สกุล (ภาษาอังกฤษ)" placeholderTextColor="#aaa" value={nameEN} onChangeText={setNameEN} />
                    <TextInput style={s.input} placeholder="หมายเลขบัตรประจำตัวประชาชน" placeholderTextColor="#aaa" keyboardType="number-pad" value={idNumber} onChangeText={setIdNumber} />
                    <TextInput style={s.input} placeholder="วันออกบัตร วัน/เดือน/ปี ค.ศ" placeholderTextColor="#aaa" value={issueDate} onChangeText={setIssueDate} />
                    <TextInput style={s.input} placeholder="วันบัตรหมดอายุ วัน/เดือน/ปี ค.ศ" placeholderTextColor="#aaa" value={expiryDate} onChangeText={setExpiryDate} />
                    <TextInput style={s.input} placeholder="วันเกิด วัน/เดือน/ปี ค.ศ" placeholderTextColor="#aaa" value={dob} onChangeText={setDob} />

                    {/* Gender Picker */}
                    <TouchableOpacity style={s.pickerBtn} onPress={() => setShowGenderModal(true)}>
                        <Text style={[s.pickerText, !gender && { color: '#aaa' }]}>
                            {gender || 'เพศ'}
                        </Text>
                        <Ionicons name="chevron-down" size={18} color="#555" />
                    </TouchableOpacity>

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
                <TouchableOpacity style={s.modalOverlay} onPress={() => setShowGenderModal(false)} />
                <View style={s.modalSheet}>
                    {GENDER_OPTIONS.map((g) => (
                        <TouchableOpacity
                            key={g}
                            style={s.genderRow}
                            onPress={() => { setGender(g); setShowGenderModal(false); }}
                        >
                            <Text style={s.genderText}>{g}</Text>
                            <View style={[s.radio, gender === g && s.radioSelected]}>
                                {gender === g && <View style={s.radioDot} />}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const BANNER_H = 200;

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },

    // Banner
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

    // Scroll / Content
    scroll: { flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: 20 },
    backBtn: {
        marginTop: 12, marginBottom: 16,
        width: 36, height: 36,
        alignItems: 'center', justifyContent: 'center',
    },

    titleRow: { flexDirection: 'row', gap: 12, marginBottom: 20, alignItems: 'flex-start' },
    title: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
    subtitle: { fontSize: 13, color: '#334155', lineHeight: 20, marginBottom: 4 },
    required: { color: '#EF4444' },
    desc: { fontSize: 12, color: '#475569', lineHeight: 18 },
    showMore: { color: '#2563EB', fontSize: 12, marginTop: 4 },

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

    // Inputs
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
    textArea: { height: 80, paddingTop: 14 },
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

    // Footer
    footer: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12, backgroundColor: '#fff' },
    continueBtn: {
        height: 54, borderRadius: 27,
        backgroundColor: '#0E3A78',
        alignItems: 'center', justifyContent: 'center',
    },
    continueBtnDisabled: { backgroundColor: '#94A3B8' },
    continueBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

    // Gender Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
    modalSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48,
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
        width: 24, height: 24, borderRadius: 12,
        borderWidth: 2, borderColor: '#CBD5E1',
        alignItems: 'center', justifyContent: 'center',
    },
    radioSelected: { borderColor: '#1E3A8A', backgroundColor: '#1E3A8A' },
    radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
});
