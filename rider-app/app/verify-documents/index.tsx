import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
    Image,
    Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadDocument } from '../../services/uploadBackgroundDoc';
import { validateThaiNationalId } from '../../services/validation';
import { Config } from '../../constants/config';
import { NGROK_HEADERS } from '../../config';

// เปลี่ยน path นี้ให้เป็นไฟล์รูปใหม่ที่เซฟไว้ใน assets/images
const VERIFY_HERO = require('../../assets/images/verify-doc-hero.png');

const CONSENT_A =
    'I consent to WIT Driver (Thailand) Co., Ltd. ["WIT"] collecting, using, processing, and/or disclosing my criminal record information for the purpose of evaluating my suitability to become a partner. I acknowledge that if I do not provide or withdraw my consent, WIT will not be able to evaluate my suitability and consider me for partnership.';

const CONSENT_B =
    'I certify that I have no criminal record or have never been prosecuted for offenses related to crimes against life, body, liberty, or sexual offenses as specified in Section 49 of the Land Transport Act B.E. 2522 (1979). I agree to allow the company to suspend service access in the event that the company discovers a background criminal record that does not meet the criteria set by the company.';

export default function VerifyDocumentsScreen() {
    const router = useRouter();
    const {
        registrationId,
        imageUri: paramImageUri,
        selectedFileName: paramFileName,
        selectedFileMimeType: paramMimeType,
        nationalId: paramNationalId,
        addressOnId: paramAddressOnId,
        fatherFullName: paramFatherFullName,
        motherFullName: paramMotherFullName,
        hasDocument: paramHasDocument,
        consentA: paramConsentA,
        consentB: paramConsentB,
    } = useLocalSearchParams<{
        registrationId?: string;
        imageUri?: string;
        selectedFileName?: string;
        selectedFileMimeType?: string;
        nationalId?: string;
        addressOnId?: string;
        fatherFullName?: string;
        motherFullName?: string;
        hasDocument?: string;
        consentA?: string;
        consentB?: string;
    }>();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [nationalId, setNationalId] = useState('');
    const [addressOnId, setAddressOnId] = useState('');
    const [fatherFullName, setFatherFullName] = useState('');
    const [motherFullName, setMotherFullName] = useState('');
    const [hasDocument, setHasDocument] = useState<boolean | null>(null);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
    const [selectedFileMimeType, setSelectedFileMimeType] = useState<string | null>(null);
    const [consentA, setConsentA] = useState(false);
    const [consentB, setConsentB] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const nationalIdDigits = nationalId.replace(/\D/g, '');
    const nationalIdError =
        nationalId.length > 0 &&
        (nationalIdDigits.length !== 13 || (nationalIdDigits.length === 13 && !validateThaiNationalId(nationalIdDigits)));

    useEffect(() => {
        if (paramImageUri) {
            setImageUri(paramImageUri);
            setSelectedFileName(paramFileName ?? null);
            setSelectedFileMimeType(paramMimeType ?? null);
        }
        if (paramNationalId !== undefined) setNationalId(paramNationalId ?? '');
        if (paramAddressOnId !== undefined) setAddressOnId(paramAddressOnId ?? '');
        if (paramFatherFullName !== undefined) setFatherFullName(paramFatherFullName ?? '');
        if (paramMotherFullName !== undefined) setMotherFullName(paramMotherFullName ?? '');
        if (paramHasDocument !== undefined)
            setHasDocument(
                paramHasDocument === 'true' ? true : paramHasDocument === 'false' ? false : null
            );
        if (paramConsentA !== undefined) setConsentA(paramConsentA === 'true');
        if (paramConsentB !== undefined) setConsentB(paramConsentB === 'true');
    }, [
        paramImageUri,
        paramFileName,
        paramMimeType,
        paramNationalId,
        paramAddressOnId,
        paramFatherFullName,
        paramMotherFullName,
        paramHasDocument,
        paramConsentA,
        paramConsentB,
    ]);

    const isFormValid =
        nationalIdDigits.length === 13 &&
        validateThaiNationalId(nationalIdDigits) &&
        addressOnId.trim().length > 0 &&
        fatherFullName.trim().length > 0 &&
        motherFullName.trim().length > 0 &&
        hasDocument !== null &&
        (hasDocument === false || !!imageUri) &&
        consentA &&
        consentB;

    const getGuidelinesParams = () => ({
        registrationId: (registrationId ?? '').trim(),
        nationalId,
        addressOnId,
        fatherFullName,
        motherFullName,
        hasDocument: hasDocument === null ? '' : String(hasDocument),
        consentA: String(consentA),
        consentB: String(consentB),
    });

    const pickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
            });
            if (result.canceled) return;
            const file = result.assets[0];
            setImageUri(file.uri);
            setSelectedFileName(file.name ?? 'document');
            setSelectedFileMimeType(file.mimeType ?? null);
        } catch (e) {
            Alert.alert(
                'Error',
                'Could not open file picker. You can try selecting a photo from the gallery instead.'
            );
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission required',
                    'Please allow access to photos to upload your document.'
                );
                return;
            }
            const imgResult = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });
            if (!imgResult.canceled && imgResult.assets[0]) {
                const asset = imgResult.assets[0];
                setImageUri(asset.uri);
                setSelectedFileName('image.jpg');
                setSelectedFileMimeType('image/jpeg');
            }
        }
    };

    const handleSubmit = async () => {
        if (!isFormValid) return;
        const regId = (registrationId ?? '').trim();
        if (!regId) {
            Alert.alert(
                'ไม่พบข้อมูลการสมัคร',
                'กรุณาทำขั้นตอนสมัครให้ครบ (สมัครและอัปโหลดใบขับขี่) ก่อนมาหน้าตรวจสอบประวัติ',
                [{ text: 'ตกลง', onPress: () => router.replace('/(tabs)') }]
            );
            return;
        }
        setLoading(true);
        try {
            let documentUrl: string | null = null;
            if (imageUri) {
                documentUrl = await uploadDocument(regId, imageUri, {
                    name: selectedFileName ?? undefined,
                    mimeType: selectedFileMimeType ?? undefined,
                });
            }
            const res = await fetch(
                `${Config.API_URL}/riders/registrations/${encodeURIComponent(regId)}/background-check`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
                    body: JSON.stringify({
                        nationalId: nationalId.trim(),
                        addressOnId: addressOnId.trim(),
                        fatherFullName: fatherFullName.trim(),
                        motherFullName: motherFullName.trim(),
                        hasDocument: !!imageUri,
                        documentUrl: documentUrl ?? undefined,
                        consentA: true,
                        consentB: true,
                    }),
                }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || `Submit failed ${res.status}`);
            }
            router.replace({
                pathname: '/consent-section',
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
                <Text style={s.headerTitle}>Verify Documents</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={s.scroll}
                contentContainerStyle={[s.content, { paddingBottom: 120 }]}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
            >
                <View style={s.illustration}>
                    <Image source={VERIFY_HERO} style={s.illustrationImage} resizeMode="cover" />
                </View>

                <View style={s.infoBanner}>
                    <View style={s.infoIconCircle}>
                        <Text style={s.infoIconLetter}>i</Text>
                    </View>
                    <View style={s.infoTextWrap}>
                        <Text style={s.infoTitle}>Verify your documents</Text>
                        <Text style={s.infoSub}>
                            Please ensure that the information in your documents is up to date.
                        </Text>
                    </View>
                </View>

                <Text style={s.sectionTitle}>Information for Criminal Background Check</Text>

                <TextInput
                    style={[s.input, nationalIdError && s.inputError]}
                    placeholder="Enter 13-digit national ID number"
                    placeholderTextColor="#94A3B8"
                    value={nationalId}
                    onChangeText={(t) => setNationalId(t.replace(/\D/g, '').slice(0, 13))}
                    keyboardType="numeric"
                    maxLength={13}
                />
                {nationalId.length > 0 && nationalIdDigits.length < 13 && (
                    <Text style={s.warningHint}>
                        กรอกให้ครบ 13 หลัก ({nationalIdDigits.length}/13)
                    </Text>
                )}
                {nationalIdDigits.length === 13 && !validateThaiNationalId(nationalIdDigits) && (
                    <Text style={s.errorHint}>เลขบัตรประชาชนไม่ถูกต้อง</Text>
                )}

                <TextInput
                    style={[s.input, s.inputMultiline]}
                    placeholder="House No., Street, Subdistrict, District, Province"
                    placeholderTextColor="#94A3B8"
                    value={addressOnId}
                    onChangeText={setAddressOnId}
                    multiline
                />

                <TextInput
                    style={s.input}
                    placeholder="Father's Full Name"
                    placeholderTextColor="#94A3B8"
                    value={fatherFullName}
                    onChangeText={setFatherFullName}
                />

                <TextInput
                    style={s.input}
                    placeholder="Mother's Full Name"
                    placeholderTextColor="#94A3B8"
                    value={motherFullName}
                    onChangeText={setMotherFullName}
                />

                <Text style={s.label}>Background Verification Documents*</Text>
                <TouchableOpacity
                    style={s.dropdown}
                    onPress={() => setShowDropdown(true)}
                    activeOpacity={0.7}
                >
                    <Text style={[s.dropdownText, hasDocument === null && s.dropdownPlaceholder]}>
                        {hasDocument === null ? 'Yes / No' : hasDocument ? 'Yes' : 'No'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#64748B" />
                </TouchableOpacity>

                <Modal visible={showDropdown} transparent animationType="fade">
                    <TouchableOpacity
                        style={s.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowDropdown(false)}
                    >
                        <View style={s.modalContent}>
                            <TouchableOpacity
                                style={s.modalOption}
                                onPress={() => {
                                    setHasDocument(true);
                                    setShowDropdown(false);
                                }}
                            >
                                <Text style={s.modalOptionText}>Yes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={s.modalOption}
                                onPress={() => {
                                    setHasDocument(false);
                                    setImageUri(null);
                                    setSelectedFileName(null);
                                    setSelectedFileMimeType(null);
                                    setShowDropdown(false);
                                }}
                            >
                                <Text style={s.modalOptionText}>No</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {hasDocument === true && (
                    <>
                        <View style={s.uploadSection}>
                            <View style={s.uploadSectionLabelWrap}>
                                <Text style={s.uploadSectionLabel}>Information for</Text>
                                <Text style={s.uploadSectionLabel}>Criminal Background</Text>
                            </View>
                            <TouchableOpacity
                                style={s.uploadPhotoBtn}
                                onPress={() =>
                                    imageUri
                                        ? pickFile()
                                        : router.push({
                                              pathname: '/verify-documents/guidelines',
                                              params: getGuidelinesParams(),
                                          } as any)
                                }
                                activeOpacity={0.8}
                            >
                                {imageUri ? (
                                    selectedFileMimeType?.startsWith('image/') ? (
                                        <Image
                                            source={{ uri: imageUri }}
                                            style={s.uploadPhotoThumb}
                                        />
                                    ) : (
                                        <View style={s.uploadFilePlaceholder}>
                                            <Ionicons name="document" size={28} color="#64748B" />
                                            <Text style={s.uploadFileLabel} numberOfLines={1}>
                                                {selectedFileName ?? 'File'}
                                            </Text>
                                        </View>
                                    )
                                ) : (
                                    <>
                                        <Text style={s.uploadPhotoPlus}>+</Text>
                                        <Text style={s.uploadPhotoLabel}>Upload File</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            onPress={() =>
                                router.push({
                                    pathname: '/verify-documents/guidelines',
                                    params: getGuidelinesParams(),
                                } as any)
                            }
                            style={s.guidelineLinkWrap}
                        >
                            <Text style={s.guidelineLink}>View Document Upload Guidelines</Text>
                            <Ionicons name="chevron-forward" size={18} color="#0E3A78" />
                        </TouchableOpacity>
                    </>
                )}

                <TouchableOpacity
                    style={s.checkRow}
                    onPress={() => setConsentA(!consentA)}
                    activeOpacity={0.7}
                >
                    <View style={[s.checkbox, consentA && s.checkboxActive]}>
                        {consentA && <Ionicons name="checkmark" size={16} color="#FFF" />}
                    </View>
                    <Text style={s.checkText}>{CONSENT_A}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={s.checkRow}
                    onPress={() => setConsentB(!consentB)}
                    activeOpacity={0.7}
                >
                    <View style={[s.checkbox, consentB && s.checkboxActive]}>
                        {consentB && <Ionicons name="checkmark" size={16} color="#FFF" />}
                    </View>
                    <Text style={s.checkText}>{CONSENT_B}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/verify-documents/consent')}>
                    <Text style={s.readMoreLink}>Read full consent text</Text>
                </TouchableOpacity>
            </ScrollView>

            <View style={[s.footer, { paddingBottom: Math.max(24, insets.bottom + 12) }]}>
                <TouchableOpacity
                    style={[s.submitBtn, (!isFormValid || loading) && s.submitBtnDisabled]}
                    disabled={!isFormValid || loading}
                    onPress={handleSubmit}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={s.submitText}>Continue</Text>
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
    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 32 },
    illustration: {
        height: 140,
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        backgroundColor: '#E2E8F0',
    },
    illustrationImage: {
        width: '100%',
        height: '100%',
    },
    infoBanner: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        minHeight: 52,
    },
    infoIconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#1E40AF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    infoIconLetter: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    infoTextWrap: { flex: 1 },
    infoTitle: { fontSize: 15, fontWeight: '700', color: '#1E40AF', marginBottom: 4 },
    infoSub: { fontSize: 13, color: '#3B82F6', lineHeight: 19 },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 12,
        marginTop: 4,
    },
    label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#2563EB',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#0F172A',
        marginBottom: 14,
    },
    inputError: { borderColor: '#EF4444' },
    warningHint: {
        color: '#F59E0B',
        fontSize: 13,
        fontWeight: '500',
        marginTop: -8,
        marginBottom: 14,
    },
    errorHint: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '500',
        marginTop: -8,
        marginBottom: 14,
    },
    inputMultiline: { minHeight: 64, textAlignVertical: 'top' },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#2563EB',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 20,
    },
    dropdownText: { fontSize: 15, color: '#0F172A' },
    dropdownPlaceholder: { color: '#94A3B8' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: { backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden' },
    modalOption: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalOptionText: { fontSize: 16, color: '#0F172A' },
    uploadSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 16,
    },
    uploadSectionLabelWrap: { flex: 1 },
    uploadSectionLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        lineHeight: 22,
    },
    uploadPhotoBtn: {
        width: 100,
        height: 100,
        backgroundColor: '#F1F5F9',
        borderWidth: 2,
        borderColor: '#CBD5E1',
        borderStyle: 'dashed',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadPhotoPlus: { fontSize: 28, fontWeight: '300', color: '#0F172A', lineHeight: 32 },
    uploadPhotoLabel: { fontSize: 12, color: '#475569', marginTop: 4, fontWeight: '500' },
    uploadPhotoThumb: { width: '100%', height: '100%', borderRadius: 10, resizeMode: 'cover' },
    uploadFilePlaceholder: { alignItems: 'center', justifyContent: 'center', padding: 8 },
    uploadFileLabel: { fontSize: 10, color: '#64748B', marginTop: 4, maxWidth: '100%' },
    guidelineLinkWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    guidelineLink: { fontSize: 14, fontWeight: '600', color: '#0E3A78', marginRight: 4 },
    checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        borderRadius: 5,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        marginTop: 2,
    },
    checkboxActive: { backgroundColor: '#0E3A78', borderColor: '#0E3A78' },
    checkText: { flex: 1, fontSize: 12, color: '#475569', lineHeight: 18 },
    readMoreLink: { fontSize: 13, fontWeight: '600', color: '#0E3A78', marginBottom: 12 },
    footer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 24,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    submitBtn: {
        backgroundColor: '#0E3A78',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitBtnDisabled: { backgroundColor: '#94A3B8', opacity: 0.8 },
    submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
