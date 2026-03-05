import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { API, NGROK_HEADERS } from '../config';

export default function TransferToAccountScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);

    const handleConfirm = async () => {
        Keyboard.dismiss();
        const num = parseFloat(amount);
        if (!amount || isNaN(num) || num <= 0) return;

        if (num < 100) {
            setError('จำนวนเงินขั้นต่ำในการถอนคือ ฿100');
            return;
        }

        setError('');
        setLoading(true);
        try {
            const res = await fetch(API.WITHDRAW, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    ...NGROK_HEADERS,
                },
                body: JSON.stringify({ amount: num }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccessVisible(true);
            } else {
                setError(data.message || 'ยอดเงินของคุณไม่เพียงพอ');
            }
        } catch (e) {
            setError('Cannot connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleDone = () => {
        setSuccessVisible(false);
        router.back();
    };

    return (
        <SafeAreaView
            style={s.container}
            edges={['top']}
            onStartShouldSetResponder={() => { Keyboard.dismiss(); return true; }}
        >
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={s.header}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#0F172A" />
                        </TouchableOpacity>
                        <Text style={s.headerTitle}>Transfer</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {/* Banner */}
                    <View style={s.bannerWrap}>
                        <View style={s.bannerContainer}>
                            <View style={s.bannerLeft}>
                                <Text style={s.bannerLabel}>From</Text>
                                <View style={s.bannerIconBlue}>
                                    <Ionicons name="wallet" size={24} color="#fff" />
                                </View>
                                <Text style={s.bannerName}>กระเป๋าเงิน WIT</Text>
                                <View style={s.arrowHead} />
                            </View>
                            <View style={s.bannerRight}>
                                <Text style={s.bannerLabel}>To</Text>
                                <View style={s.bannerIconRed}>
                                    <Ionicons name="business" size={24} color="#fff" />
                                </View>
                                <Text style={s.bannerName}>Bank Account</Text>
                                <Text style={s.bannerDetail}>*****9844</Text>
                            </View>
                        </View>
                    </View>

                    {/* Amount Input */}
                    <View style={s.inputWrap}>
                        <View style={s.inputContainer}>
                            <TextInput
                                style={[s.input, error ? s.inputError : null]}
                                placeholder="Enter an amount (฿)"
                                placeholderTextColor="#aaa"
                                value={amount}
                                onChangeText={(t) => { setAmount(t); setError(''); }}
                                keyboardType="number-pad"
                                returnKeyType="done"
                            />
                            {error ? <Text style={s.errorText}>{error}</Text> : null}
                            <Text style={s.minNote}>ขั้นต่ำ ฿100</Text>
                        </View>
                    </View>

                    {/* Confirm */}
                    <View style={s.bottomSection}>
                        <TouchableOpacity
                            style={[s.confirmBtn, (!amount || parseFloat(amount) <= 0 || loading) && s.confirmBtnDisabled]}
                            onPress={handleConfirm}
                            activeOpacity={0.8}
                            disabled={!amount || parseFloat(amount) <= 0 || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={s.confirmBtnText}>Confirm</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Success Modal */}
            <Modal animationType="fade" transparent visible={successVisible} onRequestClose={handleDone}>
                <View style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <Text style={s.modalTitle}>Payment successful</Text>
                        <View style={s.checkCircle}>
                            <Ionicons name="checkmark" size={50} color="#0047FF" />
                        </View>
                        <Text style={s.modalSub}>Successfully transferred {amount}฿</Text>
                        <TouchableOpacity style={s.doneBtn} onPress={handleDone} activeOpacity={0.8}>
                            <Text style={s.doneBtnText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
    bannerWrap: { alignItems: 'center', marginTop: 10, marginBottom: 24 },
    bannerContainer: {
        flexDirection: 'row',
        width: '90%',
        height: 150,
        borderRadius: 12,
        overflow: 'hidden',
    },
    bannerLeft: {
        flex: 1,
        backgroundColor: '#1e293b',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 10,
    },
    bannerRight: {
        flex: 1,
        backgroundColor: '#1e293b',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 20,
        zIndex: 1,
    },
    arrowHead: {
        position: 'absolute',
        right: -30,
        width: 60,
        height: 60,
        backgroundColor: '#1e293b',
        transform: [{ rotate: '45deg' }],
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderColor: '#fff',
        zIndex: 11,
    },
    bannerLabel: { color: '#fff', fontSize: 14, marginBottom: 8 },
    bannerIconBlue: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    bannerIconRed: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#dc2626',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    bannerName: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginTop: 4 },
    bannerDetail: { color: '#fff', fontSize: 12, marginTop: 2 },
    inputWrap: { alignItems: 'center' },
    inputContainer: { width: '90%' },
    input: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 15,
        fontSize: 16,
        color: '#0F172A',
        backgroundColor: '#fff',
    },
    inputError: { borderColor: '#dc2626' },
    errorText: { fontSize: 13, color: '#dc2626', marginTop: 8, fontWeight: '600' },
    minNote: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
    bottomSection: { flex: 1, justifyContent: 'flex-end', padding: 20, marginBottom: 10, alignItems: 'center' },
    confirmBtn: {
        backgroundColor: '#1e3a8a',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        width: '90%',
    },
    confirmBtnDisabled: { opacity: 0.5 },
    confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: {
        width: 300,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        elevation: 5,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20, color: '#0F172A' },
    checkCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: '#0047FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalSub: { fontSize: 14, color: '#64748B', marginBottom: 20 },
    doneBtn: { backgroundColor: '#1e3a8a', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 20 },
    doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
