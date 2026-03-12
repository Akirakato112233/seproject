import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Alert,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { API, NGROK_HEADERS } from '../config';
import { uploadFileFromUri } from '../services/uploadBackgroundDoc';

let FaceDetector: any = null;
try {
    FaceDetector = require('expo-face-detector');
} catch (_) {}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const OVAL_W = SCREEN_W * 0.72;
const OVAL_H = OVAL_W * 1.25;

type ScanState = 'ready' | 'capturing' | 'verifying';

export default function UpdateProfilePhotoScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const { registrationId } = useLocalSearchParams<{ registrationId: string }>();
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [scanState, setScanState] = useState<ScanState>('ready');
    const [capturedUri, setCapturedUri] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            setScanState('ready');
            setCapturedUri(null);
        }, [])
    );

    if (!permission) return <View style={s.fill} />;

    if (!permission.granted) {
        return (
            <SafeAreaView style={s.permScreen}>
                <Ionicons name="camera-outline" size={64} color="#1E3A8A" />
                <Text style={s.permTitle}>Camera Access Needed</Text>
                <Text style={s.permSub}>
                    We need camera access to take your new profile photo.
                </Text>
                <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
                    <Text style={s.permBtnText}>Allow Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.backLink} onPress={() => router.back()}>
                    <Text style={s.backLinkText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // แสดงรูปที่ถ่ายแล้ว พร้อม Retake / Use
    if (capturedUri) {
        return (
            <SafeAreaView style={s.safe} edges={['top']}>
                <View style={s.previewContainer}>
                    <Image source={{ uri: capturedUri }} style={s.previewImage} />
                    <View style={s.previewActions}>
                        <TouchableOpacity
                            style={s.retakeBtn}
                            onPress={() => setCapturedUri(null)}
                            disabled={uploading}
                        >
                            <Text style={s.retakeBtnText}>Retake</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.useBtn, uploading && s.useBtnDisabled]}
                            onPress={handleUsePhoto}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={s.useBtnText}>Use this photo</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    const handleTakePhoto = async () => {
        if (scanState !== 'ready' || !cameraRef.current) return;
        setScanState('capturing');
        try {
            const photo = await cameraRef.current.takePictureAsync({ base64: false });
            if (!photo?.uri) {
                Alert.alert('Error', 'Failed to capture photo.');
                setScanState('ready');
                return;
            }

            if (FaceDetector) {
                setScanState('verifying');
                try {
                    const { faces } = await FaceDetector.detectFacesAsync(photo.uri, {
                        mode: FaceDetector.FaceDetectorMode.fast,
                        detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
                        runClassifications: FaceDetector.FaceDetectorClassifications.none,
                    });

                    if (faces.length === 0) {
                        Alert.alert(
                            'No face detected',
                            'Please make sure your face is clearly visible and try again.'
                        );
                        setScanState('ready');
                        return;
                    }
                } catch (_) {}
            }

            setCapturedUri(photo.uri);
        } catch (e) {
            Alert.alert('Error', 'Failed to take photo. Please try again.');
        }
        setScanState('ready');
    };

    async function handleUsePhoto() {
        if (!capturedUri || !registrationId) return;
        setUploading(true);
        try {
            const url = await uploadFileFromUri(capturedUri, {
                mimeType: 'image/jpeg',
                prefix: 'profile',
            });
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                ...NGROK_HEADERS,
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`${API.RIDERS}/registrations/${registrationId}/selfie`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ selfieUri: url }),
            });
            const json = await res.json();
            if (json.success) {
                router.back();
            } else {
                Alert.alert('Error', json.message || 'Failed to update profile photo.');
            }
        } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Network error. Please try again.');
        } finally {
            setUploading(false);
        }
    }

    const hintText = () => {
        if (scanState === 'ready') return 'Position your face in the oval and tap Take Photo';
        if (scanState === 'capturing') return 'Taking photo…';
        if (scanState === 'verifying') return 'Verifying face…';
        return '';
    };

    const ovalBorderColor = scanState === 'ready' ? '#fff' : '#FACC15';
    const buttonEnabled = scanState === 'ready';

    return (
        <View style={s.fill}>
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="front" />
            <View style={s.overlay} pointerEvents="none">
                <View style={[s.darkBlock, { height: (SCREEN_H - OVAL_H) / 2 - 60 }]} />
                <View style={s.ovalRow}>
                    <View style={[s.darkSide, { width: (SCREEN_W - OVAL_W) / 2 }]} />
                    <View style={[s.ovalBorder, { borderColor: ovalBorderColor }]} />
                    <View style={[s.darkSide, { width: (SCREEN_W - OVAL_W) / 2 }]} />
                </View>
                <View style={[s.darkBlock, { flex: 1 }]} />
            </View>

            <SafeAreaView style={s.hud} edges={['top', 'bottom']} pointerEvents="box-none">
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={s.hudTitle}>Update Profile Photo</Text>
                <View style={{ flex: 1 }} />
                <Text style={s.hint}>{hintText()}</Text>
                <TouchableOpacity
                    style={[s.shutterBtn, !buttonEnabled && s.shutterDisabled]}
                    onPress={handleTakePhoto}
                    disabled={!buttonEnabled}
                >
                    <Text style={s.shutterText}>
                        {scanState === 'capturing' || scanState === 'verifying'
                            ? 'Verifying…'
                            : 'Take Photo'}
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const s = StyleSheet.create({
    fill: { flex: 1, backgroundColor: '#000' },
    safe: { flex: 1, backgroundColor: '#000' },

    permScreen: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    permTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginTop: 20, marginBottom: 10 },
    permSub: { fontSize: 15, color: '#475569', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    permBtn: {
        backgroundColor: '#1E3A8A',
        borderRadius: 27,
        paddingHorizontal: 40,
        paddingVertical: 14,
        marginBottom: 16,
    },
    permBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    backLink: { padding: 8 },
    backLinkText: { color: '#64748B', fontSize: 15 },

    previewContainer: { flex: 1, padding: 24 },
    previewImage: { flex: 1, width: '100%', borderRadius: 16, resizeMode: 'cover' },
    previewActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
    retakeBtn: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    retakeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    useBtn: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#1E3A8A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    useBtnDisabled: { opacity: 0.6 },
    useBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'column',
    },
    darkBlock: { width: '100%', backgroundColor: 'rgba(0,0,0,0.55)' },
    ovalRow: { flexDirection: 'row', height: OVAL_H, alignItems: 'center' },
    darkSide: { height: OVAL_H, backgroundColor: 'rgba(0,0,0,0.55)' },
    ovalBorder: {
        width: OVAL_W,
        height: OVAL_H,
        borderRadius: OVAL_W / 2,
        borderWidth: 3,
        borderColor: '#fff',
        backgroundColor: 'transparent',
    },
    hud: { ...StyleSheet.absoluteFillObject, paddingHorizontal: 24 },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    hudTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
        marginTop: 8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    hint: {
        color: '#fff',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    shutterBtn: {
        height: 54,
        borderRadius: 27,
        backgroundColor: '#1E3A8A',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    shutterDisabled: { opacity: 0.5 },
    shutterText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
