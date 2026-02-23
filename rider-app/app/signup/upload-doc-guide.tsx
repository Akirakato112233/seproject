import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSignup } from '../../context/SignupContext';

// ── Config per doc type ─────────────────────────────────────────────────────
const DOC_CONFIG: Record<string, {
    sampleImage: number;
    requirements: string[];
    things: string[];
    contextKey: 'idFrontUri' | 'licenseUri';
}> = {
    id: {
        sampleImage: require('../../assets/images/image copy 3.png'),
        contextKey: 'idFrontUri',
        requirements: [
            'The name, photo, and national ID number must match the applicant\'s information',
            'The national ID card must be in good condition and not expired',
            'The photo must clearly show the ID photo, national ID number, address, date of issue, and date of expiry',
            'To comply with personal data protection laws, please cover or blur sensitive information such as religion or blood type shown on your national ID card (if applicable)',
        ],
        things: [
            'Images that are edited or excessively bright may fail to upload',
            'Photos with glare, reflections, or insufficient lighting may not be approved',
            'Documents with unclear or expired information will not be approved',
        ],
    },
    license: {
        sampleImage: require('../../assets/images/driver_sample.png'),
        contextKey: 'licenseUri',
        requirements: [
            'Please upload a public driving license, if available',
            'If you do not have a public driving license, you may upload a private driving license',
            'The name, photo, and national ID number must match the applicant\'s national ID card',
            'The driving license must be in good condition',
            'The photo must clearly show the license photo, 8-digit license number, date of issue, and date of expiry',
            'The license type must match the service type you are applying for',
        ],
        things: [
            'Images that are edited or excessively bright may fail to upload',
            'Photos with glare, reflections, or insufficient lighting may not be approved',
            'Documents with unclear or expired information will not be approved',
        ],
    },
};

export default function UploadDocGuideScreen() {
    const router = useRouter();
    const { setField } = useSignup();
    const { type } = useLocalSearchParams<{ type?: string }>();

    const config = DOC_CONFIG[type ?? 'id'] ?? DOC_CONFIG.id;

    const handleUpload = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow access to your photo library.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 10],
            quality: 0.9,
        });

        if (!result.canceled && result.assets.length > 0) {
            const uri = result.assets[0].uri;
            setField(config.contextKey, uri);
            router.back();
        }
    };

    return (
        <SafeAreaView style={s.safe} edges={['bottom']}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={26} color="#0F172A" />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={s.content}>
                <Text style={s.title}>Document Upload Guidelines</Text>

                <Image source={config.sampleImage} style={s.sampleCard} resizeMode="contain" />
                <Text style={s.sampleLabel}>Sample Document</Text>

                <View style={s.sectionRow}>
                    <Text style={s.sectionIcon}>✅</Text>
                    <Text style={s.sectionTitle}>Requirements:</Text>
                </View>
                <View style={s.list}>
                    {config.requirements.map((item, i) => (
                        <View key={i} style={s.row}>
                            <Text style={s.bullet}>•</Text>
                            <Text style={s.itemText}>{item}</Text>
                        </View>
                    ))}
                </View>

                <View style={s.sectionRow}>
                    <Text style={s.sectionIcon}>❌</Text>
                    <Text style={s.sectionTitle}>Things to avoid:</Text>
                </View>
                <View style={s.list}>
                    {config.things.map((item, i) => (
                        <View key={i} style={s.row}>
                            <Text style={s.bullet}>•</Text>
                            <Text style={s.itemText}>{item}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <View style={s.footer}>
                <TouchableOpacity style={s.uploadBtn} onPress={handleUpload}>
                    <Text style={s.uploadText}>Upload Document</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    backBtn: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
    content: { paddingHorizontal: 20, paddingBottom: 24 },
    title: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 20 },
    sampleCard: { width: '100%', height: 210, borderRadius: 12, marginBottom: 8 },
    sampleLabel: { textAlign: 'center', fontSize: 13, color: '#475569', marginBottom: 24 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    sectionIcon: { fontSize: 20 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
    list: { gap: 10, marginBottom: 24, paddingLeft: 4 },
    row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
    bullet: { fontSize: 15, color: '#334155' },
    itemText: { flex: 1, fontSize: 15, color: '#334155', lineHeight: 22 },
    footer: { paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12 },
    uploadBtn: {
        height: 54, borderRadius: 27, backgroundColor: '#1E3A8A',
        alignItems: 'center', justifyContent: 'center',
    },
    uploadText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
