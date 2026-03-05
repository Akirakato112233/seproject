import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { API, NGROK_HEADERS } from '../config';

export default function CommunicationsScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const { registrationId, hasEmail } = useLocalSearchParams<{
        registrationId: string;
        hasEmail?: string;
    }>();

    const emailAvailable = hasEmail === 'true';
    const [emailOn, setEmailOn] = useState(false);
    const [callOn, setCallOn] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (!registrationId || !token) return;
            (async () => {
                try {
                    const headers: HeadersInit = { ...NGROK_HEADERS, Authorization: `Bearer ${token}` };
                    const res = await fetch(`${API.RIDERS}/registrations/latest`, { headers });
                    const json = await res.json();
                    if (json.success && json.data) {
                        setEmailOn(!!json.data.marketingEmail);
                        setCallOn(!!json.data.marketingPhone);
                    }
                } catch (_) {}
            })();
        }, [registrationId, token])
    );

    const update = async (field: 'marketingEmail' | 'marketingPhone', value: boolean) => {
        try {
            await fetch(`${API.RIDERS}/registrations/${registrationId}/communications`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
                body: JSON.stringify({ [field]: value }),
            });
        } catch (_) {
            Alert.alert('Error', 'Failed to update. Please try again.');
        }
    };

    const handleEmailToggle = (val: boolean) => {
        if (!emailAvailable) {
            Alert.alert('No email', 'Please add an email address in Edit Account first.');
            return;
        }
        setEmailOn(val);
        update('marketingEmail', val);
    };

    const handleCallToggle = (val: boolean) => {
        setCallOn(val);
        update('marketingPhone', val);
    };

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Communications</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Offers from WIT */}
            <View style={s.section}>
                <Text style={s.sectionTitle}>Offers from WIT</Text>
                <Text style={s.sectionDesc}>
                    I would like to be contacted for customised products or services (based on my
                    profile from time to time) and be engaged for marketing purposes via:
                </Text>
            </View>

            {/* Email */}
            <View style={s.row}>
                <Text style={[s.rowLabel, !emailAvailable && { color: '#94A3B8' }]}>Email</Text>
                <Switch
                    value={emailAvailable ? emailOn : false}
                    onValueChange={handleEmailToggle}
                    trackColor={{ false: '#E2E8F0', true: '#4ADE80' }}
                    thumbColor="#FFFFFF"
                    disabled={!emailAvailable}
                    style={{ opacity: emailAvailable ? 1 : 0.5 }}
                />
            </View>

            <View style={s.divider} />

            {/* Call */}
            <View style={s.row}>
                <Text style={s.rowLabel}>Call</Text>
                <Switch
                    value={callOn}
                    onValueChange={handleCallToggle}
                    trackColor={{ false: '#E2E8F0', true: '#4ADE80' }}
                    thumbColor="#FFFFFF"
                />
            </View>

            <View style={s.divider} />
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
    section: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
    sectionDesc: { fontSize: 14, color: '#64748B', lineHeight: 20 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    rowLabel: { fontSize: 16, fontWeight: '500', color: '#0F172A' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 20 },
});
