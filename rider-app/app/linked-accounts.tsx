import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { API } from '../config';

function GoogleIcon({ dimmed }: { dimmed?: boolean }) {
    return (
        <View style={s.googleIcon}>
            <Text style={{ fontSize: 20, fontWeight: '700', opacity: dimmed ? 0.4 : 1 }}>
                <Text style={{ color: '#4285F4' }}>G</Text>
            </Text>
        </View>
    );
}

export default function LinkedAccountsScreen() {
    const router = useRouter();
    const { registrationId } = useLocalSearchParams<{
        registrationId: string;
    }>();
    const { user } = useAuth();

    const isLoggedInWithGoogle = !!user?.email;

    const [googleLinked, setGoogleLinked] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (!registrationId) return;
            (async () => {
                try {
                    const res = await fetch(`${API.RIDERS}/registrations/latest`);
                    const json = await res.json();
                    if (json.success && json.data) {
                        const fromApi = json.data.linkedGoogle;
                        const showLinked = fromApi ?? isLoggedInWithGoogle;
                        setGoogleLinked(showLinked);
                        if (isLoggedInWithGoogle && fromApi !== true) {
                            fetch(`${API.RIDERS}/registrations/${registrationId}/linked-accounts`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ linkedGoogle: true }),
                            }).catch(() => {});
                        }
                    }
                } catch (_) {}
            })();
        }, [registrationId, isLoggedInWithGoogle])
    );

    const handleToggle = async (val: boolean) => {
        if (!isLoggedInWithGoogle) {
            Alert.alert('Not linked', 'Sign in with Google first to link your account.');
            return;
        }
        setGoogleLinked(val);
        try {
            await fetch(`${API.RIDERS}/registrations/${registrationId}/linked-accounts`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ linkedGoogle: val }),
            });
        } catch (_) {}
    };

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Linked accounts</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Section title */}
            <View style={s.section}>
                <Text style={s.sectionTitle}>Linked accounts</Text>
            </View>

            {/* Google row */}
            <View style={s.row}>
                <View style={s.rowLeft}>
                    <GoogleIcon dimmed={!isLoggedInWithGoogle} />
                    <Text style={[s.rowLabel, !isLoggedInWithGoogle && { color: '#94A3B8' }]}>
                        Google
                    </Text>
                </View>
                <Switch
                    value={isLoggedInWithGoogle ? googleLinked : false}
                    onValueChange={handleToggle}
                    trackColor={{ false: '#E2E8F0', true: '#4ADE80' }}
                    thumbColor="#FFFFFF"
                    disabled={!isLoggedInWithGoogle}
                    style={{ opacity: isLoggedInWithGoogle ? 1 : 0.5 }}
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
    section: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    googleIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowLabel: { fontSize: 16, fontWeight: '500', color: '#0F172A' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 20 },
});
