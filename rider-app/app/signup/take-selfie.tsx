import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Alert,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const OVAL_W = SCREEN_W * 0.72;
const OVAL_H = OVAL_W * 1.25;

// How many seconds user must hold face in frame before button enables
const DETECT_DELAY_MS = 2000;

type ScanState = 'idle' | 'scanning' | 'detected' | 'capturing';

export default function TakeSelfieScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [scanState, setScanState] = useState<ScanState>('idle');
    const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const progressAnim = useRef(new Animated.Value(0)).current;

    // Reset and restart scan every time this screen is focused (e.g. coming back from Retake)
    useFocusEffect(
        useCallback(() => {
            // Stop any in-progress animation
            progressAnim.stopAnimation();
            progressAnim.setValue(0);
            setScanState('idle');
            // Small delay to let camera mount first, then start scan
            const t = setTimeout(() => {
                setScanState('scanning');
                Animated.timing(progressAnim, {
                    toValue: 1,
                    duration: DETECT_DELAY_MS,
                    useNativeDriver: false,
                }).start(({ finished }) => {
                    if (finished) setScanState('detected');
                });
            }, 600);
            return () => {
                clearTimeout(t);
                if (scanTimer.current) clearTimeout(scanTimer.current);
                progressAnim.stopAnimation();
            };
        }, [])
    );

    if (!permission) return <View style={s.fill} />;

    if (!permission.granted) {
        return (
            <SafeAreaView style={s.permScreen}>
                <Ionicons name="camera-outline" size={64} color="#1E3A8A" />
                <Text style={s.permTitle}>Camera Access Needed</Text>
                <Text style={s.permSub}>
                    We need camera access to take your selfie for registration.
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

    // ── Camera ready: start scanning ─────────────────────────────────────────
    const handleCameraReady = () => {
        startScanning();
    };

    const startScanning = () => {
        if (scanTimer.current) clearTimeout(scanTimer.current);
        setScanState('scanning');
        progressAnim.setValue(0);

        // Animate progress bar from 0 → 1 over DETECT_DELAY_MS
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: DETECT_DELAY_MS,
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished) {
                setScanState('detected');
            }
        });
    };

    const handleFaceLeft = () => {
        // Re-scan if the user moves their face away (e.g. phone tilt detection)
        // We rely on the user tapping "Re-scan" or we auto-trigger via the hint
        if (scanState === 'detected') {
            setScanState('idle');
            progressAnim.setValue(0);
        }
    };

    // ── Take photo ───────────────────────────────────────────────────────────
    const handleTakePhoto = async () => {
        if (scanState !== 'detected' || !cameraRef.current) return;
        setScanState('capturing');
        try {
            const photo = await cameraRef.current.takePictureAsync({ base64: false });
            if (photo?.uri) {
                router.push((`/signup/photo-preview?uri=${encodeURIComponent(photo.uri)}`) as any);
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to take photo. Please try again.');
            startScanning();
        }
    };

    // ── UI labels ────────────────────────────────────────────────────────────
    const hintText = () => {
        if (scanState === 'idle') return 'Loading camera…';
        if (scanState === 'scanning') return 'Hold still — detecting face…';
        if (scanState === 'detected') return '✅ Face detected! Ready to shoot.';
        return 'Processing…';
    };

    const ovalBorderColor = scanState === 'detected' ? '#22C55E'
        : scanState === 'scanning' ? '#FACC15' : '#fff';

    const buttonEnabled = scanState === 'detected';

    const progressBarWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={s.fill}>
            {/* Full-screen front camera */}
            <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFillObject}
                facing="front"
                onCameraReady={handleCameraReady}
            />

            {/* Dark overlay — oval is transparent */}
            <View style={s.overlay} pointerEvents="none">
                <View style={[s.darkBlock, { height: (SCREEN_H - OVAL_H) / 2 - 60 }]} />
                <View style={s.ovalRow}>
                    <View style={[s.darkSide, { width: (SCREEN_W - OVAL_W) / 2 }]} />
                    <View style={[s.ovalBorder, { borderColor: ovalBorderColor }]} />
                    <View style={[s.darkSide, { width: (SCREEN_W - OVAL_W) / 2 }]} />
                </View>
                <View style={[s.darkBlock, { flex: 1 }]} />
            </View>

            {/* HUD */}
            <SafeAreaView style={s.hud} edges={['top', 'bottom']} pointerEvents="box-none">
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={s.hudTitle}>Before you sign up</Text>

                <View style={{ flex: 1 }} />

                {/* Progress bar during scan */}
                {scanState === 'scanning' && (
                    <View style={s.progressTrack}>
                        <Animated.View style={[s.progressFill, { width: progressBarWidth }]} />
                    </View>
                )}

                <Text style={s.hint}>{hintText()}</Text>

                {/* Re-scan link if face was detected but user wants to retry */}
                {scanState === 'detected' && (
                    <TouchableOpacity style={s.rescanLink} onPress={startScanning}>
                        <Text style={s.rescanText}>Re-scan</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[s.shutterBtn, !buttonEnabled && s.shutterDisabled]}
                    onPress={handleTakePhoto}
                    disabled={!buttonEnabled}
                >
                    <Text style={s.shutterText}>
                        {scanState === 'capturing' ? 'Processing…' : 'Take Photo'}
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const s = StyleSheet.create({
    fill: { flex: 1, backgroundColor: '#000' },

    // Permission screen
    permScreen: {
        flex: 1, backgroundColor: '#fff',
        alignItems: 'center', justifyContent: 'center', padding: 32,
    },
    permTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginTop: 20, marginBottom: 10 },
    permSub: { fontSize: 15, color: '#475569', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    permBtn: {
        backgroundColor: '#1E3A8A', borderRadius: 27,
        paddingHorizontal: 40, paddingVertical: 14, marginBottom: 16,
    },
    permBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    backLink: { padding: 8 },
    backLinkText: { color: '#64748B', fontSize: 15 },

    // Overlay
    overlay: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'column',
    },
    darkBlock: {
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    ovalRow: {
        flexDirection: 'row',
        height: OVAL_H,
        alignItems: 'center',
    },
    darkSide: {
        height: OVAL_H,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    ovalBorder: {
        width: OVAL_W,
        height: OVAL_H,
        borderRadius: OVAL_W / 2,
        borderWidth: 3,
        borderColor: '#fff',
        backgroundColor: 'transparent',
    },

    // HUD
    hud: {
        ...StyleSheet.absoluteFillObject,
        paddingHorizontal: 24,
    },
    backBtn: {
        width: 40, height: 40,
        alignItems: 'center', justifyContent: 'center',
        marginTop: 8,
    },
    hudTitle: {
        fontSize: 22, fontWeight: '700', color: '#fff',
        marginTop: 8, textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
    },
    hint: {
        color: '#fff', fontSize: 14, textAlign: 'center',
        marginBottom: 20,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
    },
    shutterBtn: {
        height: 54, borderRadius: 27,
        backgroundColor: '#1E3A8A',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },
    shutterDisabled: { opacity: 0.5 },
    shutterText: { color: '#fff', fontSize: 17, fontWeight: '700' },

    // Progress bar
    progressTrack: {
        height: 4, borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginBottom: 12, overflow: 'hidden',
    },
    progressFill: {
        height: 4, borderRadius: 2,
        backgroundColor: '#FACC15',
    },

    // Re-scan
    rescanLink: { alignItems: 'center', marginBottom: 8 },
    rescanText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
});
