import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { API, NGROK_HEADERS } from '../config';

const trueIconImg = require('../assets/images/Trueicon.jpg');
const wDigitalImg = require('../assets/images/Wdigita.png');

export default function TransferToWitScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [link, setLink] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState({ amount: '0.00', sender: '' });

    const handleConfirm = async () => {
        Keyboard.dismiss();
        if (!link) return;

        setLoading(true);
        try {
            const response = await fetch(API.REDEEM, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    ...NGROK_HEADERS,
                },
                body: JSON.stringify({ link }),
            });
            const data = await response.json();

            if (data.success) {
                setResult({ amount: data.amount, sender: data.sender });
                setModalVisible(true);
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            alert('Cannot connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView
            style={s.container}
            edges={['top']}
            onStartShouldSetResponder={() => { Keyboard.dismiss(); return true; }}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
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
                    <View style={s.bannerWrapper}>
                        <View style={s.arrowBannerContainer}>
                            <View style={s.leftBlock}>
                                <Text style={s.bannerLabel}>From</Text>
                                <View style={s.iconCircleWhite}>
                                    <Image source={trueIconImg} style={s.circleImage} />
                                </View>
                                <Text style={s.bannerAccountName}>TrueMoney</Text>
                                <Text style={s.bannerAccountDetail}>Link</Text>
                                <View style={s.arrowHead} />
                            </View>

                            <View style={s.rightBlock}>
                                <Text style={s.bannerLabel}>To</Text>
                                <View style={s.iconCircleBlue}>
                                    <Image source={wDigitalImg} style={s.circleImage} />
                                </View>
                                <Text style={s.bannerAccountName}>กระเป๋าเงิน WIT</Text>
                                <Text style={s.bannerAccountDetail}>฿0</Text>
                            </View>
                        </View>
                    </View>

                    {/* Link Input */}
                    <View style={s.inputWrapper} onStartShouldSetResponder={() => true}>
                        <View style={s.inputContainer}>
                            <TextInput
                                style={s.input}
                                placeholder="วางลิงก์ซองของขวัญที่นี่"
                                placeholderTextColor="#AAA"
                                value={link}
                                onChangeText={setLink}
                                autoCapitalize="none"
                                returnKeyType="done"
                            />
                        </View>
                    </View>

                    {/* Confirm */}
                    <View style={s.bottomSection}>
                        <TouchableOpacity
                            style={[s.confirmButton, { opacity: loading ? 0.7 : 1 }]}
                            onPress={handleConfirm}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={s.confirmButtonText}>Confirm</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Success Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <Text style={s.modalTitle}>Payment successful</Text>
                        <View style={s.checkCircle}>
                            <Ionicons name="checkmark" size={50} color="#0047FF" />
                        </View>
                        <Text style={{ marginBottom: 10, color: '#666' }}>
                            Successfully topped up {result.amount}฿
                        </Text>
                        <TouchableOpacity
                            style={s.modalDoneButton}
                            onPress={() => {
                                setModalVisible(false);
                                router.back();
                            }}
                        >
                            <Text style={s.modalDoneText}>Done</Text>
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
        padding: 20,
        alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    bannerWrapper: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
    arrowBannerContainer: {
        flexDirection: 'row',
        width: '90%',
        height: 140,
        borderRadius: 10,
        overflow: 'hidden',
    },
    leftBlock: {
        flex: 1,
        backgroundColor: '#343A40',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        position: 'relative',
    },
    rightBlock: {
        flex: 1,
        backgroundColor: '#343A40',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        paddingLeft: 20,
    },
    arrowHead: {
        position: 'absolute',
        right: -30,
        width: 60,
        height: 60,
        backgroundColor: '#343A40',
        transform: [{ rotate: '45deg' }],
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderColor: '#fff',
        zIndex: 11,
    },
    bannerLabel: { color: '#fff', fontSize: 14, marginBottom: 8 },
    iconCircleWhite: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
        overflow: 'hidden',
    },
    iconCircleBlue: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#2E86DE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
        overflow: 'hidden',
    },
    circleImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    bannerAccountName: { color: '#ADB5BD', fontSize: 12, fontWeight: '600', marginTop: 5 },
    bannerAccountDetail: { color: '#fff', fontSize: 12, marginTop: 2 },
    inputWrapper: { alignItems: 'center' },
    inputContainer: { width: '90%' },
    input: {
        borderWidth: 1,
        borderColor: '#CED4DA',
        borderRadius: 5,
        padding: 15,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    bottomSection: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 20,
        marginBottom: 10,
        alignItems: 'center',
    },
    confirmButton: {
        backgroundColor: '#1E3799',
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        width: '90%',
    },
    confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: 300,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        elevation: 5,
    },
    modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 20 },
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
    modalDoneButton: {
        backgroundColor: '#1E3799',
        paddingVertical: 10,
        paddingHorizontal: 40,
        borderRadius: 20,
    },
    modalDoneText: { color: '#fff', fontWeight: '600' },
});
