import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    TextInput,
    Modal,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCoinShop } from '../../context/CoinShopContext';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { API, BASE_URL, NGROK_HEADERS } from '../../config';

export default function CoinEditAccountScreen() {
    const router = useRouter();
    const { shop, updateShop, refreshShop } = useCoinShop();
    const { user } = useAuth();

    const [uploading, setUploading] = useState(false);
    const [editField, setEditField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [editLabel, setEditLabel] = useState('');

    // Derive display data
    const profileImage = shop?.imageUrl
        ? shop.imageUrl.startsWith('http')
            ? shop.imageUrl
            : `${BASE_URL}${shop.imageUrl}`
        : null;
    const displayName = user?.displayName || '';
    const storeName = shop?.name || '';
    const phone = user?.phone || '';
    const email = user?.email || '';
    const address = user?.address || '';
    const reviewCount = shop?.reviewCount ?? 0;
    const rating = reviewCount === 0 ? 0 : (shop?.rating ?? 0);

    // ─── Profile Photo Upload ───
    const handleChangePhoto = () => {
        Alert.alert('Profile Photo', '', [
            {
                text: 'Take Photo',
                onPress: async () => {
                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== 'granted') {
                        alert('ต้องอนุญาตการเข้าถึงกล้อง');
                        return;
                    }
                    const result = await ImagePicker.launchCameraAsync({
                        quality: 0.7,
                        allowsEditing: true,
                        aspect: [1, 1],
                    });
                    if (!result.canceled && result.assets?.[0]) {
                        uploadProfileImage(result.assets[0].uri);
                    }
                },
            },
            {
                text: 'Choose from Library',
                onPress: async () => {
                    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (status !== 'granted') {
                        alert('ต้องอนุญาตการเข้าถึงรูปภาพ');
                        return;
                    }
                    const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ['images'],
                        quality: 0.7,
                        allowsEditing: true,
                        aspect: [1, 1],
                    });
                    if (!result.canceled && result.assets?.[0]) {
                        uploadProfileImage(result.assets[0].uri);
                    }
                },
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const uploadProfileImage = async (uri: string) => {
        if (!shop?._id) return;
        try {
            setUploading(true);
            const filename = uri.split('/').pop() || 'photo.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            const formData = new FormData();
            formData.append('image', { uri, name: filename, type } as any);

            const res = await fetch(`${API.SHOPS}/${shop._id}/upload-image`, {
                method: 'POST',
                headers: NGROK_HEADERS,
                body: formData,
            });
            const data = await res.json();
            if (data.imageUrl) {
                await refreshShop();
                Alert.alert('สำเร็จ', 'อัปเดตรูปเรียบร้อย');
            }
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('ผิดพลาด', 'อัปโหลดรูปไม่สำเร็จ');
        } finally {
            setUploading(false);
        }
    };

    // ─── Edit Field Modal ───
    const openEdit = (field: string, label: string, currentValue: string) => {
        setEditField(field);
        setEditLabel(label);
        setEditValue(currentValue);
    };

    const saveEdit = async () => {
        if (!editField) return;
        if (editField === 'storeName') {
            await updateShop({ name: editValue });
        }
        setEditField(null);
        Alert.alert('สำเร็จ', 'บันทึกเรียบร้อย');
    };

    // ─── Star rendering ───
    const renderStars = (r: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Ionicons
                    key={i}
                    name={i <= Math.round(r) ? 'star' : 'star-outline'}
                    size={20}
                    color="#f59e0b"
                />
            );
        }
        return stars;
    };

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Edit Account</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
                {/* Personal Information */}
                <View style={s.card}>
                    <Text style={s.cardTitle}>Personal Information</Text>

                    {/* Profile Photo */}
                    <TouchableOpacity style={s.photoRow} onPress={handleChangePhoto}>
                        <View>
                            <Text style={s.fieldLabel}>Profile Photo</Text>
                            <Text style={s.fieldHint}>Tap to change</Text>
                        </View>
                        <View style={s.avatarWrap}>
                            {uploading ? (
                                <ActivityIndicator size="small" color={Colors.primaryBlue} />
                            ) : profileImage ? (
                                <Image source={{ uri: profileImage }} style={s.avatar} />
                            ) : (
                                <View style={s.avatarPlaceholder}>
                                    <Ionicons name="person" size={36} color="#9ca3af" />
                                </View>
                            )}
                            <View style={s.cameraBadge}>
                                <Ionicons name="camera" size={14} color="#fff" />
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Name */}
                    <TouchableOpacity style={s.fieldRow} onPress={() => openEdit('displayName', 'Name', displayName)}>
                        <View style={s.fieldContent}>
                            <Text style={s.fieldLabel}>Name</Text>
                            <Text style={s.fieldValue}>{displayName || '-'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
                    </TouchableOpacity>

                    {/* Store Name */}
                    <TouchableOpacity style={s.fieldRow} onPress={() => openEdit('storeName', 'Store Name', storeName)}>
                        <View style={s.fieldContent}>
                            <Text style={s.fieldLabel}>Store Name</Text>
                            <Text style={s.fieldValue}>{storeName || '-'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
                    </TouchableOpacity>

                    {/* Mobile Number */}
                    <TouchableOpacity style={s.fieldRow} onPress={() => openEdit('phone', 'Mobile Number', phone)}>
                        <View style={s.fieldContent}>
                            <Text style={s.fieldLabel}>Mobile Number</Text>
                            <Text style={s.fieldValue}>{phone || '-'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
                    </TouchableOpacity>

                    {/* Email */}
                    <View style={s.fieldRow}>
                        <View style={s.fieldContent}>
                            <Text style={s.fieldLabel}>Email Address</Text>
                            <Text style={s.fieldValue}>{email || '-'}</Text>
                        </View>
                    </View>

                    {/* Address */}
                    <TouchableOpacity style={[s.fieldRow, { borderBottomWidth: 0 }]} onPress={() => openEdit('address', 'Address', address)}>
                        <View style={s.fieldContent}>
                            <Text style={s.fieldLabel}>Address</Text>
                            <Text style={s.fieldValue}>{address || '-'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
                    </TouchableOpacity>
                </View>

                {/* Store Rating */}
                <View style={s.card}>
                    <Text style={s.cardTitle}>Store Rating</Text>
                    <View style={s.ratingRow}>
                        <View style={s.ratingBadge}>
                            <Text style={s.ratingNumber}>{rating.toFixed(1)}</Text>
                            <Text style={s.ratingMax}>/ 5.0</Text>
                        </View>
                        <View style={s.ratingInfo}>
                            <View style={s.starsRow}>{renderStars(rating)}</View>
                            <Text style={s.reviewText}>จาก {reviewCount} รีวิว</Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Edit Modal */}
            <Modal visible={!!editField} transparent animationType="slide">
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <View style={s.modalOverlay}>
                        <View style={s.modalContent}>
                            <Text style={s.modalTitle}>{editLabel}</Text>
                            <TextInput
                                style={s.modalInput}
                                value={editValue}
                                onChangeText={setEditValue}
                                autoFocus
                                placeholder={`Enter ${editLabel}`}
                            />
                            <View style={s.modalButtons}>
                                <TouchableOpacity style={s.modalCancelBtn} onPress={() => setEditField(null)}>
                                    <Text style={s.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={s.modalSaveBtn} onPress={saveEdit}>
                                    <Text style={s.modalSaveText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f3f4f6' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
    scroll: { flex: 1 },
    scrollContent: { padding: 16 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: { fontSize: 17, fontWeight: '700', color: '#1f2937', marginBottom: 16 },
    photoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    avatarWrap: { position: 'relative' },
    avatar: { width: 60, height: 60, borderRadius: 30 },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.primaryBlue,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    fieldContent: { flex: 1 },
    fieldLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 2 },
    fieldHint: { fontSize: 11, color: '#9ca3af' },
    fieldValue: { fontSize: 15, color: '#1f2937', fontWeight: '500' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    ratingBadge: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#dc2626',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ratingNumber: { fontSize: 18, fontWeight: '800', color: '#fff' },
    ratingMax: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },
    ratingInfo: { flex: 1 },
    starsRow: { flexDirection: 'row', gap: 2, marginBottom: 4 },
    reviewText: { fontSize: 13, color: '#6b7280' },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 16 },
    modalInput: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1f2937',
        marginBottom: 20,
    },
    modalButtons: { flexDirection: 'row', gap: 12 },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
    },
    modalCancelText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
    modalSaveBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: Colors.primaryBlue,
        alignItems: 'center',
    },
    modalSaveText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
