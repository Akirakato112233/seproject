import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
    ActionSheetIOS,
    Platform,
    ActivityIndicator,
    Modal,
    TextInput,
    KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { API, BASE_URL } from '../../config';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfilePhoto } from '../../lib/uploadProfilePhoto';

// -----------------------------------------------------------------------------
// Account screen: profile photo, editable name & mobile number, logout/delete
// -----------------------------------------------------------------------------

export default function AccountScreen() {
    const router = useRouter();
    const { user, logout, updateUser } = useAuth();
    // Profile photo state (loaded from API, uploaded to Supabase + URL saved to backend)
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Edit modal: which field is being edited and current input value
    const [editField, setEditField] = useState<'name' | 'phone' | null>(null);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);

    const displayName = user?.displayName || '—';
    const phone = user?.phone || 'Not set';
    const email = user?.email || 'Not set';
    const userId = user?._id || user?.id;

    // Load profile photo URL from backend when screen is focused
    const loadProfilePhoto = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await fetch(`${BASE_URL}/api/auth/user/${userId}`, {
                headers: { 'ngrok-skip-browser-warning': '1' },
            });
            const json = await res.json();
            if (json.success && json.user?.profilePhoto) {
                setPhotoUrl(json.user.profilePhoto);
            }
        } catch {
            // silently ignore
        }
    }, [userId]);

    useFocusEffect(
        useCallback(() => {
            loadProfilePhoto();
        }, [loadProfilePhoto])
    );

    const savePhotoUrlToDb = async (url: string) => {
        if (!userId) return;
        try {
            await fetch(`${BASE_URL}/api/auth/update-photo/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': '1',
                },
                body: JSON.stringify({ profilePhoto: url }),
            });
        } catch {
            // silently ignore
        }
    };

    const handleUpload = async (uri: string) => {
        if (!userId) return;
        setUploading(true);
        try {
            const publicUrl = await uploadProfilePhoto(userId, uri);
            setPhotoUrl(publicUrl);
            await savePhotoUrlToDb(publicUrl);
        } catch (err: any) {
            console.log('Upload error:', err);
            Alert.alert('Error', 'Failed to upload photo. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    // ---------- Profile photo: gallery ----------
    const pickFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });
        if (!result.canceled && result.assets[0]) {
            await handleUpload(result.assets[0].uri);
        }
    };

    // ---------- Profile photo: camera ----------
    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your camera.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });
        if (!result.canceled && result.assets[0]) {
            await handleUpload(result.assets[0].uri);
        }
    };

    // ---------- Profile photo: action sheet / alert ----------
    const handleChangePhoto = () => {
        if (uploading) return;
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancel', 'Take Photo', 'Choose from Library'],
                    cancelButtonIndex: 0,
                },
                (idx) => {
                    if (idx === 1) takePhoto();
                    else if (idx === 2) pickFromGallery();
                }
            );
        } else {
            Alert.alert('Profile Photo', 'Choose an option', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Take Photo', onPress: takePhoto },
                { text: 'Choose from Library', onPress: pickFromGallery },
            ]);
        }
    };

    const openEditName = () => {
        setEditValue(user?.displayName || '');
        setEditField('name');
    };

    const openEditPhone = () => {
        let raw = (user?.phone || '').replace(/\D/g, '').slice(0, 10);
        if (raw.length === 9 && raw[0] !== '0') raw = '0' + raw;
        setEditValue(raw);
        setEditField('phone');
    };

    // Restrict phone input: digits only, must start with 0, max 10 digits
    const handlePhoneChange = (text: string) => {
        const digits = text.replace(/\D/g, '');
        // If first digit is not 0, auto-prepend 0 and allow up to 9 more digits
        if (digits.length === 0) {
            setEditValue('');
            return;
        }
        if (digits[0] !== '0') {
            setEditValue('0' + digits.slice(0, 9));
        } else {
            setEditValue(digits.slice(0, 10));
        }
    };

    const handleSaveField = async () => {
        if (!userId || !editField) return;
        const trimmed = editValue.trim();
        if (!trimmed) {
            Alert.alert(
                'Error',
                editField === 'name' ? 'Name cannot be empty.' : 'Phone number cannot be empty.'
            );
            return;
        }
        if (editField === 'phone') {
            const digitsOnly = trimmed.replace(/\D/g, '');
            if (digitsOnly.length !== 10 || digitsOnly[0] !== '0') {
                Alert.alert('Invalid Number', 'Mobile number must be 10 digits and start with 0.');
                return;
            }
        }
        setSaving(true);
        try {
            const body: any = {};
            if (editField === 'name') body.displayName = trimmed;
            else body.phone = trimmed.replace(/\D/g, '').slice(0, 10);

            const res = await fetch(`${BASE_URL}/api/auth/update-profile/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': '1',
                },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (json.success) {
                if (editField === 'name') await updateUser({ displayName: trimmed });
                else await updateUser({ phone: trimmed });
                setEditField(null);
            } else {
                Alert.alert('Error', json.message || 'Failed to update.');
            }
        } catch {
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

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
                        if (userId) {
                            try {
                                const res = await fetch(
                                    `${API.SIGNUP.replace('/signup', '')}/user/${userId}`,
                                    {
                                        method: 'DELETE',
                                        headers: { 'ngrok-skip-browser-warning': '1' },
                                    }
                                );
                                const json = await res.json();
                                if (!json.success) {
                                    Alert.alert('Error', 'Failed to delete account.');
                                    return;
                                }
                            } catch {
                                Alert.alert('Error', 'Network error. Please try again.');
                                return;
                            }
                        }
                        await logout();
                        router.replace('/create-account');
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <View style={s.header}>
                <Text style={s.headerTitle}>Edit Account</Text>
            </View>

            <ScrollView contentContainerStyle={s.scrollContent}>
                {/* Profile Card */}
                <View style={s.card}>
                    <Text style={s.sectionTitle}>Personal Information</Text>

                    <TouchableOpacity
                        style={s.profileRow}
                        onPress={handleChangePhoto}
                        activeOpacity={0.7}
                    >
                        <View>
                            <Text style={s.profileLabel}>Profile Photo</Text>
                            <Text style={s.profileHint}>Tap to change</Text>
                        </View>
                        <View style={s.avatarWrap}>
                            {uploading ? (
                                <View style={s.avatarPlaceholder}>
                                    <ActivityIndicator size="small" color="#0E3A78" />
                                </View>
                            ) : photoUrl ? (
                                <Image source={{ uri: photoUrl }} style={s.avatarImg} />
                            ) : (
                                <View style={s.avatarPlaceholder}>
                                    <Ionicons name="person" size={28} color="#94A3B8" />
                                </View>
                            )}
                            <View style={s.cameraBadge}>
                                <Ionicons name="camera" size={14} color="#fff" />
                            </View>
                        </View>
                    </TouchableOpacity>

                    <View style={s.divider} />

                    <TouchableOpacity style={s.field} onPress={openEditName} activeOpacity={0.6}>
                        <View style={s.fieldRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.fieldLabel}>Name</Text>
                                <Text style={s.fieldValue}>{displayName}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                        </View>
                    </TouchableOpacity>

                    <View style={s.divider} />

                    <TouchableOpacity style={s.field} onPress={openEditPhone} activeOpacity={0.6}>
                        <View style={s.fieldRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.fieldLabel}>Mobile Number</Text>
                                <Text style={s.fieldValue}>{phone}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                        </View>
                    </TouchableOpacity>

                    <View style={s.divider} />

                    <View style={s.field}>
                        <Text style={s.fieldLabel}>Email Address</Text>
                        <Text style={s.fieldValue}>{email}</Text>
                    </View>
                </View>

                {/* Manage Account Card */}
                <View style={s.card}>
                    <Text style={s.sectionTitle}>Manage Your Account</Text>

                    <TouchableOpacity onPress={handleDeleteAccount} style={s.deleteRow}>
                        <View>
                            <Text style={s.deleteText}>Delete Account</Text>
                            <Text style={s.deleteHint}>All account data will be erased</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Log Out */}
                <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
                    <Ionicons name="log-out-outline" size={22} color="#0F172A" />
                    <Text style={s.logoutText}>Log out</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Edit Modal */}
            <Modal visible={editField !== null} transparent animationType="fade">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={s.modalOverlay}
                >
                    <View style={s.modalCard}>
                        <Text style={s.modalTitle}>
                            {editField === 'name' ? 'Edit Name' : 'Edit Mobile Number'}
                        </Text>
                        <TextInput
                            style={s.modalInput}
                            value={editValue}
                            onChangeText={editField === 'phone' ? handlePhoneChange : setEditValue}
                            placeholder={editField === 'name' ? 'Enter your name' : '0xxxxxxxxx'}
                            keyboardType={editField === 'phone' ? 'phone-pad' : 'default'}
                            autoFocus
                            maxLength={editField === 'phone' ? 10 : 60}
                        />
                        <View style={s.modalButtons}>
                            <TouchableOpacity
                                style={s.modalCancelBtn}
                                onPress={() => setEditField(null)}
                                disabled={saving}
                            >
                                <Text style={s.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.modalSaveBtn, saving && { opacity: 0.6 }]}
                                onPress={handleSaveField}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={s.modalSaveText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F8FAFC' },

    header: {
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },

    scrollContent: { padding: 16, paddingBottom: 40 },

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
        paddingVertical: 8,
    },
    profileLabel: { fontSize: 15, color: '#334155' },
    profileHint: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

    avatarWrap: { position: 'relative' },
    avatarImg: { width: 56, height: 56, borderRadius: 28 },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#0E3A78',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },

    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 4,
    },

    field: { paddingVertical: 14 },
    fieldRow: { flexDirection: 'row', alignItems: 'center' },
    fieldLabel: { fontSize: 13, color: '#94A3B8', marginBottom: 4 },
    fieldValue: { fontSize: 16, fontWeight: '500', color: '#0F172A' },

    deleteRow: { paddingVertical: 8 },
    deleteText: { fontSize: 16, fontWeight: '500', color: '#EF4444' },
    deleteHint: { fontSize: 13, color: '#94A3B8', marginTop: 3 },

    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    logoutText: { fontSize: 16, fontWeight: '600', color: '#0F172A' },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 16,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#0F172A',
        backgroundColor: '#F8FAFC',
    },
    modalButtons: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 12,
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    modalCancelText: { fontSize: 16, fontWeight: '600', color: '#64748B' },
    modalSaveBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#0E3A78',
        alignItems: 'center',
    },
    modalSaveText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
