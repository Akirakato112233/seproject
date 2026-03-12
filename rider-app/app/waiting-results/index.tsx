import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function WaitingResultsScreen() {
    const router = useRouter();

    const handleSkip = () => {
        router.replace('/(tabs)');
    };

    return (
        <LinearGradient
            colors={['#0F172A', '#1E293B', '#0F172A']}
            style={s.gradient}
        >
            <View style={s.content}>
                <Text style={s.brand}>Wit Partner</Text>
                <Text style={s.title}>
                    Drive and <Text style={s.titleHighlight}>Earn</Text> with Wit
                </Text>
                <Text style={s.status}>กำลังตรวจสอบเอกสาร</Text>
                <Text style={s.subStatus}>เราจะติดต่อภายใน 1-2 วัน</Text>
                <TouchableOpacity
                    style={s.skipBtn}
                    onPress={handleSkip}
                    activeOpacity={0.8}
                >
                    <Text style={s.skipText}>ข้ามไปในแอป</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const s = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    brand: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 48,
    },
    titleHighlight: {
        color: '#60A5FA',
    },
    status: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subStatus: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 40,
    },
    skipBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#60A5FA',
        textDecorationLine: 'underline',
    },
});
