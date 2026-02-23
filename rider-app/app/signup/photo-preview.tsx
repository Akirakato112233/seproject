import React from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSignup } from '../../context/SignupContext';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_W } = Dimensions.get('window');
const PHOTO_SIZE = SCREEN_W * 0.55;

export default function PhotoPreviewScreen() {
    const router = useRouter();
    const { setField } = useSignup();
    const { setDevMode } = useAuth();

    // Photo URI is passed from take-selfie via route params
    const { uri } = useLocalSearchParams<{ uri?: string }>();
    const photoUri = uri ?? null;

    const handleRetake = () => {
        router.back(); // Go back to take-selfie
    };

    const handleUpload = () => {
        if (photoUri) {
            setField('selfieUri', photoUri);
        }
        // Go back to selfie-guide so photo appears in the circle
        router.push('/signup/selfie-guide' as any);
    };

    return (
        <SafeAreaView style={s.safe} edges={['bottom']}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={26} color="#0F172A" />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={s.content}>
                {/* Instructions */}
                <Text style={s.notice}>
                    <Text style={s.noticeBold}>To avoid rejection, please take a photo of yourself.{'\n'}Make sure your photo:</Text>
                </Text>
                <View style={s.list}>
                    {[
                        'Is completely within the frame',
                        'Is well-lit and evenly lit',
                        'Includes sufficient space above the head and upper body',
                    ].map((item, i) => (
                        <View key={i} style={s.listRow}>
                            <Text style={s.bullet}>•</Text>
                            <Text style={s.listText}>{item}</Text>
                        </View>
                    ))}
                </View>

                {/* Circular photo preview */}
                <View style={s.photoWrap}>
                    {photoUri ? (
                        <Image source={{ uri: photoUri }} style={s.photo} />
                    ) : (
                        <View style={[s.photo, s.photoPlaceholder]}>
                            <Ionicons name="person" size={64} color="#94A3B8" />
                        </View>
                    )}
                </View>

                {/* Retake */}
                <TouchableOpacity style={s.retakeBtn} onPress={handleRetake}>
                    <Text style={s.retakeText}>Retake Photo</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Upload */}
            <View style={s.footer}>
                <TouchableOpacity style={s.uploadBtn} onPress={handleUpload}>
                    <Text style={s.uploadText}>Upload</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const SCREEN_SIZE = PHOTO_SIZE;

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    backBtn: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },

    content: { paddingHorizontal: 20, paddingBottom: 24, alignItems: 'center' },

    notice: { fontSize: 15, color: '#0F172A', lineHeight: 22, marginBottom: 12, alignSelf: 'flex-start' },
    noticeBold: { fontWeight: '700' },

    list: { alignSelf: 'stretch', marginBottom: 32, gap: 6 },
    listRow: { flexDirection: 'row', gap: 8 },
    bullet: { fontSize: 15, color: '#334155' },
    listText: { flex: 1, fontSize: 15, color: '#334155', lineHeight: 22 },

    photoWrap: {
        width: PHOTO_SIZE,
        height: PHOTO_SIZE,
        borderRadius: PHOTO_SIZE / 2,
        overflow: 'hidden',
        backgroundColor: '#E2E8F0',
        marginBottom: 20,
    },
    photo: {
        width: PHOTO_SIZE,
        height: PHOTO_SIZE,
        borderRadius: PHOTO_SIZE / 2,
    },
    photoPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    retakeBtn: { paddingVertical: 8 },
    retakeText: { fontSize: 16, color: '#1D4ED8', fontWeight: '600' },

    footer: { paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12 },
    uploadBtn: {
        height: 54,
        borderRadius: 27,
        backgroundColor: '#1E3A8A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
