import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function PhotoRequirementsScreen() {
    const router = useRouter();
    const { setDevMode } = useAuth();

    const handleTakePhoto = () => {
        router.push('/signup/take-selfie' as any);
    };

    return (
        <SafeAreaView style={s.safe} edges={['bottom']}>
            {/* Back */}
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={26} color="#0F172A" />
            </TouchableOpacity>

            <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 24 }}>
                <Text style={s.title}>Before you sign up</Text>

                {/* Sample photo */}
                <Image
                    source={require('../../assets/images/image copy 2.png')}
                    style={s.sampleImage}
                    resizeMode="cover"
                />
                <Text style={s.sampleLabel}>Sample Document</Text>

                {/* Requirements */}
                <View style={s.sectionRow}>
                    <Text style={s.sectionIcon}>✅</Text>
                    <Text style={s.sectionTitle}>Requirements:</Text>
                </View>
                <View style={s.list}>
                    {[
                        'Wear appropriate attire (avoid sleeveless tops or spaghetti straps)',
                        'Do not wear hats, sunglasses, face masks, or earphones',
                        'Your eyes must be clearly visible, and your face should not be too close',
                        'Take photos in landscape orientation only (hold your phone horizontally while taking the photo)',
                        'Avoid strong light or shadows on your face; photos must be taken in landscape orientation only',
                        'Do not use photo filters or edit the image',
                    ].map((rule, i) => (
                        <View key={i} style={s.row}>
                            <Text style={s.bullet}>•</Text>
                            <Text style={s.ruleText}>{rule}</Text>
                        </View>
                    ))}
                </View>

                {/* Things to avoid */}
                <View style={s.sectionRow}>
                    <Text style={s.sectionIcon}>❌</Text>
                    <Text style={s.sectionTitle}>Things to avoid:</Text>
                </View>
                <View style={s.list}>
                    {[
                        'Expired documents',
                        'Retouched or edited documents',
                        'Blurry or overexposed documents',
                        'Documents with information cut off from the frame',
                    ].map((item, i) => (
                        <View key={i} style={s.row}>
                            <Text style={s.bullet}>•</Text>
                            <Text style={s.ruleText}>{item}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <View style={s.footer}>
                <TouchableOpacity style={s.takePhotoBtn} onPress={handleTakePhoto}>
                    <Text style={s.takePhotoText}>Take Photo</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    backBtn: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
    scroll: { flex: 1, paddingHorizontal: 20 },
    title: { fontSize: 26, fontWeight: '700', color: '#0F172A', marginBottom: 18, marginTop: 6 },

    sampleImage: {
        width: '100%',
        height: 220,
        borderRadius: 8,
        marginBottom: 10,
    },
    sampleLabel: {
        textAlign: 'center',
        fontSize: 13,
        color: '#475569',
        marginBottom: 22,
    },

    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    sectionIcon: { fontSize: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },

    list: { gap: 10, marginBottom: 26, paddingLeft: 4 },
    row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
    bullet: { fontSize: 16, color: '#334155', lineHeight: 22 },
    ruleText: { flex: 1, fontSize: 15, color: '#334155', lineHeight: 22 },

    footer: { paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12 },
    takePhotoBtn: {
        height: 54,
        borderRadius: 27,
        backgroundColor: '#1E3A8A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    takePhotoText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
