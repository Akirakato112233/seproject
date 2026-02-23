import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useSignup } from '../../context/SignupContext';

const SELFIE_RULES = [
    'Do not remove your shirt',
    'Wear appropriate attire (avoid sleeveless tops or spaghetti straps)',
    'Do not wear hats, sunglasses, face masks, or earphones',
    'Your eyes must be clearly visible and your face should not be too close',
    'Take the photo in landscape orientation only (hold your phone horizontally)',
    'Do not use photo filters and avoid taking photos with strong light or shadows on your face',
];

export default function SelfieGuideScreen() {
    const router = useRouter();
    const { setDevMode } = useAuth();
    const { data } = useSignup();
    const selfieUri = data.selfieUri;
    const params = useLocalSearchParams<{ vehicleType?: string }>();

    const vehicleType = params.vehicleType === 'motorcycle'
        ? 'Motorcycle | รถจักรยานยนต์'
        : 'Car | รถยนต์ส่วนบุคคล';

    const handleContinue = () => {
        router.push('/signup/national-id' as any);
    };

    const handleTakeSelfie = () => {
        router.push('/signup/photo-requirements' as any);
    };

    return (
        <SafeAreaView style={s.safe} edges={['bottom']}>
            {/* Banner */}
            <View style={s.banner}>
                <View style={s.bannerPlaceholder}>
                    {/* Phone icon mockup */}
                    <View style={s.phoneCard}>
                        <View style={s.avatarCircle}>
                            <Ionicons name="person" size={36} color="#fff" />
                        </View>
                        <View style={s.checkBar}>
                            <Ionicons name="checkmark" size={16} color="#fff" />
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 24 }}>
                <Text style={s.hey}>Hey!</Text>
                <Text style={s.applying}>You're applying for {vehicleType}</Text>

                {/* Selfie button */}
                <View style={s.selfieWrap}>
                    <TouchableOpacity
                        style={[s.selfieBtn, selfieUri ? s.selfieBtnDone : null]}
                        onPress={handleTakeSelfie}
                    >
                        {selfieUri ? (
                            <Image source={{ uri: selfieUri }} style={s.selfiePhoto} />
                        ) : (
                            <Ionicons name="camera" size={32} color="#1E293B" />
                        )}
                    </TouchableOpacity>
                    {selfieUri ? (
                        <View style={s.selfieCheckRow}>
                            <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                            <Text style={[s.selfieLabel, { color: '#22C55E' }]}>Photo taken</Text>
                        </View>
                    ) : (
                        <Text style={s.selfieLabel}>Take Selfie</Text>
                    )}
                </View>

                {/* Rules */}
                <View style={s.rulesBox}>
                    {SELFIE_RULES.map((rule, i) => (
                        <View key={i} style={s.ruleRow}>
                            <Text style={s.bullet}>•</Text>
                            <Text style={s.ruleText}>{rule}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Continue */}
            <View style={s.footer}>
                <TouchableOpacity style={s.continueBtn} onPress={handleContinue}>
                    <Text style={s.continueBtnText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },

    // Banner
    banner: {
        height: 220,
        backgroundColor: '#BFD9F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    phoneCard: {
        width: 90,
        height: 130,
        backgroundColor: '#fff',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
        padding: 12,
    },
    avatarCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkBar: {
        backgroundColor: '#22C55E',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 6,
        alignItems: 'center',
    },

    // Body
    body: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
    hey: { fontSize: 28, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginBottom: 6 },
    applying: { fontSize: 16, color: '#334155', textAlign: 'center', marginBottom: 28 },

    // Selfie button
    selfieWrap: { alignItems: 'center', marginBottom: 28, gap: 10 },
    selfieBtn: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
    },
    selfieBtnDone: {
        borderColor: '#22C55E',
        borderStyle: 'solid',
        borderWidth: 2.5,
    },
    selfiePhoto: {
        width: 90,
        height: 90,
        borderRadius: 45,
    },
    selfieLabel: { fontSize: 14, color: '#64748B' },
    selfieCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },

    // Rules
    rulesBox: { gap: 12 },
    ruleRow: { flexDirection: 'row', gap: 8 },
    bullet: { fontSize: 14, color: '#334155', lineHeight: 22 },
    ruleText: { flex: 1, fontSize: 14, color: '#334155', lineHeight: 22 },

    // Footer
    footer: { paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12 },
    continueBtn: {
        height: 54,
        borderRadius: 27,
        backgroundColor: '#0E3A78',
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
