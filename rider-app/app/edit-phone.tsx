import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { API, NGROK_HEADERS } from '../config';

const normalizePhone = (raw: string) => {
    const digits = (raw || '').replace(/\D/g, '').slice(0, 10);
    if (digits.length === 9 && digits[0] !== '0') return '0' + digits;
    return digits;
};

export default function EditPhoneScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const { registrationId, phone: initPhone, countryCode: initCountryCode } = useLocalSearchParams<{
        registrationId: string;
        phone: string;
        countryCode?: string;
    }>();

    const [phone, setPhone] = useState(() => normalizePhone(initPhone || ''));
    const [countryCode] = useState(initCountryCode || '+66');
    const [saving, setSaving] = useState(false);

    const hasUnsavedChanges = phone !== normalizePhone(initPhone || '');

    const handlePhoneChange = (text: string) => {
        const digits = text.replace(/\D/g, '');
        if (digits.length === 0) {
            setPhone('');
            return;
        }
        if (digits[0] !== '0') {
            setPhone('0' + digits.slice(0, 9));
        } else {
            setPhone(digits.slice(0, 10));
        }
    };

    const confirmDiscard = useCallback(() => {
        if (!hasUnsavedChanges) {
            router.back();
            return;
        }
        Alert.alert(
            'Discard changes?',
            'You have unsaved changes. Are you sure you want to go back?',
            [
                { text: 'Stay', style: 'cancel' },
                { text: 'Discard', style: 'destructive', onPress: () => router.back() },
            ]
        );
    }, [hasUnsavedChanges]);

    useFocusEffect(
        useCallback(() => {
            const sub = BackHandler.addEventListener('hardwareBackPress', () => {
                if (hasUnsavedChanges) {
                    confirmDiscard();
                    return true;
                }
                return false;
            });
            return () => sub.remove();
        }, [hasUnsavedChanges])
    );

    const handleSave = async () => {
        const digitsOnly = phone.replace(/\D/g, '');
        if (digitsOnly.length === 0) {
            Alert.alert('Missing phone', 'Please enter a mobile number.');
            return;
        }
        if (digitsOnly.length !== 10 || digitsOnly[0] !== '0') {
            Alert.alert(
                'Invalid phone',
                'Mobile number must be 10 digits and start with 0 (e.g. 08xxxxxxxx).'
            );
            return;
        }

        setSaving(true);
        try {
            const headers: HeadersInit = { 'Content-Type': 'application/json', ...NGROK_HEADERS };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API.RIDERS}/registrations/${registrationId}/phone`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ phone: digitsOnly, countryCode }),
            });
            const json = await res.json();
            if (json.success) {
                router.back();
            } else {
                Alert.alert('Error', json.message || 'Failed to update phone number.');
            }
        } catch {
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={confirmDiscard} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Edit Mobile Number</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={s.form}>
                    <Text style={s.label}>Mobile Number</Text>
                    <View style={s.phoneRow}>
                        <View style={s.countryCodeBox}>
                            <Text style={s.flagText}>🇹🇭</Text>
                            <Text style={s.countryCodeText}>{countryCode}</Text>
                        </View>
                        <TextInput
                            style={[s.input, { flex: 1 }]}
                            placeholder="0xxxxxxxxx"
                            placeholderTextColor="#94A3B8"
                            value={phone}
                            onChangeText={handlePhoneChange}
                            keyboardType="phone-pad"
                            maxLength={10}
                        />
                    </View>
                </View>

                <View style={s.bottomBar}>
                    <TouchableOpacity
                        style={[s.saveBtn, saving && { opacity: 0.6 }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <Text style={s.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 17, fontWeight: '600', color: '#0F172A' },
    form: { paddingHorizontal: 24, paddingTop: 28 },
    label: { fontSize: 15, fontWeight: '500', color: '#0F172A', marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#0F172A',
        marginBottom: 16,
    },
    phoneRow: { flexDirection: 'row', gap: 10 },
    countryCodeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 16,
    },
    flagText: { fontSize: 20 },
    countryCodeText: { fontSize: 16, fontWeight: '500', color: '#0F172A' },
    bottomBar: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingHorizontal: 24,
        paddingBottom: 36,
    },
    saveBtn: {
        backgroundColor: '#0E3A78',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    saveBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
