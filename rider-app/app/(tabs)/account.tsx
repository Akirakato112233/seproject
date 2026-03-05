import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { API, NGROK_HEADERS } from '../../config';

interface RegistrationData {
    _id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phone: string;
    countryCode: string;
    selfieUri?: string;
    vehicleRegistrationNo?: string;
    vehicleBrand?: string;
    vehicleModel?: string;
    vehicleType?: string;
    nameEN?: string;
    emergencyContacts?: { _id: string; name: string; phone: string; countryCode: string }[];
}

export default function AccountScreen() {
    const router = useRouter();
    const { token, logout, user } = useAuth();
    const [data, setData] = useState<RegistrationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (!token) {
                setLoading(false);
                return;
            }
            setLoading(true);
            fetchRegistration();
        }, [token])
    );

    const fetchRegistration = async () => {
        try {
            setError(false);
            const headers: HeadersInit = { ...NGROK_HEADERS };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`${API.RIDERS}/registrations/latest`, { headers });
            const json = await res.json();
            if (json.success && json.data) {
                setData(json.data);
            } else {
                setData(null);
                setError(true);
            }
        } catch (err) {
            console.error('Failed to fetch registration:', err);
            setError(true);
            setData(null);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchRegistration();
    }, []);

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure? All account data will be permanently erased.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        if (!data?._id) return;
                        try {
                            const headers: HeadersInit = { ...NGROK_HEADERS };
                            if (token) headers['Authorization'] = `Bearer ${token}`;
                            const res = await fetch(`${API.RIDERS}/registrations/${data._id}`, {
                                method: 'DELETE',
                                headers,
                            });
                            const json = await res.json();
                            if (json.success) {
                                await logout();
                                router.replace('/create-account');
                            } else {
                                Alert.alert('Error', 'Failed to delete account.');
                            }
                        } catch {
                            Alert.alert('Error', 'Network error. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={s.loadingContainer}>
                <ActivityIndicator size="large" color="#0E3A78" />
            </SafeAreaView>
        );
    }

    if (error && !data) {
        return (
            <SafeAreaView style={s.loadingContainer}>
                <Ionicons name="cloud-offline-outline" size={48} color="#94A3B8" />
                <Text style={s.errorText}>Failed to load account data</Text>
                <TouchableOpacity style={s.retryBtn} onPress={fetchRegistration}>
                    <Text style={s.retryBtnText}>Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const displayName = data?.fullName || data?.nameEN || '—';
    const phoneDisplay = data ? `${data.countryCode} ${data.phone?.replace(/^0/, '')}` : '—';
    const plateNo = data?.vehicleRegistrationNo || '—';
    const vehicleLabel =
        data?.vehicleBrand && data?.vehicleModel
            ? `${data.vehicleBrand} ${data.vehicleModel}`
            : data?.vehicleType || '—';

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Edit Account</Text>
                <View style={s.headerRight} />
            </View>

            <ScrollView
                style={s.scroll}
                contentContainerStyle={s.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#0E3A78"
                    />
                }
            >
                {/* Personal Information card */}
                <View style={s.card}>
                    <Text style={s.sectionTitle}>Personal Information</Text>
                    <View style={s.profileRow}>
                        <View>
                            <Text style={s.label}>Profile Photo</Text>
                            <Text style={s.labelHint}>Selfie from registration</Text>
                        </View>
                        {data?.selfieUri ? (
                            <Image source={{ uri: data.selfieUri }} style={s.avatar} />
                        ) : (
                            <View style={[s.avatar, s.avatarPlaceholder]}>
                                <Ionicons name="person" size={28} color="#94A3B8" />
                            </View>
                        )}
                    </View>
                    <View style={s.divider} />
                    <View style={s.field}>
                        <Text style={s.fieldLabel}>Name</Text>
                        <Text style={s.fieldValue}>{displayName}</Text>
                    </View>
                    <View style={s.divider} />
                    <View style={s.field}>
                        <Text style={s.fieldLabel}>Mobile Number</Text>
                        <Text style={s.fieldValue}>{phoneDisplay}</Text>
                    </View>
                    <View style={s.divider} />
                    <View style={s.field}>
                        <Text style={s.fieldLabel}>Email Address</Text>
                        <Text style={s.fieldValue}>{user?.email || data?.email || '—'}</Text>
                    </View>
                    <View style={s.divider} />
                    <TouchableOpacity
                        style={s.fieldRow}
                        onPress={() => {
                            if (data?._id) {
                                router.push({
                                    pathname: '/emergency-contacts',
                                    params: { registrationId: data._id },
                                });
                            }
                        }}
                    >
                        <View style={s.fieldRowInner}>
                            <Text style={s.fieldLabel}>Emergency Contacts</Text>
                            <Text style={s.fieldValue}>
                                {data?.emergencyContacts?.length ?? 0} of 3 set up
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                {/* Vehicle Information card */}
                <View style={s.card}>
                    <Text style={s.sectionTitle}>Vehicle Information</Text>
                    <View style={s.vehicleBlock}>
                        <Text style={s.vehiclePlate}>{plateNo}</Text>
                        <Text style={s.vehicleModel}>{vehicleLabel}</Text>
                    </View>
                </View>

                {/* Manage Account card */}
                <View style={s.card}>
                    <Text style={s.sectionTitle}>Manage Your Account</Text>
                    <TouchableOpacity onPress={handleDeleteAccount} style={s.deleteRow}>
                        <Text style={s.deleteText}>Delete Account</Text>
                        <Text style={s.deleteHint}>All account data will be erased</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
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
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
    headerRight: { width: 40 },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 100 },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 16,
    },
    profileRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: { fontSize: 15, color: '#334155' },
    labelHint: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
    avatar: { width: 56, height: 56, borderRadius: 28 },
    avatarPlaceholder: {
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
    field: { paddingVertical: 4 },
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    fieldRowInner: { flex: 1 },
    fieldLabel: { fontSize: 13, color: '#94A3B8', marginBottom: 4 },
    fieldValue: { fontSize: 16, fontWeight: '500', color: '#0F172A' },

    vehicleBlock: { paddingVertical: 8 },
    vehiclePlate: { fontSize: 17, fontWeight: '600', color: '#0F172A' },
    vehicleModel: { fontSize: 14, color: '#64748B', marginTop: 4 },

    errorText: { fontSize: 16, color: '#64748B', marginTop: 12 },
    retryBtn: {
        marginTop: 16,
        backgroundColor: '#0E3A78',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
    },
    retryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

    deleteRow: { paddingVertical: 12 },
    deleteText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
    deleteHint: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
});
