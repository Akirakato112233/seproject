import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';

const BG_IMAGE = require('../../assets/images/image.png');
const COLOR_WHITE = '#FFFFFF';
const COLOR_CYAN = '#0CFBFF';

export default function WaitingResultsScreen() {
    const router = useRouter();

    const handleSkip = () => {
        router.replace('/(tabs)');
    };

    return (
        <ImageBackground source={BG_IMAGE} style={s.bg} resizeMode="cover">
            <View style={s.overlay} />
            <View style={s.content}>
                <Text style={s.line1}>Your information</Text>
                <Text style={[s.line2, { color: COLOR_CYAN }]}>is under</Text>
                <Text style={[s.line2, { color: COLOR_CYAN }]}>verification</Text>
                <Text style={s.line3}>The review will be</Text>
                <Text style={s.line3}>completed</Text>
                <Text style={[s.line2, { color: COLOR_CYAN }]}>within 1-2</Text>
                <Text style={s.line3}>business days.</Text>
                <TouchableOpacity
                    style={s.skipBtn}
                    onPress={handleSkip}
                    activeOpacity={0.8}
                >
                    <Text style={s.skipText}>ข้ามไปในแอป</Text>
                </TouchableOpacity>
            </View>
        </ImageBackground>
    );
}

const s = StyleSheet.create({
    bg: { flex: 1 },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    line1: {
        fontSize: 32,
        fontWeight: '800',
        color: COLOR_WHITE,
        textAlign: 'center',
        marginBottom: 4,
    },
    line2: {
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 4,
    },
    line3: {
        fontSize: 32,
        fontWeight: '800',
        color: COLOR_WHITE,
        textAlign: 'center',
        marginBottom: 4,
    },
    skipBtn: {
        marginTop: 48,
        paddingVertical: 14,
        paddingHorizontal: 28,
        backgroundColor: COLOR_CYAN,
        borderRadius: 30,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
});
