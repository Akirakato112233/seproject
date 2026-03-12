import React, { useState, useEffect, useRef } from 'react';
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
    KeyboardAvoidingView,
    Platform,
    Modal,
    FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Config } from '../../constants/config';
import { uploadFileFromUri } from '../../services/uploadBackgroundDoc';

const ILLUSTRATION = require('../../assets/images/vehicle-hero.png');

const DISCLAIMER =
    'ข้าพเจ้าได้กรอกข้อมูลนี้ถูกต้องครบถ้วน หากตรวจสอบแล้วพบว่าข้อมูลไม่ถูกต้อง ข้าพเจ้ายินยอมให้ข้อมูลเป็นโมฆะและยินยอมให้ระบบทำการเปลี่ยนแปลงข้อมูลให้เป็นไปตามความจริง ข้าพเจ้าได้ตรวจสอบและยินยอมให้ระบบทำการเปลี่ยนแปลงข้อมูลให้เป็นไปตามความจริง ข้าพเจ้าตกลงที่จะดำเนินการแก้ไขข้อมูลภายใน 14 วันนับจากวันที่ได้รับแจ้ง มิฉะนั้นการทำงานของข้าพเจ้าอาจถูกระงับชั่วคราว';

const PROVINCES = [
    'กรุงเทพมหานคร',
    'กระบี่',
    'กาญจนบุรี',
    'กาฬสินธุ์',
    'กำแพงเพชร',
    'ขอนแก่น',
    'จันทบุรี',
    'ฉะเชิงเทรา',
    'ชลบุรี',
    'ชัยนาท',
    'ชัยภูมิ',
    'ชุมพร',
    'เชียงราย',
    'เชียงใหม่',
    'ตรัง',
    'ตราด',
    'ตาก',
    'นครนายก',
    'นครปฐม',
    'นครพนม',
    'นครราชสีมา',
    'นครศรีธรรมราช',
    'นครสวรรค์',
    'นนทบุรี',
    'นราธิวาส',
    'น่าน',
    'บึงกาฬ',
    'บุรีรัมย์',
    'ปทุมธานี',
    'ประจวบคีรีขันธ์',
    'ปราจีนบุรี',
    'ปัตตานี',
    'พระนครศรีอยุธยา',
    'พะเยา',
    'พังงา',
    'พัทลุง',
    'พิจิตร',
    'พิษณุโลก',
    'เพชรบุรี',
    'เพชรบูรณ์',
    'แพร่',
    'ภูเก็ต',
    'มหาสารคาม',
    'มุกดาหาร',
    'แม่ฮ่องสอน',
    'ยโสธร',
    'ยะลา',
    'ร้อยเอ็ด',
    'ระนอง',
    'ระยอง',
    'ราชบุรี',
    'ลพบุรี',
    'ลำปาง',
    'ลำพูน',
    'เลย',
    'ศรีสะเกษ',
    'สกลนคร',
    'สงขลา',
    'สตูล',
    'สมุทรปราการ',
    'สมุทรสงคราม',
    'สมุทรสาคร',
    'สระแก้ว',
    'สระบุรี',
    'สิงห์บุรี',
    'สุโขทัย',
    'สุพรรณบุรี',
    'สุราษฎร์ธานี',
    'สุรินทร์',
    'หนองคาย',
    'หนองบัวลำภู',
    'อ่างทอง',
    'อำนาจเจริญ',
    'อุดรธานี',
    'อุตรดิตถ์',
    'อุทัยธานี',
    'อุบลราชธานี',
];

const FUEL_OPTIONS = [
    'เบนซิน',
    'แก๊สโซฮอล์',
    'ดีเซล',
    'ไฟฟ้า',
    'ไฮบริด',
    'LPG',
    'NGV',
    'อื่น ๆ',
];

/* ───── helpers ───── */

function stripEmoji(str: string): string {
    return str.replace(
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{200D}\u{FE0F}\u{20E3}\u{E0020}-\u{E007F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu,
        '',
    );
}

function collapseSpaces(str: string): string {
    return str.replace(/[ \t]{2,}/g, ' ');
}

function sanitize(str: string): string {
    return collapseSpaces(stripEmoji(str.replace(/[\r\n]/g, ' ')));
}

function isValidThaiNationalId(id: string): boolean {
    if (!/^\d{13}$/.test(id)) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(id[i], 10) * (13 - i);
    }
    return (11 - (sum % 11)) % 10 === parseInt(id[12], 10);
}

/* ───── field definitions ───── */

const FIELDS = [
    { key: 'vehicleRegistrationNo', label: 'ทะเบียนรถ' },
    { key: 'vehicleBrand', label: 'ยี่ห้อรถของคุณคืออะไร?' },
    { key: 'vehicleModel', label: 'รุ่นรถของคุณคืออะไร?' },
    { key: 'vehicleColor', label: 'สีของรถคุณ' },
    { key: 'vehicleYear', label: 'ปีที่ผลิต (ค.ศ.)' },
    { key: 'vehicleRegistrationProvince', label: 'จังหวัดจดทะเบียนรถ' },
    { key: 'vehicleFuel', label: 'เชื้อเพลิง' },
    { key: 'vehicleEngineCc', label: 'เครื่องยนต์ (CC)' },
    { key: 'rightsHolderName', label: 'ชื่อเจ้าของสิทธิ์' },
    { key: 'rightsHolderId', label: 'เลขที่บัตรผู้ถือกรรมสิทธิ์' },
    { key: 'possessorName', label: 'ผู้ครอบครอง' },
    { key: 'possessorId', label: 'เลขบัตรผู้ครอบครอง' },
] as const;

type FieldKey = (typeof FIELDS)[number]['key'];

function getInitialValues(): Record<FieldKey, string> {
    return FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {} as Record<FieldKey, string>);
}

/* ───── component ───── */

export default function VehicleRegistrationScreen() {
    const router = useRouter();
    const {
        registrationId,
        photoUri: paramPhotoUri,
        photoUploadUrl: paramUploadUrl,
        formValues: paramFormValues,
        disclaimerAgreed: paramDisclaimerAgreed,
    } = useLocalSearchParams<{
        registrationId?: string;
        photoUri?: string;
        photoUploadUrl?: string;
        formValues?: string;
        disclaimerAgreed?: string;
    }>();
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);

    const [values, setValues] = useState(getInitialValues);
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [photoUploadUrl, setPhotoUploadUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [disclaimerAgreed, setDisclaimerAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showProvinceModal, setShowProvinceModal] = useState(false);
    const [provinceSearch, setProvinceSearch] = useState('');
    const [showFuelModal, setShowFuelModal] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (paramUploadUrl && paramPhotoUri) {
            setPhotoUri(paramPhotoUri);
            setPhotoUploadUrl(paramUploadUrl);
        }
    }, [paramUploadUrl, paramPhotoUri]);

    useEffect(() => {
        if (paramFormValues) {
            try {
                const parsed = JSON.parse(paramFormValues) as Record<FieldKey, string>;
                setValues((prev) => ({ ...getInitialValues(), ...parsed }));
            } catch (_) {}
        }
    }, [paramFormValues]);

    useEffect(() => {
        if (paramDisclaimerAgreed === '1') setDisclaimerAgreed(true);
    }, [paramDisclaimerAgreed]);

    /* ── input sanitisation & per-field filtering ── */

    const updateField = (key: FieldKey, raw: string) => {
        let text = sanitize(raw);
        switch (key) {
            case 'vehicleRegistrationNo':
                text = text.replace(/[^\u0E00-\u0E7F0-9\s]/g, '').slice(0, 10);
                break;
            case 'vehicleBrand':
                text = text.slice(0, 50);
                break;
            case 'vehicleModel':
                text = text.replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s\-.]/g, '').slice(0, 50);
                break;
            case 'vehicleColor':
                text = text.slice(0, 30);
                break;
            case 'vehicleYear':
                text = text.replace(/\D/g, '').slice(0, 4);
                break;
            case 'vehicleEngineCc':
                text = text.replace(/\D/g, '').slice(0, 5);
                break;
            case 'rightsHolderName':
            case 'possessorName':
                text = text.slice(0, 100);
                break;
            case 'rightsHolderId':
            case 'possessorId':
                text = text.replace(/\D/g, '').slice(0, 13);
                break;
            default:
                break;
        }
        setValues((prev) => ({ ...prev, [key]: text }));
    };

    /* ── validation ── */

    const getFormatError = (key: FieldKey): string | null => {
        const v = values[key].trim();
        if (!v) return null;
        switch (key) {
            case 'vehicleRegistrationNo':
                if (!/^[\u0E00-\u0E7F0-9\s]+$/.test(v)) return 'รูปแบบทะเบียนรถไม่ถูกต้อง';
                if (v.length < 2) return 'ทะเบียนรถต้องมีอย่างน้อย 2 ตัวอักษร';
                return null;
            case 'vehicleBrand':
                if (/^\d+$/.test(v)) return 'ยี่ห้อรถไม่ถูกต้อง';
                if (v.length < 2) return 'ยี่ห้อรถต้องมีอย่างน้อย 2 ตัวอักษร';
                return null;
            case 'vehicleModel':
                if (!/^[\u0E00-\u0E7Fa-zA-Z0-9\s\-.]+$/.test(v)) return 'รุ่นรถไม่ถูกต้อง';
                return null;
            case 'vehicleColor':
                if (/^\d+$/.test(v)) return 'สีรถไม่ถูกต้อง';
                if (v.length < 2) return 'สีรถต้องมีอย่างน้อย 2 ตัวอักษร';
                return null;
            case 'vehicleYear': {
                if (!/^\d+$/.test(v)) return 'ปีที่ผลิตต้องเป็นตัวเลข';
                if (v.length === 4) {
                    const year = parseInt(v, 10);
                    const curYear = new Date().getFullYear();
                    if (year > 2500) return 'กรุณากรอกเป็น ค.ศ. เช่น 2024';
                    if (year < 1950) return 'ปีที่ผลิตไม่ถูกต้อง';
                    if (year > curYear + 1) return `ปีที่ผลิตต้องไม่มากกว่า ${curYear + 1}`;
                }
                return null;
            }
            case 'vehicleEngineCc': {
                if (!/^\d+$/.test(v)) return 'เครื่องยนต์ต้องเป็นตัวเลข';
                const cc = parseInt(v, 10);
                if (cc < 50 || cc > 2500) return 'ขนาดเครื่องยนต์ไม่ถูกต้อง (50-2500 CC)';
                return null;
            }
            case 'rightsHolderName':
                if (/^\d+$/.test(v)) return 'ชื่อเจ้าของสิทธิ์ไม่ถูกต้อง';
                if (v.length < 2) return 'ชื่อเจ้าของสิทธิ์ต้องมีอย่างน้อย 2 ตัวอักษร';
                return null;
            case 'rightsHolderId':
                if (v.length === 13 && !isValidThaiNationalId(v)) return 'เลขบัตรประชาชนไม่ถูกต้อง';
                return null;
            case 'possessorName':
                if (/^\d+$/.test(v)) return 'ชื่อผู้ครอบครองไม่ถูกต้อง';
                if (v.length < 2) return 'ชื่อผู้ครอบครองต้องมีอย่างน้อย 2 ตัวอักษร';
                return null;
            case 'possessorId':
                if (v.length === 13 && !isValidThaiNationalId(v)) return 'เลขบัตรผู้ครอบครองไม่ถูกต้อง';
                return null;
            default:
                return null;
        }
    };

    const getRequiredMessage = (key: FieldKey): string => {
        const messages: Record<FieldKey, string> = {
            vehicleRegistrationNo: 'กรุณากรอกทะเบียนรถ',
            vehicleBrand: 'กรุณากรอกยี่ห้อรถ',
            vehicleModel: 'กรุณากรอกรุ่นรถ',
            vehicleColor: 'กรุณากรอกสีรถ',
            vehicleYear: 'กรุณากรอกปีที่ผลิตเป็น ค.ศ. 4 หลัก',
            vehicleRegistrationProvince: 'กรุณาเลือกจังหวัดจดทะเบียนรถ',
            vehicleFuel: 'กรุณาเลือกประเภทเชื้อเพลิง',
            vehicleEngineCc: 'กรุณากรอกขนาดเครื่องยนต์เป็นตัวเลข',
            rightsHolderName: 'กรุณากรอกชื่อเจ้าของสิทธิ์',
            rightsHolderId: 'กรุณากรอกเลขบัตรประชาชน 13 หลัก',
            possessorName: 'กรุณากรอกชื่อผู้ครอบครอง',
            possessorId: 'กรุณากรอกเลขบัตรผู้ครอบครอง 13 หลัก',
        };
        return messages[key];
    };

    const getDisplayError = (key: FieldKey): string | null => {
        const v = values[key].trim();
        if (!v) return submitted ? getRequiredMessage(key) : null;
        return getFormatError(key);
    };

    const getDisplayWarning = (key: FieldKey): string | null => {
        const v = values[key];
        if (!v || getDisplayError(key)) return null;
        switch (key) {
            case 'vehicleYear':
                if (v.length > 0 && v.length < 4) return `กรอกให้ครบ 4 หลัก (${v.length}/4)`;
                return null;
            case 'rightsHolderId':
            case 'possessorId':
                if (v.length > 0 && v.length < 13)
                    return `กรอกให้ครบ 13 หลัก (${v.length}/13)`;
                return null;
            case 'vehicleEngineCc':
                if (v.length > 0 && parseInt(v, 10) > 0 && parseInt(v, 10) < 50)
                    return 'ขนาดเครื่องยนต์ต้องอย่างน้อย 50 CC';
                return null;
            default:
                return null;
        }
    };

    /* ── form validity & error count ── */

    const isFormValid = (() => {
        if (!photoUploadUrl || !disclaimerAgreed) return false;
        for (const f of FIELDS) {
            const v = values[f.key].trim();
            if (!v) return false;
            if (getFormatError(f.key)) return false;
        }
        return true;
    })();

    const errorCount = (() => {
        let count = 0;
        if (!photoUploadUrl) count++;
        for (const f of FIELDS) {
            const v = values[f.key].trim();
            if (!v || getFormatError(f.key)) count++;
        }
        if (!disclaimerAgreed) count++;
        return count;
    })();

    /* ── photo upload ── */

    const pickAndUploadPhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('ต้องการสิทธิ์', 'กรุณาอนุญาตการเข้าถึงรูปภาพ');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 10],
            quality: 0.9,
        });
        if (result.canceled || !result.assets[0]) return;
        const uri = result.assets[0].uri;
        setPhotoUri(uri);
        setUploading(true);
        try {
            const url = await uploadFileFromUri(uri, { prefix: 'vehicle-book' });
            setPhotoUploadUrl(url);
        } catch (e) {
            console.error(e);
            Alert.alert('อัปโหลดไม่สำเร็จ', e instanceof Error ? e.message : 'กรุณาลองใหม่');
        } finally {
            setUploading(false);
        }
    };

    /* ── submit ── */

    const handleContinue = async () => {
        setSubmitted(true);

        if (!photoUploadUrl) {
            Alert.alert('กรุณาอัปโหลดเอกสาร', 'กรุณาอัปโหลดรูปรายการจดทะเบียนรถ');
            scrollRef.current?.scrollTo({ y: 0, animated: true });
            return;
        }

        for (const f of FIELDS) {
            const v = values[f.key].trim();
            if (!v) {
                scrollRef.current?.scrollTo({ y: 0, animated: true });
                return;
            }
            const fmtErr = getFormatError(f.key);
            if (fmtErr) {
                scrollRef.current?.scrollTo({ y: 0, animated: true });
                return;
            }
        }

        if (!disclaimerAgreed) return;

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
                `${Config.API_URL}/riders/registrations/${encodeURIComponent(regId)}/vehicle-book`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        vehicleBookPhotoUri: photoUploadUrl,
                        vehicleRegistrationNo: values.vehicleRegistrationNo.trim(),
                        vehicleBrand: values.vehicleBrand.trim(),
                        vehicleModel: values.vehicleModel.trim(),
                        vehicleColor: values.vehicleColor.trim(),
                        vehicleYear: values.vehicleYear.trim(),
                        vehicleRegistrationProvince:
                            values.vehicleRegistrationProvince.trim(),
                        vehicleFuel: values.vehicleFuel.trim(),
                        vehicleEngineCc: values.vehicleEngineCc.trim(),
                        rightsHolderName: values.rightsHolderName.trim(),
                        rightsHolderId: values.rightsHolderId.trim(),
                        possessorName: values.possessorName.trim(),
                        possessorId: values.possessorId.trim(),
                        vehicleBookDisclaimerAgreed: true,
                    }),
                },
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || `Request failed ${res.status}`);
            }
            router.replace({
                pathname: '/plate-color',
                params: { registrationId: regId },
            } as any);
        } catch (e) {
            console.error(e);
            Alert.alert('เกิดข้อผิดพลาด', e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
        } finally {
            setLoading(false);
        }
    };

    /* ── render helpers ── */

    const renderHints = (key: FieldKey) => {
        const error = getDisplayError(key);
        const warning = !error ? getDisplayWarning(key) : null;
        return (
            <>
                {error && <Text style={s.errorHint}>{error}</Text>}
                {warning && <Text style={s.warningHint}>{warning}</Text>}
            </>
        );
    };

    return (
        <SafeAreaView style={s.safeArea} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={s.headerTitle} numberOfLines={1}>
                    เล่มรถ
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    ref={scrollRef}
                    style={s.scroll}
                    contentContainerStyle={[s.content, { paddingBottom: 120 }]}
                    showsVerticalScrollIndicator
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── illustration ── */}
                    <View style={s.illustration}>
                        <Image
                            source={ILLUSTRATION}
                            style={s.illustrationImage}
                            resizeMode="cover"
                        />
                    </View>

                    {/* ── title + upload ── */}
                    <View style={s.titleUploadRow}>
                        <View style={s.titleBlock}>
                            <Text style={s.title}>รูปรายการจดทะเบียนรถ</Text>
                            <Text style={s.subtitle}>(เล่มรถ)</Text>
                            <Text style={s.intro}>กรณีที่ผู้สมัครเป็นเจ้าของรถ*</Text>
                        </View>
                        <View style={s.uploadBox}>
                            <TouchableOpacity
                                style={s.uploadTouch}
                                onPress={() =>
                                    photoUri
                                        ? pickAndUploadPhoto()
                                        : router.push({
                                              pathname: '/vehicle-registration/guidelines',
                                              params: {
                                                  registrationId: (registrationId ?? '').trim(),
                                                  formValues: JSON.stringify(values),
                                                  disclaimerAgreed: disclaimerAgreed ? '1' : '0',
                                              },
                                          } as any)
                                }
                                disabled={uploading}
                                activeOpacity={0.8}
                            >
                                {photoUri ? (
                                    <Image
                                        source={{ uri: photoUri }}
                                        style={s.uploadImage}
                                        resizeMode="cover"
                                    />
                                ) : uploading ? (
                                    <ActivityIndicator size="large" color="#0E3A78" />
                                ) : (
                                    <>
                                        <Ionicons name="add" size={36} color="#94A3B8" />
                                        <Text style={s.uploadLabel}>Upload Photo</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                    {submitted && !photoUploadUrl && (
                        <Text style={s.errorHint}>กรุณาอัปโหลดรูปรายการจดทะเบียนรถ</Text>
                    )}

                    <TouchableOpacity
                        onPress={() =>
                            router.push({
                                pathname: '/vehicle-registration/guidelines',
                                params: {
                                    registrationId: (registrationId ?? '').trim(),
                                    formValues: JSON.stringify(values),
                                    disclaimerAgreed: disclaimerAgreed ? '1' : '0',
                                },
                            } as any)
                        }
                        style={s.guidelineLink}
                    >
                        <Text style={s.guidelineLinkText}>ดูตัวอย่างการอัปโหลดเอกสาร</Text>
                        <Ionicons name="chevron-forward" size={18} color="#0E3A78" />
                    </TouchableOpacity>

                    {/* ══════════════ FIELDS ══════════════ */}
                    {FIELDS.map(({ key, label }) => {
                        const error = getDisplayError(key);
                        const hasErr = !!error;

                        /* ── ทะเบียนรถ ── */
                        if (key === 'vehicleRegistrationNo') {
                            return (
                                <View key={key} style={s.fieldWrap}>
                                    <Text style={s.fieldLabel}>{label} *</Text>
                                    <TextInput
                                        style={[s.input, hasErr && s.inputError]}
                                        value={values[key]}
                                        onChangeText={(t) => updateField(key, t)}
                                        placeholder="ทะเบียนรถ..."
                                        placeholderTextColor="#94A3B8"
                                        maxLength={10}
                                    />
                                    {renderHints(key)}
                                </View>
                            );
                        }

                        /* ── ยี่ห้อ ── */
                        if (key === 'vehicleBrand') {
                            return (
                                <View key={key} style={s.fieldWrap}>
                                    <Text style={s.fieldLabel}>{label} *</Text>
                                    <TextInput
                                        style={[s.input, hasErr && s.inputError]}
                                        value={values[key]}
                                        onChangeText={(t) => updateField(key, t)}
                                        placeholder="ยี่ห้อรถของคุณคืออะไร?..."
                                        placeholderTextColor="#94A3B8"
                                        maxLength={50}
                                    />
                                    {renderHints(key)}
                                </View>
                            );
                        }

                        /* ── รุ่นรถ ── */
                        if (key === 'vehicleModel') {
                            return (
                                <View key={key} style={s.fieldWrap}>
                                    <Text style={s.fieldLabel}>{label} *</Text>
                                    <TextInput
                                        style={[s.input, hasErr && s.inputError]}
                                        value={values[key]}
                                        onChangeText={(t) => updateField(key, t)}
                                        placeholder="รุ่นรถของคุณคืออะไร?..."
                                        placeholderTextColor="#94A3B8"
                                        maxLength={50}
                                    />
                                    {renderHints(key)}
                                </View>
                            );
                        }

                        /* ── สีรถ ── */
                        if (key === 'vehicleColor') {
                            return (
                                <View key={key} style={s.fieldWrap}>
                                    <Text style={s.fieldLabel}>{label} *</Text>
                                    <TextInput
                                        style={[s.input, hasErr && s.inputError]}
                                        value={values[key]}
                                        onChangeText={(t) => updateField(key, t)}
                                        placeholder="สีของรถคุณ..."
                                        placeholderTextColor="#94A3B8"
                                        maxLength={30}
                                    />
                                    {renderHints(key)}
                                </View>
                            );
                        }

                        /* ── ปีที่ผลิต ── */
                        if (key === 'vehicleYear') {
                            return (
                                <View key={key} style={s.fieldWrap}>
                                    <Text style={s.fieldLabel}>{label} *</Text>
                                    <TextInput
                                        style={[s.input, hasErr && s.inputError]}
                                        value={values[key]}
                                        onChangeText={(t) => updateField(key, t)}
                                        placeholder="เช่น 2020"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="number-pad"
                                        maxLength={4}
                                    />
                                    {renderHints(key)}
                                </View>
                            );
                        }

                        /* ── จังหวัด (dropdown) ── */
                        if (key === 'vehicleRegistrationProvince') {
                            return (
                                <View key={key} style={s.fieldWrap}>
                                    <Text style={s.fieldLabel}>{label} *</Text>
                                    <TouchableOpacity
                                        style={[s.dropdown, hasErr && s.inputError]}
                                        onPress={() => {
                                            setProvinceSearch('');
                                            setShowProvinceModal(true);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                s.dropdownText,
                                                !values[key] && s.dropdownPlaceholder,
                                            ]}
                                        >
                                            {values[key] || 'เลือกจังหวัดจดทะเบียนรถ'}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color="#64748B" />
                                    </TouchableOpacity>
                                    {renderHints(key)}
                                </View>
                            );
                        }

                        /* ── เชื้อเพลิง (dropdown) ── */
                        if (key === 'vehicleFuel') {
                            return (
                                <View key={key} style={s.fieldWrap}>
                                    <Text style={s.fieldLabel}>{label} *</Text>
                                    <TouchableOpacity
                                        style={[s.dropdown, hasErr && s.inputError]}
                                        onPress={() => setShowFuelModal(true)}
                                    >
                                        <Text
                                            style={[
                                                s.dropdownText,
                                                !values[key] && s.dropdownPlaceholder,
                                            ]}
                                        >
                                            {values[key] || 'เลือกเชื้อเพลิง...'}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color="#64748B" />
                                    </TouchableOpacity>
                                    {renderHints(key)}
                                </View>
                            );
                        }

                        /* ── CC ── */
                        if (key === 'vehicleEngineCc') {
                            return (
                                <View key={key} style={s.fieldWrap}>
                                    <Text style={s.fieldLabel}>{label} *</Text>
                                    <TextInput
                                        style={[s.input, hasErr && s.inputError]}
                                        value={values[key]}
                                        onChangeText={(t) => updateField(key, t)}
                                        placeholder="เช่น 150"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="number-pad"
                                        maxLength={5}
                                    />
                                    {renderHints(key)}
                                </View>
                            );
                        }

                        /* ── เลขบัตร 13 หลัก (ผู้ถือกรรมสิทธิ์ / ผู้ครอบครอง) ── */
                        if (key === 'rightsHolderId' || key === 'possessorId') {
                            return (
                                <View key={key} style={s.fieldWrap}>
                                    <Text style={s.fieldLabel}>{label} *</Text>
                                    <TextInput
                                        style={[s.input, hasErr && s.inputError]}
                                        value={values[key]}
                                        onChangeText={(t) => updateField(key, t)}
                                        placeholder={`${label}...`}
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="number-pad"
                                        maxLength={13}
                                    />
                                    {renderHints(key)}
                                </View>
                            );
                        }

                        /* ── ชื่อ (เจ้าของสิทธิ์ / ผู้ครอบครอง) ── */
                        if (key === 'rightsHolderName' || key === 'possessorName') {
                            return (
                                <View key={key} style={s.fieldWrap}>
                                    <Text style={s.fieldLabel}>{label} *</Text>
                                    <TextInput
                                        style={[s.input, hasErr && s.inputError]}
                                        value={values[key]}
                                        onChangeText={(t) => updateField(key, t)}
                                        placeholder={`${label}...`}
                                        placeholderTextColor="#94A3B8"
                                        maxLength={100}
                                    />
                                    {renderHints(key)}
                                </View>
                            );
                        }

                        /* ── fallback (ไม่ควรถึง) ── */
                        return (
                            <View key={key} style={s.fieldWrap}>
                                <Text style={s.fieldLabel}>{label} *</Text>
                                <TextInput
                                    style={[s.input, hasErr && s.inputError]}
                                    value={values[key]}
                                    onChangeText={(t) => updateField(key, t)}
                                    placeholder={`${label}...`}
                                    placeholderTextColor="#94A3B8"
                                />
                                {renderHints(key)}
                            </View>
                        );
                    })}

                    {/* ── disclaimer checkbox ── */}
                    <TouchableOpacity
                        style={s.checkRow}
                        onPress={() => setDisclaimerAgreed(!disclaimerAgreed)}
                        activeOpacity={0.7}
                    >
                        <View style={[s.checkbox, disclaimerAgreed && s.checkboxActive]}>
                            {disclaimerAgreed && (
                                <Ionicons name="checkmark" size={16} color="#FFF" />
                            )}
                        </View>
                        <Text style={s.disclaimerText}>{DISCLAIMER}</Text>
                    </TouchableOpacity>
                    {submitted && !disclaimerAgreed && (
                        <Text style={[s.errorHint, { marginTop: -8 }]}>
                            กรุณายืนยันความถูกต้องของข้อมูล
                        </Text>
                    )}
                </ScrollView>

                {/* ══════════════ PROVINCE MODAL ══════════════ */}
                <Modal visible={showProvinceModal} animationType="slide">
                    <SafeAreaView style={s.provinceModalFull}>
                        <View style={s.provinceHeader}>
                            <TouchableOpacity onPress={() => setShowProvinceModal(false)}>
                                <Text style={s.provinceHeaderCancel}>ปิด</Text>
                            </TouchableOpacity>
                            <Text style={s.provinceHeaderTitle}>เลือกจังหวัด</Text>
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
                                p.toLowerCase().includes(provinceSearch.trim().toLowerCase()),
                            )}
                            keyExtractor={(item) => item}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={s.provinceRow}
                                    onPress={() => {
                                        updateField('vehicleRegistrationProvince', item);
                                        setShowProvinceModal(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            s.provinceText,
                                            values.vehicleRegistrationProvince === item && {
                                                color: '#0E3A78',
                                                fontWeight: '700',
                                            },
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                    {values.vehicleRegistrationProvince === item && (
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

                {/* ══════════════ FUEL MODAL ══════════════ */}
                <Modal visible={showFuelModal} transparent animationType="fade">
                    <TouchableOpacity
                        style={s.fuelOverlay}
                        activeOpacity={1}
                        onPress={() => setShowFuelModal(false)}
                    >
                        <View
                            style={s.fuelSheet}
                            onStartShouldSetResponder={() => true}
                        >
                            <Text style={s.fuelSheetTitle}>เลือกเชื้อเพลิง</Text>
                            {FUEL_OPTIONS.map((fuel) => (
                                <TouchableOpacity
                                    key={fuel}
                                    style={s.fuelOption}
                                    onPress={() => {
                                        updateField('vehicleFuel', fuel);
                                        setShowFuelModal(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            s.fuelOptionText,
                                            values.vehicleFuel === fuel && {
                                                color: '#0E3A78',
                                                fontWeight: '700',
                                            },
                                        ]}
                                    >
                                        {fuel}
                                    </Text>
                                    {values.vehicleFuel === fuel && (
                                        <Ionicons name="checkmark" size={20} color="#0E3A78" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* ══════════════ FOOTER ══════════════ */}
                <View style={[s.footer, { paddingBottom: Math.max(24, insets.bottom + 12) }]}>
                    {!isFormValid && !submitted && (
                        <Text style={s.formHint}>
                            กรอกข้อมูลให้ครบถ้วนเพื่อดำเนินการต่อ
                        </Text>
                    )}
                    {submitted && errorCount > 0 && (
                        <Text style={s.errorSummary}>
                            กรุณาตรวจสอบข้อมูล {errorCount} รายการด้านบน
                        </Text>
                    )}
                    <TouchableOpacity
                        style={[
                            s.continueBtn,
                            (!isFormValid || loading) && s.continueBtnDisabled,
                        ]}
                        disabled={loading}
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
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

/* ───── styles ───── */

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
        height: 140,
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        backgroundColor: '#BFDBFE',
    },
    illustrationImage: { width: '100%', height: '100%' },
    titleUploadRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 16,
    },
    titleBlock: { flex: 1 },
    title: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
    subtitle: { fontSize: 16, color: '#64748B', marginBottom: 4 },
    intro: { fontSize: 14, color: '#334155' },
    uploadBox: {
        width: 120,
        height: 100,
        flexShrink: 0,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#CBD5E1',
        backgroundColor: '#F1F5F9',
        overflow: 'hidden',
    },
    uploadTouch: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadImage: { width: '100%', height: '100%' },
    uploadLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
    guidelineLink: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    guidelineLinkText: { fontSize: 14, color: '#0E3A78', marginRight: 4 },

    /* ── fields ── */
    fieldWrap: { marginBottom: 14 },
    fieldLabel: { fontSize: 14, color: '#334155', marginBottom: 6, fontWeight: '500' },
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
    inputError: { borderColor: '#EF4444' },
    errorHint: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '500',
        marginTop: 4,
        marginBottom: 2,
    },
    warningHint: {
        color: '#F59E0B',
        fontSize: 13,
        fontWeight: '500',
        marginTop: 4,
        marginBottom: 2,
    },

    /* ── dropdown (province / fuel) ── */
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    dropdownText: { fontSize: 16, color: '#0F172A' },
    dropdownPlaceholder: { color: '#94A3B8' },

    /* ── checkbox ── */
    checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8, marginBottom: 16 },
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
    disclaimerText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 20 },

    /* ── footer ── */
    footer: {
        paddingHorizontal: 20,
        paddingTop: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    formHint: {
        color: '#64748B',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 10,
    },
    errorSummary: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 10,
    },
    continueBtn: {
        backgroundColor: '#0E3A78',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    continueBtnDisabled: { backgroundColor: '#94A3B8', opacity: 0.8 },
    continueText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

    /* ── province modal ── */
    provinceModalFull: { flex: 1, backgroundColor: '#fff' },
    provinceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    provinceHeaderCancel: { fontSize: 16, color: '#64748B' },
    provinceHeaderTitle: { fontSize: 18, fontWeight: '600', color: '#0F172A' },
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
    provinceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    provinceText: { fontSize: 16, color: '#0F172A' },
    emptySearch: { textAlign: 'center', color: '#94A3B8', fontSize: 15, marginTop: 24 },

    /* ── fuel modal ── */
    fuelOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: 24,
    },
    fuelSheet: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 8,
        overflow: 'hidden',
    },
    fuelSheetTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0F172A',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    fuelOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    fuelOptionText: { fontSize: 16, color: '#0F172A' },
});
