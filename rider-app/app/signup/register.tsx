import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Modal,
    FlatList,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useSignup } from '../../context/SignupContext';
import { API } from '../../config';

const CITIES = [
    { label: 'ชลบุรี | Chon Buri', value: 'chonburi' },
    { label: 'กรุงเทพฯ | Bangkok', value: 'bangkok' },
    { label: 'เชียงใหม่ | Chiang Mai', value: 'chiangmai' },
    { label: 'ภูเก็ต | Phuket', value: 'phuket' },
    { label: 'ขอนแก่น | Khon Kaen', value: 'khonkaen' },
];

const COUNTRIES = [
    { label: '+66', flag: '🇹🇭', value: '+66' },
];

export default function RegisterScreen() {
    const router = useRouter();
    const { setDevMode } = useAuth();
    const { setField } = useSignup();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState<{ label: string; value: string } | null>(null);
    const [country, setCountry] = useState(COUNTRIES[0]);
    const [agreed, setAgreed] = useState(false);
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [showCityModal, setShowCityModal] = useState(false);

    const isPhoneValid = /^0\d{8,9}$/.test(phone);
    const phoneHasError = phone.length > 0 && phone[0] !== '0';
    const phoneLengthError = phone.length > 0 && phone[0] === '0' && phone.length < 9;

    const canContinue =
        firstName.trim().length > 0 &&
        lastName.trim().length > 0 &&
        isPhoneValid &&
        city !== null &&
        agreed;

    const handleContinue = () => {
        if (!firstName.trim() || !lastName.trim()) {
            Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกชื่อและนามสกุล');
            return;
        }
        if (!phone.trim()) {
            Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกหมายเลขโทรศัพท์');
            return;
        }
        if (!isPhoneValid) {
            Alert.alert('เบอร์ไม่ถูกต้อง', 'กรุณากรอกเบอร์โทรศัพท์ที่ขึ้นต้นด้วย 0 จำนวน 9-10 หลัก (เช่น 0812345678)');
            return;
        }
        if (!city) {
            Alert.alert('กรุณากรอกข้อมูล', 'กรุณาเลือกเมือง');
            return;
        }
        if (!agreed) {
            Alert.alert('กรุณายืนยัน', 'กรุณาติ๊กยอมรับเงื่อนไขก่อนดำเนินการต่อ');
            return;
        }
        // Save to SignupContext
        setField('firstName', firstName.trim());
        setField('lastName', lastName.trim());
        setField('phone', phone.trim());
        setField('countryCode', country.value);
        setField('city', city.value);
        router.push('/signup/service-preference' as any);
    };

    return (
        <SafeAreaView style={s.safe}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
                    {/* Header */}
                    <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={22} color="#111" />
                    </TouchableOpacity>

                    <Text style={s.title}>New driver{'\n'}registration</Text>
                    <Text style={s.subtitle}>Tell us about yourself.</Text>

                    {/* First Name */}
                    <TextInput
                        style={s.input}
                        placeholder="First name"
                        placeholderTextColor="#aaa"
                        value={firstName}
                        onChangeText={setFirstName}
                    />

                    {/* Last Name */}
                    <TextInput
                        style={s.input}
                        placeholder="Last name"
                        placeholderTextColor="#aaa"
                        value={lastName}
                        onChangeText={setLastName}
                    />

                    {/* Phone Row */}
                    <View style={s.phoneRow}>
                        <TouchableOpacity style={s.countryBtn} onPress={() => setShowCountryModal(true)}>
                            <Text style={s.flag}>🇹🇭</Text>
                            <Text style={s.countryCode}>{country.label}</Text>
                            <Ionicons name="chevron-down" size={16} color="#555" />
                        </TouchableOpacity>

                        <TextInput
                            style={[s.phoneInput, phoneHasError && s.inputError]}
                            placeholder="0XXXXXXXXX"
                            placeholderTextColor="#aaa"
                            keyboardType="phone-pad"
                            maxLength={10}
                            value={phone}
                            onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
                        />
                    </View>
                    {phoneHasError && (
                        <Text style={s.errorHint}>เบอร์โทรต้องขึ้นต้นด้วย 0</Text>
                    )}
                    {phoneLengthError && (
                        <Text style={s.warningHint}>กรอกให้ครบ 9-10 หลัก ({phone.length}/10)</Text>
                    )}

                    {/* City Picker */}
                    <TouchableOpacity style={s.pickerBtn} onPress={() => setShowCityModal(true)}>
                        <Text style={[s.pickerText, !city && { color: '#aaa' }]}>
                            {city ? city.label : 'City'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="#555" />
                    </TouchableOpacity>

                    {/* Terms Checkbox */}
                    <View style={s.checkRow}>
                        <TouchableOpacity
                            style={[s.checkbox, agreed && s.checkboxChecked]}
                            onPress={() => setAgreed(!agreed)}
                            activeOpacity={0.8}
                        >
                            {agreed && <Ionicons name="checkmark" size={16} color="#fff" />}
                        </TouchableOpacity>
                        <Text style={s.checkText}>
                            By proceeding, I agree that Wit can collect, use and disclose the information provided by me in accordance with the{' '}
                            <Text style={s.link}>Privacy Notice</Text>
                            {' '}and I fully comply with the{' '}
                            <Text style={s.link}>Terms & Conditions</Text>
                            {' '}which I have read and understand.
                        </Text>
                    </View>
                </ScrollView>

                {/* Continue Button */}
                <View style={s.footer}>
                    <TouchableOpacity
                        style={[s.continueBtn, !canContinue && s.continueBtnDisabled]}
                        onPress={handleContinue}
                        activeOpacity={canContinue ? 0.85 : 1}
                    >
                        <Text style={s.continueBtnText}>Continue</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Country Modal */}
            <Modal visible={showCountryModal} transparent animationType="slide">
                <TouchableOpacity style={s.modalOverlay} onPress={() => setShowCountryModal(false)} />
                <View style={s.modalSheet}>
                    <Text style={s.modalTitle}>Select country</Text>
                    {COUNTRIES.map((c) => (
                        <TouchableOpacity
                            key={c.value}
                            style={s.modalItem}
                            onPress={() => { setCountry(c); setShowCountryModal(false); }}
                        >
                            <Text style={s.modalFlag}>{c.flag}</Text>
                            <Text style={[s.modalItemText, { color: '#0E3A78' }]}>{c.label}</Text>
                            {country.value === c.value && (
                                <Ionicons name="checkmark" size={20} color="#0E3A78" style={{ marginLeft: 'auto' }} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </Modal>

            {/* City Modal */}
            <Modal visible={showCityModal} transparent animationType="slide">
                <TouchableOpacity style={s.modalOverlay} onPress={() => setShowCityModal(false)} />
                <View style={s.modalSheet}>
                    <Text style={s.modalTitle}>Select city</Text>
                    <FlatList
                        data={CITIES}
                        keyExtractor={(item) => item.value}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={s.modalItem}
                                onPress={() => { setCity(item); setShowCityModal(false); }}
                            >
                                <Text style={[s.modalItemText, { color: '#0E3A78' }]}>{item.label}</Text>
                                {city?.value === item.value && (
                                    <Ionicons name="checkmark" size={20} color="#0E3A78" style={{ marginLeft: 'auto' }} />
                                )}
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 24, paddingBottom: 20 },

    backBtn: {
        marginTop: 8,
        marginBottom: 24,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },

    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#0F172A',
        lineHeight: 36,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 28,
    },

    input: {
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        height: 52,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#0F172A',
        marginBottom: 14,
    },

    phoneRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 14,
    },
    countryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 52,
    },
    flag: { fontSize: 20 },
    countryCode: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
    phoneInput: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#0F172A',
        height: 52,
    },
    inputError: {
        borderColor: '#EF4444',
    },
    errorHint: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '500',
        marginTop: -8,
        marginBottom: 14,
    },
    warningHint: {
        color: '#F59E0B',
        fontSize: 13,
        fontWeight: '500',
        marginTop: -8,
        marginBottom: 14,
    },

    pickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        height: 52,
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    pickerText: { fontSize: 15, color: '#0F172A' },

    checkRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
        flexShrink: 0,
    },
    checkboxChecked: {
        backgroundColor: '#0E3A78',
        borderColor: '#0E3A78',
    },
    checkText: {
        flex: 1,
        fontSize: 13,
        color: '#475569',
        lineHeight: 20,
    },
    link: {
        color: '#0E3A78',
        fontWeight: '600',
    },

    footer: {
        paddingHorizontal: 24,
        paddingBottom: 32,
        paddingTop: 12,
        backgroundColor: '#fff',
    },
    continueBtn: {
        height: 54,
        borderRadius: 27,
        backgroundColor: '#0E3A78',
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueBtnDisabled: {
        backgroundColor: '#94A3B8',
    },
    continueBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: 180,
        maxHeight: '60%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 20,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        gap: 12,
    },
    modalFlag: { fontSize: 24 },
    modalItemText: { fontSize: 16, fontWeight: '600' },
});
