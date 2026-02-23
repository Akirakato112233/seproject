import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Alert,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

const SERVICE_OPTIONS = [
    { label: 'Motorcycle | รถจักรยานยนต์', value: 'motorcycle' },
    { label: 'Car | รถยนต์ส่วนบุคคล', value: 'car' },
];

export default function ServicePreferenceScreen() {
    const router = useRouter();
    const { setDevMode } = useAuth();

    const [selected, setSelected] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    const selectedOption = SERVICE_OPTIONS.find(o => o.value === selected);

    const handleContinue = () => {
        if (!selected) {
            Alert.alert('กรุณาเลือก', 'กรุณาเลือก Service preference ก่อน');
            return;
        }
        if (selected === 'car') {
            router.push('/signup/car-qualification' as any);
        } else {
            // Motorcycle → qualification 2 ข้อ
            router.push('/signup/moto-qualification' as any);
        }
    };

    return (
        <SafeAreaView style={s.safe}>
            {/* Content */}
            <View style={s.body}>
                {/* Back */}
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#111" />
                </TouchableOpacity>

                {/* Header row: title left, illustration right */}
                <View style={s.headerRow}>
                    <View style={s.titleBlock}>
                        <Text style={s.title}>Choose your{'\n'}service preference</Text>
                        <Text style={s.subtitle}>Tell us about yourself.</Text>
                    </View>
                    <View style={s.illustrationWrap}>
                        <Image
                            source={require('../../assets/images/image copy.png')}
                            style={s.illustration}
                            resizeMode="contain"
                        />
                    </View>
                </View>

                {/* Dropdown picker */}
                <TouchableOpacity style={s.picker} onPress={() => setShowModal(true)}>
                    <Text style={[s.pickerText, !selected && { color: '#aaa' }]}>
                        {selectedOption ? selectedOption.label : 'Service preference'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#555" />
                </TouchableOpacity>
            </View>

            {/* Continue Button */}
            <View style={s.footer}>
                <TouchableOpacity
                    style={[s.continueBtn, !selected && s.continueBtnDisabled]}
                    onPress={handleContinue}
                    activeOpacity={selected ? 0.85 : 1}
                >
                    <Text style={s.continueBtnText}>Continue</Text>
                </TouchableOpacity>
            </View>

            {/* Modal */}
            <Modal visible={showModal} transparent animationType="slide">
                <TouchableOpacity style={s.modalOverlay} onPress={() => setShowModal(false)} />
                <View style={s.modalSheet}>
                    <Text style={s.modalTitle}>Select service preference</Text>
                    {SERVICE_OPTIONS.map((opt) => (
                        <TouchableOpacity
                            key={opt.value}
                            style={s.modalItem}
                            onPress={() => { setSelected(opt.value); setShowModal(false); }}
                        >
                            <Text style={s.modalItemText}>{opt.label}</Text>
                            {/* Radio button */}
                            <View style={[s.radio, selected === opt.value && s.radioSelected]}>
                                {selected === opt.value && <View style={s.radioDot} />}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },

    body: {
        flex: 1,
        paddingHorizontal: 24,
    },

    backBtn: {
        marginTop: 8,
        marginBottom: 16,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 28,
    },
    titleBlock: {
        flex: 1,
        paddingRight: 8,
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: '#0F172A',
        lineHeight: 34,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 13,
        color: '#64748B',
    },
    illustrationWrap: {
        width: 170,
        height: 130,
        alignItems: 'center',
        justifyContent: 'center',
    },
    illustration: {
        width: 175,
        height: 135,
    },

    picker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        height: 52,
        paddingHorizontal: 16,
    },
    pickerText: {
        fontSize: 15,
        color: '#0F172A',
    },

    footer: {
        paddingHorizontal: 24,
        paddingBottom: 36,
        paddingTop: 12,
        backgroundColor: '#fff',
    },
    continueBtn: {
        height: 54,
        borderRadius: 27,
        backgroundColor: '#0E3A78',
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueBtnDisabled: {
        backgroundColor: '#94A3B8',
    },
    continueBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 20,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalItemText: {
        fontSize: 15,
        color: '#0F172A',
        fontWeight: '500',
    },

    // Radio button
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        borderColor: '#0E3A78',
        backgroundColor: '#0E3A78',
    },
    radioDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
});
