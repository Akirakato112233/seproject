import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDelivery } from '../context/DeliveryContext';
import { useAuth } from '../context/AuthContext';
import { API, NGROK_HEADERS } from '../config';

interface RegData {
    _id: string;
    fullName: string;
    phone: string;
    countryCode: string;
    vehicleRegistrationNo?: string;
}

export default function SettingsScreen() {
    const router = useRouter();
    const { isOnline, autoAccept, toggleAutoAccept } = useDelivery();
    const { user, token, logout, isDevMode, setDevMode } = useAuth();
    const [reg, setReg] = useState<RegData | null>(null);

    useFocusEffect(
        useCallback(() => {
            if (!token) return;
            (async () => {
                try {
                    const headers: HeadersInit = { ...NGROK_HEADERS, Authorization: `Bearer ${token}` };
                    const res = await fetch(`${API.RIDERS}/registrations/latest`, { headers });
                    const json = await res.json();
                    if (json.success && json.data) setReg(json.data);
                } catch (_) {}
            })();
        }, [token])
    );

    const handleLogout = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log Out',
                style: 'destructive',
                onPress: async () => {
                    await logout();
                    router.replace('/create-account');
                },
            },
        ]);
    };

    const handleToggleAutoAccept = () => {
        if (!isOnline) {
            Alert.alert('Offline', 'You must be online to change Auto Accept settings.');
            return;
        }
        toggleAutoAccept();
    };

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>All Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={s.content}>
                {/* Account Section */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Account</Text>
                    <TouchableOpacity style={s.row} onPress={() => router.push('/(tabs)/account')}>
                        <View>
                            <Text style={s.rowTitle}>{reg?.fullName || '—'}</Text>
                            <Text style={s.rowSub}>
                                {reg?.vehicleRegistrationNo || '—'} • {reg?.countryCode || '+66'}{' '}
                                {reg?.phone?.replace(/^0/, '') || '—'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                <View style={s.divider} />

                {/* Communications */}
                <TouchableOpacity
                    style={s.row}
                    onPress={() => {
                        if (reg?._id) {
                            router.push({
                                pathname: '/communications',
                                params: {
                                    registrationId: reg._id,
                                    hasEmail: user?.email ? 'true' : 'false',
                                },
                            });
                        }
                    }}
                >
                    <Text style={s.rowTitle}>Communications</Text>
                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>

                <View style={s.divider} />

                {/* Linked accounts */}
                <TouchableOpacity
                    style={s.row}
                    onPress={() => {
                        if (reg?._id) {
                            router.push({
                                pathname: '/linked-accounts',
                                params: { registrationId: reg._id },
                            });
                        }
                    }}
                >
                    <View style={{ flex: 1, paddingRight: 16 }}>
                        <Text style={s.rowTitle}>Linked accounts</Text>
                        <Text style={s.rowSub}>
                            Use your third-party accounts to sign in to yours WIT Driver app.
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>

                <View style={s.divider} />

                {/* Developer – แสดงเฉพาะเมื่อเข้าแอปด้วย Dev Mode (Skip Login), ไม่แสดงถ้า regis ผ่าน Google */}
                {__DEV__ && isDevMode && (
                    <>
                        <View style={s.section}>
                            <Text style={s.sectionTitle}>Developer</Text>
                            <View style={s.card}>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.cardTitle}>Dev Mode</Text>
                                    <Text style={s.cardSub}>รับงานได้โดยไม่ต้อง login (สำหรับทดสอบ)</Text>
                                </View>
                                <Switch
                                    value={isDevMode}
                                    onValueChange={setDevMode}
                                    trackColor={{ false: '#E2E8F0', true: '#4ADE80' }}
                                    thumbColor={'#FFFFFF'}
                                />
                            </View>
                        </View>
                        <View style={s.divider} />
                    </>
                )}

                {/* Job Settings */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Job Settings</Text>
                    <View style={s.card}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.cardTitle}>Auto Accept</Text>
                            <Text style={s.cardSub}>Automatically accepts orders.</Text>
                        </View>
                        <Switch
                            value={autoAccept}
                            onValueChange={handleToggleAutoAccept}
                            trackColor={{ false: '#E2E8F0', true: '#4ADE80' }}
                            thumbColor={'#FFFFFF'}
                            disabled={!isOnline}
                            style={{ opacity: isOnline ? 1 : 0.5 }}
                        />
                    </View>
                    <TouchableOpacity
                        style={[
                            s.row,
                            { marginTop: 8 },
                            (autoAccept || !isOnline) && { opacity: 0.5 },
                        ]}
                        onPress={() => {
                            if (!isOnline) {
                                Alert.alert('Offline', 'You must be online to browse jobs.');
                                return;
                            }
                            if (autoAccept) {
                                Alert.alert(
                                    'ปิด Auto Accept',
                                    'กรุณาปิด Auto Accept ก่อนเพื่อใช้ Choose Job'
                                );
                                return;
                            }
                            router.push('/choose-job');
                        }}
                        disabled={!isOnline || autoAccept}
                    >
                        <View>
                            <Text style={s.rowTitle}>Choose Job</Text>
                            <Text style={s.rowSub}>
                                {autoAccept
                                    ? 'ปิด Auto Accept เพื่อใช้'
                                    : 'Browse and manually accept jobs by tier.'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                {/* App Settings */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>App Settings</Text>
                    <TouchableOpacity onPress={handleLogout}>
                        <Text style={s.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
    backBtn: { padding: 4 },
    content: { flex: 1 },
    section: { marginTop: 24, paddingHorizontal: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    rowTitle: { fontSize: 16, fontWeight: '500', color: '#0F172A' },
    rowSub: { fontSize: 14, color: '#64748B', marginTop: 4 },
    divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 8 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardTitle: { fontSize: 16, fontWeight: '500', color: '#0F172A' },
    cardSub: { fontSize: 14, color: '#64748B', marginTop: 4 },
    logoutText: { fontSize: 16, fontWeight: '500', color: '#EF4444', paddingVertical: 8 },
});
