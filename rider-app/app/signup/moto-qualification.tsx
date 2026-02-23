import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSignup } from '../../context/SignupContext';

// Motorcycle: 2 ข้อ (ไม่มี vehicle criteria)
const STEPS = [
    {
        title: 'Are you interested in registering as a driver partner with Wit?',
        requirements: null,
    },
    {
        title: 'Do you meet all the required qualifications?',
        requirements: [
            'Aged 18 years or above and not over 70 years old',
            'Thai nationality',
            'A valid (non-expired) driving license',
        ],
    },
];

export default function MotoQualificationScreen() {
    const router = useRouter();
    const { setField } = useSignup();

    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<(boolean | null)[]>([null, null]);
    const [showInfo, setShowInfo] = useState(false);
    const [firstNoStep, setFirstNoStep] = useState(0);

    const current = STEPS[step];
    const isLast = step === STEPS.length - 1;

    const handleAnswer = (answer: boolean) => {
        const newAnswers = [...answers];
        newAnswers[step] = answer;
        setAnswers(newAnswers);

        if (isLast) {
            const firstNo = newAnswers.findIndex(a => a === false);
            if (firstNo !== -1) {
                setFirstNoStep(firstNo);
                setShowInfo(true);
            } else {
                // Save vehicle type and proceed to selfie flow
                setField('vehicleType', 'motorcycle');
                router.replace('/signup/selfie-guide?vehicleType=motorcycle' as any);
            }
        } else {
            setStep(step + 1);
        }
    };

    const handleProceed = () => {
        setAnswers([null, null]);
        setStep(firstNoStep);
        setShowInfo(false);
    };

    // ---------- Before you sign up ----------
    if (showInfo) {
        return (
            <SafeAreaView style={s.safe}>
                <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 16 }}>
                    <Text style={s.infoTitle}>Before you sign up</Text>
                    <Text style={s.infoSubtitle}>
                        For everyone's safety, you need to meet all of our requirements and have the relevant documents
                    </Text>

                    <View style={s.divider} />

                    <View style={s.infoSection}>
                        <Text style={s.sectionTitle}>Steps to register as a driver partner</Text>
                        <Text style={s.sectionBody}>
                            Thank you for your interest. If you would like to register, you can sign up through the Wit Driver application
                        </Text>
                    </View>

                    <View style={s.divider} />

                    <View style={s.infoSection}>
                        <Text style={s.sectionTitle}>Applicant qualifications</Text>
                        <Text style={s.sectionBody}>
                            If you are under 18 years old, you are currently not eligible to register as a driver partner.
                        </Text>
                    </View>
                </ScrollView>

                <TouchableOpacity style={s.proceedBanner} onPress={handleProceed}>
                    <View style={s.proceedIcon}>
                        <Text style={{ fontSize: 22 }}>✅</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.proceedQuestion}>Do you have all the requirements above?</Text>
                        <Text style={s.proceedLink}>Click here to proceed</Text>
                    </View>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // ---------- Step screens ----------
    return (
        <SafeAreaView style={s.safe}>
            <View style={s.body}>
                <Text style={s.title}>{current.title}</Text>

                {current.requirements && (
                    <View style={s.reqBox}>
                        {current.requirements.map((req, i) => (
                            <View key={i} style={s.reqRow}>
                                <Text style={s.bullet}>•</Text>
                                <Text style={s.reqText}>{req}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            <View style={s.footer}>
                <TouchableOpacity style={s.btn} onPress={() => handleAnswer(false)}>
                    <Text style={s.btnText}>No</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btn} onPress={() => handleAnswer(true)}>
                    <Text style={s.btnText}>Yes</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    body: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },

    title: { fontSize: 22, fontWeight: '800', color: '#0F172A', lineHeight: 32, marginBottom: 28 },
    reqBox: {
        backgroundColor: '#E8EAF0',
        borderWidth: 1,
        borderColor: '#B0B8CC',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 10,
    },
    reqRow: { flexDirection: 'row', gap: 8 },
    bullet: { fontSize: 14, color: '#334155', lineHeight: 22 },
    reqText: { flex: 1, fontSize: 14, color: '#334155', lineHeight: 22 },
    footer: { flexDirection: 'row', gap: 16, paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12 },
    btn: { flex: 1, height: 52, borderRadius: 26, backgroundColor: '#506B8F', alignItems: 'center', justifyContent: 'center' },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    infoTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
    infoSubtitle: { fontSize: 13, color: '#64748B', lineHeight: 20 },
    divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 20 },
    infoSection: { gap: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    sectionBody: { fontSize: 14, color: '#334155', lineHeight: 22 },

    proceedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingHorizontal: 24,
        paddingVertical: 18,
        backgroundColor: '#fff',
    },
    proceedIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    proceedQuestion: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    proceedLink: { fontSize: 13, color: '#2563EB', marginTop: 2 },
});
