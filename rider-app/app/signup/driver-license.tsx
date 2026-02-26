import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSignup } from '../../context/SignupContext';
const SHORT_DESC = 'ใบขับขี่ที่ถูกต้อง ควรมีลักษณะดัง..';
const FULL_DESC =
    'ใบขับขี่ที่ถูกต้อง ควรมีลักษณะดังต่อไปนี้:\n• โปรดอัพโหลดใบขับขี่สาธารณะ (ถ้ามี)\n• กรณีไม่มีใบขับขี่สาธารณะ สามารถถ่ายโหลดใบขับขี่ส่วนบุคคลได้\n• ข้อมูลในใบขับขี่ต้องตรงกับบัตรประจำตัวประชาชน\n• ใบขับขี่อยู่ในสภาพสมบูรณ์และไม่หมดอายุ\n• ไม่แก้ไขและตกแต่งรูป\n• เห็นข้อมูลชัดเจนและครบถ้วน';

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

    const canContinue =
        licenseNo.trim().length > 0 &&
        licenseType.trim().length > 0 &&
        issueDate.trim().length > 0 &&
        expiryDate.trim().length > 0 &&
        province.trim().length > 0 &&
        !!data.licenseUri;

    const handleContinue = async () => {
        // Ensure selfie has been captured before final submit
        if (!data.selfieUri) {
            Alert.alert(
                'กรุณาถ่ายรูปเซลฟี่',
                'โปรดถ่ายและอัปโหลดรูปเซลฟี่ของคุณก่อนดำเนินการต่อ',
                [
                    {
                        text: 'ไปถ่ายรูป',
                        onPress: () => {
                            router.push('/signup/selfie-guide' as any);
                        },
                    },
                    { text: 'ยกเลิก', style: 'cancel' },
                ],
            );
            return;
        }

        // Validate all required fields
        if (!licenseNo.trim()) { Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกเลขใบขับขี่'); return; }
        if (!licenseType.trim()) { Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกชนิดใบขับขี่'); return; }
        if (!issueDate.trim()) { Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกวันอนุญาต'); return; }
        if (!expiryDate.trim()) { Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกวันหมดอายุ'); return; }
        if (!province.trim()) { Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกจังหวัดออกใบขับขี่'); return; }
        if (!data.licenseUri) { Alert.alert('กรุณาอัปโหลดรูป', 'กรุณาอัปโหลดรูปใบขับขี่'); return; }

        // Save license fields to context (for future reads)
        setField('licenseNo', licenseNo.trim());
        setField('licenseType', licenseType.trim());
        setField('licenseIssueDate', issueDate.trim());
        setField('licenseExpiryDate', expiryDate.trim());
        setField('licenseProvince', province.trim());

        // Submit all data — pass current values directly to avoid async state timing issue
        setLoading(true);
        const result = await submit({
            licenseNo: licenseNo.trim(),
            licenseType: licenseType.trim(),
            licenseIssueDate: issueDate.trim(),
            licenseExpiryDate: expiryDate.trim(),
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
                    {/* Back */}
                    <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={22} color="#111" />
                    </TouchableOpacity>

                    {/* Title row */}
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
                                <Text style={s.showMore}>{showMore ? 'Show less' : 'Show more'}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Upload Photo */}
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

                    {/* Fields */}
                    <TextInput
                        style={s.input}
                        placeholder="เลขใบขับขี่"
                        placeholderTextColor="#aaa"
                        value={licenseNo}
                        onChangeText={setLicenseNo}
                    />
                    <TextInput
                        style={s.input}
                        placeholder="ชนิดใบขับขี่"
                        placeholderTextColor="#aaa"
                        value={licenseType}
                        onChangeText={setLicenseType}
                    />
                    <TextInput
                        style={s.input}
                        placeholder="วันอนุญาต วัน/เดือน/ปี ค.ศ"
                        placeholderTextColor="#aaa"
                        value={issueDate}
                        onChangeText={setIssueDate}
                    />
                    <TextInput
                        style={s.input}
                        placeholder="วันบัตรหมดอายุ วัน/เดือน/ปี ค.ศ"
                        placeholderTextColor="#aaa"
                        value={expiryDate}
                        onChangeText={setExpiryDate}
                    />
                    <TextInput
                        style={s.input}
                        placeholder="จังหวัดออกใบขับขี่"
                        placeholderTextColor="#aaa"
                        value={province}
                        onChangeText={setProvince}
                    />
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
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },

    // Banner
    banner: {
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    phoneCard: {
        width: 70, height: 105, backgroundColor: '#fff',
        borderRadius: 12, alignItems: 'center', justifyContent: 'center',
        gap: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8,
        elevation: 4, padding: 10,
    },
    phoneFace: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#3B82F6', alignItems: 'center',
        justifyContent: 'center', overflow: 'hidden',
    },
    phonePhoto: { width: 44, height: 44, borderRadius: 22 },
    phoneCheck: {
        backgroundColor: '#22C55E', borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 5, alignItems: 'center',
    },

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
        width: 88, height: 88, borderRadius: 8,
        borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed',
        alignItems: 'center', justifyContent: 'center',
        gap: 4, flexShrink: 0, overflow: 'hidden',
    },
    uploadPreview: { width: 88, height: 88, borderRadius: 8 },
    uploadText: { fontSize: 11, color: '#64748B', textAlign: 'center' },

    input: {
        borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 10,
        height: 52, paddingHorizontal: 16, fontSize: 15,
        color: '#0F172A', marginBottom: 12,
    },

    footer: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12, backgroundColor: '#fff' },
    continueBtn: {
        height: 54, borderRadius: 27,
        backgroundColor: '#0E3A78',
        alignItems: 'center', justifyContent: 'center',
    },
    continueBtnDisabled: { backgroundColor: '#94A3B8' },
    continueBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
