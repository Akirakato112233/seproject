import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { API, NGROK_HEADERS } from '../../config';

const wDigitalImg = require('../../assets/images/Wdigita.png');

export default function RiderWalletScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [balance, setBalance] = useState('0.00');

    useFocusEffect(
        useCallback(() => {
            const fetchBalance = async () => {
                if (!token) return;
                try {
                    const res = await fetch(API.BALANCE, {
                        headers: { Authorization: `Bearer ${token}`, ...NGROK_HEADERS },
                    });
                    const data = await res.json();
                    setBalance(
                        (data.balance ?? 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })
                    );
                } catch (error) {
                    console.log('Error fetching wallet balance:', error);
                }
            };
            fetchBalance();
        }, [token])
    );

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Cash Wallet</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={s.content}>
                {/* Wallet Card */}
                <View style={s.walletCardContainer}>
                    <View style={s.walletCardBackground}>
                        <View style={s.decoLine} />
                        <View style={[s.decoLine, { marginTop: 4 }]} />

                        <View style={s.logoWrapper}>
                            <Image
                                source={wDigitalImg}
                                style={s.walletCardImage}
                                resizeMode="contain"
                            />
                        </View>

                        <Text style={s.walletLabel}>กระเป๋าเงิน WIT</Text>
                        <Text style={s.walletBalance}>฿{balance}</Text>
                    </View>
                </View>

                {/* Transfer to Account Button */}
                <TouchableOpacity
                    style={s.transferBtn}
                    onPress={() => router.push('/transfer-to-account')}
                    activeOpacity={0.8}
                >
                    <Text style={s.transferBtnText}>Transfer to Account</Text>
                </TouchableOpacity>

                {/* Transfer to WIT Button */}
                <TouchableOpacity
                    style={[s.transferBtn, { marginTop: 12 }]}
                    onPress={() => router.push('/transfer-to-wit')}
                    activeOpacity={0.8}
                >
                    <Text style={s.transferBtnText}>Transfer to WIT</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
    content: { flex: 1, padding: 20, paddingTop: 10 },
    walletCardContainer: {
        backgroundColor: '#EEF2F6',
        borderRadius: 8,
        paddingVertical: 30,
        alignItems: 'center',
        marginBottom: 20,
        overflow: 'hidden',
    },
    walletCardBackground: { width: '100%', alignItems: 'center' },
    decoLine: {
        width: '100%',
        height: 2,
        backgroundColor: '#DDE2E8',
        position: 'absolute',
        top: 50,
    },
    logoWrapper: {
        marginBottom: 10,
        alignItems: 'center',
        backgroundColor: '#EEF2F6',
        paddingHorizontal: 10,
        zIndex: 1,
    },
    walletCardImage: { width: 140, height: 90 },
    walletLabel: { fontSize: 14, color: '#333', marginBottom: 5 },
    walletBalance: { fontSize: 32, color: '#2ECC71' },
    transferBtn: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    transferBtnText: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
});
